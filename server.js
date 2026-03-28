let App = {}

App.express = require(`express`)
App.app = App.express()
let http = require(`http`)
let WebSocket = require(`ws`)
let path = require(`path`)
let fs = require(`fs`)
App.server = http.createServer(App.app)
App.wss = new WebSocket.Server({server: App.server})
App.shared = require(`./js/shared.js`)
App.actions = require(`./actions.js`)

App.zone_states = {}
App.next_client_id = 1
App.words = new Set()
App.default_speed = 3
App.block_seconds = 60
App.spam_limit = 10
App.blocked_ips = {}
App.transmission_limit = 60
App.soft_block_seconds = 10
App.zone_data_changed = false
App.save_data_interval = 2 * 1000
App.max_words = 10

App.get_version = () => {
  try {
    App.package = JSON.parse(fs.readFileSync(path.join(__dirname, `package.json`), `utf8`))
    App.version = App.package.version || `0.0.0`
  }
  catch (err) {
    App.version = `0.0.0`
  }
}

App.get_words = () => {
  try {
    let data = fs.readFileSync(path.join(__dirname, `words.txt`), `utf8`)

    data.split(`\n`).forEach(line => {
      let word = line.trim()

      if (word) {
        App.words.add(word)
      }
    })

    console.log(`Loaded ${App.words.size} words.`)
  }
  catch (err) {
    console.error(`Error loading words.txt:`, err)
  }
}

App.word_match = (word) => {
  return App.words.has(word)
}

App.get_zone_data = () => {
  App.zone_data = {}
  App.data_file = path.join(__dirname, `data.json`)

  try {
    if (fs.existsSync(App.data_file)) {
      App.zone_data = JSON.parse(fs.readFileSync(App.data_file, `utf8`))
    }
  }
  catch (err) {
    console.error(`Error loading data.json:`, err)
  }
}

App.save_zone_data = () => {
  fs.writeFileSync(App.data_file, JSON.stringify(App.zone_data, null, 2), `utf8`)
}

App.update_zone_activity = (zone, activity = false) => {
  if (!App.zone_data[zone]) {
    App.zone_data[zone] = {words: [], last_activity: 0}
  }

  if (activity) {
    App.zone_data[zone].last_activity = Date.now()
  }

  App.zone_data_changed = true
}

App.setup_server = () => {
  App.app.use((req, res, next) => {
    let cookies = req.headers.cookie || ``

    if (!cookies.includes(`date_join=`)) {
      res.cookie(`date_join`, Date.now().toString(), {maxAge: 10 * 365 * 24 * 60 * 60 * 1000})
    }

    next()
  })

  App.app.use(App.express.static(__dirname))

  App.app.get(`/`, (req, res) => {
    res.sendFile(path.join(__dirname, `index.html`))
  })
}

App.broadcast_zone_count = (zone, username = ``, event = ``) => {
  let count_zone = 0
  let count_global = 0

  App.wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (client.zone === zone) {
        count_zone += 1
      }

      count_global += 1
    }
  })

  App.wss.clients.forEach((client) => {
    if ((client.readyState === WebSocket.OPEN) && (client.zone === zone)) {
      client.send(JSON.stringify({type: `USERS`, count_zone, count_global, username, event}))
    }
  })
}

App.broadcast_zone_words = (zone, client = null) => {
  let words = App.zone_data[zone] ? App.zone_data[zone].words : []
  let msg = JSON.stringify({type: `WORDS`, words})

  if (client) {
    client.send(msg)
  }
  else {
    App.wss.clients.forEach((c) => {
      if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
        c.send(msg)
      }
    })
  }
}

App.get_zone_state = (zone) => {
  if (!App.zone_states[zone]) {
    let z_num = parseInt(zone.charAt(1))

    if (isNaN(z_num)) {
      z_num = App.default_speed
    }

    let settings = App.shared.zone_settings[z_num] || App.shared.zone_settings[5]

    App.zone_states[zone] = {
      current_sequence: ``,
      letters: [],
      press_start_time: 0,
      letter_timeout: null,
      word_timeout: null,
      last_active_ws: null,
      lock_expires: 0,
      control_start_time: 0,
      takeover_time: 0,
      settings,
    }
  }

  return App.zone_states[zone]
}

