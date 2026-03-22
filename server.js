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

App.zone_states = {}
App.next_client_id = 1
App.nouns = new Set()
App.default_speed = 3

App.get_nouns = () => {
  try {
    let nouns_data = fs.readFileSync(path.join(__dirname, `nouns.txt`), `utf8`)

    nouns_data.split(`\n`).forEach(line => {
      let word = line.trim()

      if (word) {
        App.nouns.add(word)
      }
    })
  }
  catch (err) {
    console.error(`Error loading nouns.txt:`, err)
  }
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

App.setup_server = () => {
  App.app.use(App.express.static(__dirname))

  App.app.get(`/`, (req, res) => {
    res.sendFile(path.join(__dirname, `index.html`))
  })
}

App.broadcast_zone_count = (zone) => {
  let count = 0

  App.wss.clients.forEach((client) => {
    if ((client.readyState === WebSocket.OPEN) && (client.zone === zone)) {
      count++
    }
  })

  App.wss.clients.forEach((client) => {
    if ((client.readyState === WebSocket.OPEN) && (client.zone === zone)) {
      client.send(JSON.stringify({type: `USERS`, count}))
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
      current_word: ``,
      press_start_time: 0,
      letter_timeout: null,
      word_timeout: null,
      last_active_ws: null,
      lock_expires: 0,
      settings,
    }
  }

  return App.zone_states[zone]
}

App.resolve_letter = (zone) => {
  let z_state = App.zone_states[zone]

  if (!z_state || !z_state.current_sequence) {
    return
  }

  let letter = App.shared.morse_code[z_state.current_sequence] || `@`

  if (letter !== `@`) {
    z_state.current_word += letter
  }

  let msg = JSON.stringify({type: `LETTER`, char: letter, username: z_state.last_active_ws ? z_state.last_active_ws.username : ``})

  App.wss.clients.forEach((c) => {
    if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
      c.send(msg)
    }
  })

  z_state.current_sequence = ``
  let unit = z_state.last_active_ws ? z_state.last_active_ws.unit_duration || z_state.settings.unit_duration : z_state.settings.unit_duration
  z_state.word_timeout = setTimeout(() => App.resolve_word(zone), unit * z_state.settings.word_mult)
}

App.resolve_word = (zone) => {
  let z_state = App.zone_states[zone]

  if (!z_state || !z_state.current_word) {
    return
  }

  let current_word = z_state.current_word
  z_state.current_word = ``
  let msg = JSON.stringify({type: `WORD`, word: current_word, username: z_state.last_active_ws ? z_state.last_active_ws.username : ``})

  App.wss.clients.forEach((c) => {
    if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
      c.send(msg)
    }
  })

  App.process_word(zone, current_word, z_state.last_active_ws)
}

App.help_text = `Use the dials on the top right to change zones.
The higher the number the higher the speed.
For example: E4, G1, X9.`

App.process_word = (zone, current_word, ws) => {
  if (current_word === `HELP`) {
    if (ws && (ws.readyState === WebSocket.OPEN)) {
      ws.send(JSON.stringify({
        type: `MODAL`,
        text: App.help_text,
      }))
    }
  }

  if ((current_word.length >= 3) && App.nouns.has(current_word.toLowerCase())) {
    if (!App.zone_data[zone]) {
      App.zone_data[zone] = {words: []}
    }

    App.zone_data[zone].words = App.zone_data[zone].words.filter(w => w !== current_word)
    App.zone_data[zone].words.unshift(current_word)

    if (App.zone_data[zone].words.length > 10) {
      App.zone_data[zone].words.pop()
    }

    App.save_zone_data()
    App.broadcast_zone_words(zone)
  }
}

App.setup_sockets = () => {
  App.wss.on(`connection`, (ws, req) => {
    ws.is_alive = true
    ws.id = App.next_client_id++
    ws.ip = req.headers[`x-forwarded-for`] || req.socket.remoteAddress
    ws.username = App.shared.random_word(3, ws.ip)
    ws.zone = App.default_zone()
    ws.unit_duration = null

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
          ws.send(JSON.stringify({type: `ZONE`, zone: ws.zone}))

          if (old_zone !== ws.zone) {
            App.broadcast_zone_count(old_zone)
            App.broadcast_zone_count(ws.zone)
            App.broadcast_zone_words(ws.zone, ws)
          }
        }

        return
      }

      if ((signal !== `DOWN`) && (signal !== `UP`)) {
        return
      }

      let now = Date.now()
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

        if (z_state.current_word) {
          clearTimeout(z_state.word_timeout)
          App.resolve_word(ws.zone)
        }
      }

      z_state.last_active_ws = ws
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

          let msg_seq = JSON.stringify({type: `SEQUENCE`, sequence: z_state.current_sequence, username: ws.username})

          App.wss.clients.forEach((client) => {
            if ((client.readyState === WebSocket.OPEN) && (client.zone === ws.zone)) {
              client.send(msg_seq)
            }
          })

          z_state.letter_timeout = setTimeout(() => App.resolve_letter(ws.zone), ws.unit_duration * z_state.settings.letter_mult)
        }
      }
    })

    ws.on(`close`, () => {
      App.force_release(ws, ws.zone)
      App.broadcast_zone_count(ws.zone)
    })

    App.broadcast_zone_count(ws.zone)
    App.broadcast_zone_words(ws.zone, ws)
    ws.send(JSON.stringify({type: `ZONE`, zone: ws.zone, username: ws.username}))
  })
}

App.start_server = () => {
  let port = process.env.PORT || 3773

  App.server.listen(port, () => {
    console.log(`Mall Code server running on http://localhost:${port}`)
  })

  setInterval(() => {
    App.wss.clients.forEach((ws) => {
      if (!ws.is_alive) {
        return ws.terminate()
      }

      ws.is_alive = false
      ws.ping()
    })
  }, 30000)
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
    z_state.current_word = ``
    z_state.press_start_time = 0
    clearTimeout(z_state.letter_timeout)
    clearTimeout(z_state.word_timeout)
    z_state.last_active_ws = null
    z_state.lock_expires = 0
    let msg_seq = JSON.stringify({type: `SEQUENCE`, sequence: ``, username: ws.username})

    App.wss.clients.forEach((client) => {
      if ((client.readyState === WebSocket.OPEN) && (client.zone === zone)) {
        client.send(msg_seq)
      }
    })
  }
}

App.get_nouns()
App.get_zone_data()
App.setup_sockets()
App.setup_server()
App.start_server()