App.get_last_username = (zone) => {
  let z_state = App.zone_states[zone]
  return z_state.last_active_ws ? z_state.last_active_ws.username : ``
}

App.send_letter = (args = {}) => {
  let def_args = {
    letter: ``,
    username: ``,
    zone: ``,
  }

  if (!args.username) {
    args.username = App.get_last_username(args.zone)
  }

  App.shared.def_args(def_args, args)
  let msg = JSON.stringify({type: `LETTER`, letter: args.letter, username: args.username})

  App.wss.clients.forEach((c) => {
    if ((c.readyState === WebSocket.OPEN) && (c.zone === args.zone)) {
      c.send(msg)
    }
  })
}

App.send_sequence = (args = {}) => {
  let def_args = {
    sequence: ``,
    username: ``,
    zone: ``,
  }

  if (!args.username) {
    args.username = App.get_last_username(args.zone)
  }

  App.shared.def_args(def_args, args)
  let msg_seq = JSON.stringify({type: `SEQUENCE`, sequence: args.sequence, username: args.username})

  App.wss.clients.forEach((c) => {
    if ((c.readyState === WebSocket.OPEN) && (c.zone === args.zone)) {
      c.send(msg_seq)
    }
  })
}

App.resolve_letter = (zone) => {
  let z_state = App.zone_states[zone]

  if (!z_state || !z_state.current_sequence) {
    return
  }

  App.actions.check_code(z_state.last_active_ws, zone, z_state.current_sequence)
  let letter = App.shared.morse_code[z_state.current_sequence] || ``

  if (letter !== `@`) {
    z_state.letters.push(letter)
  }

  if (letter) {
    App.send_letter({letter, zone})
  }
  else {
    App.send_sequence({zone})
  }

  z_state.current_sequence = ``
  z_state.control_start_time = Date.now()
  let unit = z_state.last_active_ws ? z_state.last_active_ws.unit_duration || z_state.settings.unit_duration : z_state.settings.unit_duration
  z_state.word_timeout = setTimeout(() => App.resolve_word(zone), unit * z_state.settings.word_mult)
}

App.resolve_word = (zone) => {
  let z_state = App.zone_states[zone]

  if (!z_state || !z_state.letters.length) {
    return
  }

  let word = z_state.letters.join(``)
  App.actions.check_word(z_state.last_active_ws, zone, word)
  let msg = JSON.stringify({type: `WORD`, word, letters: z_state.letters, username: z_state.last_active_ws ? z_state.last_active_ws.username : ``})
  z_state.letters = []

  App.wss.clients.forEach((c) => {
    if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
      c.send(msg)
    }
  })

  App.process_word(zone, word, z_state.last_active_ws)
}

App.help_text = `https://www.youtube.com/watch?v=spdfnqS3bDg`

App.process_word = (zone, word, ws) => {
  if ([`HELP`, `SOS`].includes(word)) {
    if (ws && (ws.readyState === WebSocket.OPEN)) {
      App.send_message(ws, App.help_text, true)
    }
  }

  if ((word.length >= 3) && App.word_match(word.toLowerCase())) {
    if (!App.zone_data[zone]) {
      App.zone_data[zone] = {words: []}
    }

    App.zone_data[zone].words = App.zone_data[zone].words.filter(w => w !== word)
    App.zone_data[zone].words.push(word)

    if (App.zone_data[zone].words.length > App.max_words) {
      App.zone_data[zone].words.shift()
    }

    App.zone_data_changed = true
    App.broadcast_zone_words(zone)
  }
}

App.go_to_zone = (ws) => {
  ws.send(JSON.stringify({type: `ZONE`, zone: ws.zone, username: ws.username, version: App.version}))
}

App.setup_sockets = () => {
  App.wss.on(`connection`, (ws, req) => {
    let cookies = req.headers.cookie || ``
    let date_join_match = cookies.match(/(?:^|;\s*)date_join=([^;]+)/)
    ws.date_join = date_join_match ? parseInt(date_join_match[1], 10) : Date.now()
    ws.is_alive = true
    ws.id = App.next_client_id++
    ws.ip = req.headers[`x-forwarded-for`] || req.socket.remoteAddress
    ws.username = App.shared.random_word(3, ws.date_join || ws.ip, true)
    ws.zone = App.default_zone()
    ws.unit_duration = null
    ws.penalty_expires = App.blocked_ips[ws.ip] || 0

    ws.on(`pong`, () => {
      ws.is_alive = true
    })

    ws.on(`message`, (message) => {
      let data

      try {
        data = JSON.parse(message.toString())
      }
      catch (err) {
        return
      }

      let signal = data.type

      if (signal === `RESTORE_ZONE`) {
        if (data.zone) {
          let old_zone = ws.zone
          App.force_release(ws, old_zone)
          ws.zone = data.zone
          App.go_to_zone(ws)

          if (old_zone !== ws.zone) {
            App.broadcast_zone_count(old_zone, ws.username, `leave`)
            App.broadcast_zone_count(ws.zone, ws.username, `join`)
            App.broadcast_zone_words(ws.zone, ws)
          }

          App.update_zone_activity(ws.zone)
        }

        return
      }

      if (signal === `GET_ZONES`) {
        let zones_info = {}

        for (let z in App.zone_data) {
          zones_info[z] = {
            last_activity: App.zone_data[z].last_activity,
          }
        }

        ws.send(JSON.stringify({type: `ZONES_INFO`, zones: zones_info}))
        return
      }

      if ((signal !== `DOWN`) && (signal !== `UP`)) {
        return
      }

      let now = Date.now()

      if (App.blocked_ips[ws.ip] && (now < App.blocked_ips[ws.ip])) {
        ws.penalty_expires = App.blocked_ips[ws.ip]
      }

      if (ws.penalty_expires && (now < ws.penalty_expires)) {
        return
      }

      App.update_zone_activity(ws.zone, true)

      let z_state = App.get_zone_state(ws.zone)

      if (!ws.unit_duration) {
        ws.unit_duration = z_state.settings.unit_duration
      }

      if (z_state.last_active_ws && (z_state.last_active_ws !== ws)) {
        if (now < z_state.lock_expires) {
          return
        }

        z_state.is_pressed = false
        clearTimeout(z_state.letter_timeout)
        clearTimeout(z_state.word_timeout)

        if (z_state.current_sequence) {
          App.resolve_letter(ws.zone)
        }

        if (z_state.letters.length) {
          clearTimeout(z_state.word_timeout)
          App.resolve_word(ws.zone)
        }
      }
      else if (z_state.last_active_ws === ws) {
        if (now > z_state.lock_expires) {
          z_state.takeover_time = now
        }

        if (!z_state.current_sequence && !z_state.is_pressed && (signal === `DOWN`)) {
          z_state.control_start_time = now
        }

        if ((now - z_state.control_start_time) > (App.spam_limit * 1000)) {
          ws.penalty_expires = now + App.block_seconds * 1000
          App.blocked_ips[ws.ip] = ws.penalty_expires
          App.force_release(ws, ws.zone)
          App.block_message(ws, App.block_seconds)
          return
        }

        if ((now - z_state.takeover_time) > (App.transmission_limit * 1000)) {
          ws.penalty_expires = now + App.soft_block_seconds * 1000
          App.blocked_ips[ws.ip] = ws.penalty_expires
          App.force_release(ws, ws.zone)
          App.block_message(ws, App.soft_block_seconds)
          return
        }
      }

      if (z_state.last_active_ws !== ws) {
        z_state.last_active_ws = ws
        z_state.control_start_time = now
        z_state.takeover_time = now
      }

      z_state.lock_expires = now + 3000

      if (signal === `DOWN`) {
        if (z_state.is_pressed) {
          return
        }

        z_state.is_pressed = true
        z_state.press_start_time = now
        clearTimeout(z_state.letter_timeout)
        clearTimeout(z_state.word_timeout)
        let msg_down = JSON.stringify({type: `DOWN`, username: ws.username})

        App.wss.clients.forEach((client) => {
          if ((client !== ws) && (client.readyState === WebSocket.OPEN) && (client.zone === ws.zone)) {
            client.send(msg_down)
          }
        })
      }
      else if (signal === `UP`) {
        if (z_state.last_active_ws && (z_state.last_active_ws !== ws)) {
          return
        }

        if (!z_state.is_pressed) {
          return
        }

        z_state.is_pressed = false

        if (z_state.press_start_time) {
          let duration = now - z_state.press_start_time
          let max_seq_length = 15

          if (z_state.current_sequence.length < max_seq_length) {
            if (duration < ws.unit_duration * 1.5) {
              z_state.current_sequence += `.`
              let estimated_unit = duration
              ws.unit_duration = ws.unit_duration * 0.7 + estimated_unit * 0.3
            }
            else {
              z_state.current_sequence += `-`
              let estimated_unit = duration / 3
              ws.unit_duration = ws.unit_duration * 0.7 + estimated_unit * 0.3
            }
          }

          let min_u = z_state.settings.forgiving ? 150 : z_state.settings.unit_duration * 0.8
          let max_u = z_state.settings.forgiving ? 500 : z_state.settings.unit_duration * 1.2
          ws.unit_duration = Math.max(min_u, Math.min(max_u, ws.unit_duration))
          let msg_up = JSON.stringify({type: `UP`, username: ws.username})

          App.wss.clients.forEach((client) => {
            if ((client !== ws) && (client.readyState === WebSocket.OPEN) && (client.zone === ws.zone)) {
              client.send(msg_up)
            }
          })

          App.send_sequence({sequence: z_state.current_sequence, username: ws.username, zone: ws.zone})
          z_state.letter_timeout = setTimeout(() => App.resolve_letter(ws.zone), ws.unit_duration * z_state.settings.letter_mult)
        }
      }
    })

    ws.on(`close`, () => {
      App.force_release(ws, ws.zone)
      App.broadcast_zone_count(ws.zone, ws.username, `leave`)
    })

    App.broadcast_zone_count(ws.zone, ws.username, `join`)
    App.broadcast_zone_words(ws.zone, ws)
    App.go_to_zone(ws)
  })
}

App.start_server = () => {
  let port = process.env.PORT || 3773

  App.server.listen(port, () => {
    console.log(`Mall Code server running on http://localhost:${port}`)
  })

  setInterval(() => {
    let now = Date.now()

    for (let ip in App.blocked_ips) {
      if (now > App.blocked_ips[ip]) {
        delete App.blocked_ips[ip]
      }
    }

    App.wss.clients.forEach((ws) => {
      if (!ws.is_alive) {
        return ws.terminate()
      }

      ws.is_alive = false
      ws.ping()
    })
  }, 30 * 1000)

  setInterval(() => {
    if (App.zone_data_changed) {
      App.save_zone_data()
      App.zone_data_changed = false
    }
  }, App.save_data_interval)
}

App.default_zone = () => {
  let date = new Date()
  let day = String(date.getDate()).padStart(2, `0`)
  let month = String(date.getMonth() + 1).padStart(2, `0`)
  let year = date.getFullYear()
  let date_str = `${day}/${month}/${year}`
  let hash = App.shared.get_string_hash(date_str)
  let rng = App.shared.create_seeded_random(hash)
  let letter = String.fromCharCode(65 + Math.floor(rng() * 26))
  return `${letter}${App.default_speed}`
}

App.force_release = (ws, zone) => {
  let z_state = App.zone_states[zone]

  if (z_state && (z_state.last_active_ws === ws)) {
    if (z_state.is_pressed) {
      z_state.is_pressed = false
      let msg_up = JSON.stringify({type: `UP`, username: ws.username})

      App.wss.clients.forEach((client) => {
        if ((client !== ws) && (client.readyState === WebSocket.OPEN) && (client.zone === zone)) {
          client.send(msg_up)
        }
      })
    }

    z_state.current_sequence = ``
    z_state.letters = []
    z_state.press_start_time = 0
    clearTimeout(z_state.letter_timeout)
    clearTimeout(z_state.word_timeout)
    z_state.last_active_ws = null
    z_state.lock_expires = 0
    z_state.control_start_time = 0
    z_state.takeover_time = 0
    App.send_sequence({username: ws.username, zone})
  }
}

App.send_message = (ws, text, pissed = false) => {
  ws.send(JSON.stringify({
    type: `MODAL`,
    text,
    pissed,
  }))
}

App.block_message = (ws, seconds) => {
  App.send_message(ws, `You have been blocked for ${seconds} seconds`)
}

App.get_version()
App.get_words()
App.get_zone_data()
App.setup_sockets()
App.setup_server()
App.start_server()