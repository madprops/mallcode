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
App.sekrits = {}
App.default_speed = 5
App.block_seconds = 60
App.spam_limit = 10
App.blocked_ips = {}
App.transmission_limit = 60
App.soft_block_seconds = 10
App.zone_data_changed = false
App.save_data_interval = 2 * 1000
App.max_words = 10
App.enable_zone_words = true
App.sekrit_delay = 60
App.user_sekrits = {}
App.max_connections_per_ip = 3

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

App.get_sekrits = () => {
  try {
    let file = path.join(__dirname, `sekrit.json`)
    App.sekrits = {}

    if (fs.existsSync(file)) {
      let data = JSON.parse(fs.readFileSync(file, `utf8`))

      data.forEach(s => {
        if (s.word && s.zone) {
          App.sekrits[s.zone.toUpperCase()] = {
            word: s.word.toUpperCase(),
            zone: s.zone.toUpperCase(),
            speed: s.speed,
          }
        }
      })
    }

    for (let user in App.user_sekrits) {
      for (let user_zone of App.user_sekrits[user]) {
        if (!App.sekrits[user_zone]) {
          App.user_sekrits[user].delete(user_zone)
          App.zone_data_changed = true
        }
      }
    }

    for (let zone in App.zone_data) {
      if (!App.is_public_zone(zone) && !App.sekrits[zone]) {
        delete App.zone_data[zone]
        App.zone_data_changed = true
      }
    }

    for (let zone in App.zone_states) {
      if (!App.is_public_zone(zone) && !App.sekrits[zone]) {
        delete App.zone_states[zone]
      }
      else {
        App.zone_states[zone].settings = App.get_speed(zone)
      }
    }

    App.wss.clients.forEach(c => {
      if ((c.readyState === WebSocket.OPEN) && !App.is_public_zone(c.zone) && !App.sekrits[c.zone]) {
        App.go_to_zone(c, App.default_zone())
      }
    })
  }
  catch (err) {
    console.error(`Error loading sekrit.json:`, err)
  }
}

App.is_public_zone = (zone) => {
  if (typeof zone !== `string`) {
    return false
  }

  return App.shared.is_public_zone(zone) && !App.sekrits[zone.toUpperCase()]
}

App.word_match = (word) => {
  return App.words.has(word)
}

App.get_zone_data = () => {
  App.zone_data = {}
  App.data_file = path.join(__dirname, `data.json`)

  try {
    if (fs.existsSync(App.data_file)) {
      let parsed = JSON.parse(fs.readFileSync(App.data_file, `utf8`))

      if (parsed.zones) {
        App.zone_data = parsed.zones

        for (let user in parsed.sekrits) {
          App.user_sekrits[user] = new Set(parsed.sekrits[user])
        }
      }
      else {
        App.zone_data = parsed
      }
    }
  }
  catch (err) {
    console.error(`Error loading data.json:`, err)
  }
}

App.save_zone_data = () => {
  let sekrits_to_save = {}

  for (let user in App.user_sekrits) {
    sekrits_to_save[user] = Array.from(App.user_sekrits[user])
  }

  let data_to_save = {
    zones: App.zone_data,
    sekrits: sekrits_to_save,
  }

  fs.writeFileSync(App.data_file, JSON.stringify(data_to_save, null, 2), `utf8`)
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

App.broadcast_zone_update = (zone, username = ``, event = ``) => {
  let count_zone = 0
  let count_global = 0
  let usernames = []

  App.wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (client.zone === zone) {
        count_zone += 1
        usernames.push(client.username)
      }

      count_global += 1
    }
  })

  App.wss.clients.forEach((client) => {
    if ((client.readyState === WebSocket.OPEN) && (client.zone === zone)) {
      client.send(JSON.stringify({
        type: `USERS`,
        count_zone,
        count_global,
        username,
        usernames,
        event,
      }))
    }
  })
}

App.broadcast_zone_words = (zone, client = null) => {
  if (!App.enable_zone_words) {
    return
  }

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

App.get_speed = (zone) => {
  let z_num = parseInt(zone.charAt(1))

  if (App.sekrits[zone] && App.sekrits[zone].speed) {
    z_num = App.sekrits[zone].speed
  }
  else if (isNaN(z_num)) {
    z_num = App.default_speed
  }

  return App.shared.zone_settings[z_num] || App.shared.zone_settings[5]
}

App.get_zone_state = (zone) => {
  if (!App.zone_states[zone]) {
    let settings = App.get_speed(zone)

    App.zone_states[zone] = {
      current_sequence: ``,
      letters: [],
      press_start_time: 0,
      last_up_time: 0,
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

App.send_sequence = (args = {}) => {
  let def_args = {
    sequence: ``,
    username: ``,
    zone: ``,
    resolve: false,
    unit_duration: null,
  }

  if (!args.username) {
    args.username = App.get_last_username(args.zone)
  }

  App.shared.def_args(def_args, args)
  let msg_seq = JSON.stringify({type: `SEQUENCE`, sequence: args.sequence, username: args.username, resolve: args.resolve, unit_duration: args.unit_duration})

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

  if (letter !== ``) {
    z_state.letters.push(letter)
  }

  App.send_sequence({sequence: z_state.current_sequence, zone, resolve: true})

  z_state.current_sequence = ``
  z_state.control_start_time = Date.now()
  let unit = z_state.last_active_ws ? z_state.last_active_ws.unit_duration || z_state.settings.unit_duration : z_state.settings.unit_duration
  let word_delay = (unit * z_state.settings.word_mult) + 250
  z_state.word_timeout = setTimeout(() => App.resolve_word(zone), word_delay)
}

App.resolve_word = (zone) => {
  let z_state = App.zone_states[zone]

  if (!z_state || !z_state.letters.length) {
    return
  }

  let word = z_state.letters.join(``)
  App.actions.check_word(z_state.last_active_ws, zone, word)
  let msg = JSON.stringify({type: `WORD_END`, username: z_state.last_active_ws ? z_state.last_active_ws.username : ``})
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
  let sekrit = Object.values(App.sekrits).find(s => s.word === word)

  if (sekrit) {
    if (ws && (ws.readyState === WebSocket.OPEN) && (ws.zone !== sekrit.zone)) {
      if (!App.user_sekrits[ws.username]) {
        App.user_sekrits[ws.username] = new Set()
      }

      App.user_sekrits[ws.username].add(sekrit.zone)
      App.zone_data_changed = true
      App.go_to_zone(ws, sekrit.zone)
    }

    return
  }

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

App.set_zone = (ws, zone) => {
  ws.zone = zone
  ws.sekrit = App.sekrits[zone]
}

App.go_to_zone = (ws, zone) => {
  let old_zone = ws.zone

  // If the user is already in this zone, just acknowledge and return
  if (old_zone === zone) {
    ws.send(JSON.stringify({type: `ZONE`, zone: ws.zone, username: ws.username, version: App.version}))
    App.broadcast_zone_words(ws.zone, ws)
    return
  }

  App.force_release(ws, old_zone)
  App.set_zone(ws, zone)
  ws.send(JSON.stringify({type: `ZONE`, zone: ws.zone, username: ws.username, version: App.version}))

  if (old_zone) {
    App.broadcast_zone_update(old_zone, ws.username, `leave`)
  }

  App.broadcast_zone_update(ws.zone, ws.username, `join`)
  App.broadcast_zone_words(ws.zone, ws)
  App.update_zone_activity(ws.zone)
}

App.setup_sockets = () => {
  App.wss.on(`connection`, (ws, req) => {
    let is_allowed = App.prepare_ws(ws, req)

    if (!is_allowed) {
      ws.close(1008, `Too many connections`)
      return
    }

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
        App.on_restore_zone(ws, data)
        return
      }

      if (signal === `GET_ZONES`) {
        App.on_get_zones(ws, data)
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
        let can_takeover = App.on_active_ws_different(ws, data, z_state)

        if (!can_takeover) {
          return
        }
      }
      else if (z_state.last_active_ws === ws) {
        let is_blocked = App.on_active_ws_same(ws, data, z_state)

        if (is_blocked) {
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
        App.on_down(ws, data, z_state)
      }
      else if (signal === `UP`) {
        App.on_up(ws, data, z_state)
      }
    })

    ws.on(`close`, () => {
      if (App.active_ips && App.active_ips[ws.ip]) {
        App.active_ips[ws.ip] -= 1

        if (App.active_ips[ws.ip] <= 0) {
          delete App.active_ips[ws.ip]
        }
      }

      App.force_release(ws, ws.zone)
      App.broadcast_zone_update(ws.zone, ws.username, `leave`)
    })

    App.go_to_zone(ws, ws.target_zone)
  })
}

App.prepare_ws = (ws, req) => {
  ws.ip = req.headers[`x-forwarded-for`] || req.socket.remoteAddress

  if (!App.active_ips) {
    App.active_ips = {}
  }

  if (!App.active_ips[ws.ip]) {
    App.active_ips[ws.ip] = 0
  }

  if (App.active_ips[ws.ip] >= App.max_connections_per_ip) {
    return false
  }

  App.active_ips[ws.ip] += 1

  let cookies = req.headers.cookie || ``
  let date_join_match = cookies.match(/(?:^|;\s*)date_join=([^;]+)/)
  ws.date_join = date_join_match ? parseInt(date_join_match[1], 10) : Date.now()
  ws.is_alive = true
  ws.id = App.next_client_id++
  ws.username = App.shared.random_word(3, ws.date_join || ws.ip, true)

  let req_url = new URL(req.url, `http://localhost`)
  let req_zone = req_url.searchParams.get(`zone`)

  if (req_zone) {
    let upper_zone = req_zone.toUpperCase()
    let is_authorized = App.user_sekrits[ws.username] && App.user_sekrits[ws.username].has(upper_zone)

    if (App.is_public_zone(upper_zone) || is_authorized) {
      ws.target_zone = upper_zone
    }
    else {
      ws.target_zone = App.default_zone()
    }
  }
  else {
    ws.target_zone = App.default_zone()
  }

  ws.unit_duration = null
  ws.penalty_expires = App.blocked_ips[ws.ip] || 0
  return true
}

App.on_restore_zone = (ws, data) => {
  if (data.zone) {
    let upper_zone = data.zone.toUpperCase()
    let is_authorized = App.user_sekrits[ws.username] && App.user_sekrits[ws.username].has(upper_zone)

    if (!App.is_public_zone(upper_zone) && (upper_zone !== ws.zone) && !is_authorized) {
      return
    }

    App.go_to_zone(ws, upper_zone)
  }
}

App.on_get_zones = (ws, data) => {
  let zones_info = {}

  for (let z in App.zone_data) {
    if (App.is_public_zone(z)) {
      zones_info[z] = {
        last_activity: App.zone_data[z].last_activity,
        user_count: 0,
      }
    }
  }

  let user_sekrits = App.user_sekrits[ws.username] ? Array.from(App.user_sekrits[ws.username]) : []

  for (let z of user_sekrits) {
    if (App.zone_data[z]) {
      zones_info[z] = {
        last_activity: App.zone_data[z].last_activity,
        user_count: 0,
      }
    }
  }

  App.wss.clients.forEach((client) => {
    if ((client.readyState === WebSocket.OPEN) && client.zone) {
      if (App.is_public_zone(client.zone) || user_sekrits.includes(client.zone)) {
        if (!zones_info[client.zone]) {
          zones_info[client.zone] = {last_activity: 0, user_count: 0}
        }

        zones_info[client.zone].user_count += 1
      }
    }
  })

  ws.send(JSON.stringify({type: `ZONES_INFO`, zones: zones_info, sekrits: user_sekrits}))
}

App.on_down = (ws, data, z_state) => {
  if (z_state.is_pressed) {
    return
  }

  let now = Date.now()
  z_state.is_pressed = true
  z_state.press_start_time = now
  clearTimeout(z_state.letter_timeout)
  clearTimeout(z_state.word_timeout)

  let gap = 0

  if (z_state.last_up_time) {
    let server_gap = now - z_state.last_up_time
    gap = App.shared.validate_timing(data.gap, server_gap, 500)
  }

  ws.unit_duration = App.shared.process_gap(gap, ws.unit_duration, z_state.current_sequence.length, z_state.settings)
  let msg_down = JSON.stringify({type: `DOWN`, username: ws.username})

  App.wss.clients.forEach((client) => {
    if ((client !== ws) && (client.readyState === WebSocket.OPEN) && (client.zone === ws.zone)) {
      client.send(msg_down)
    }
  })
}

App.on_up = (ws, data, z_state) => {
  if (z_state.last_active_ws && (z_state.last_active_ws !== ws)) {
    return
  }

  if (!z_state.is_pressed) {
    return
  }

  let now = Date.now()
  z_state.is_pressed = false
  z_state.last_up_time = now

  if (z_state.press_start_time) {
    let server_duration = now - z_state.press_start_time
    let duration = App.shared.validate_timing(data.duration, server_duration, 500)

    let res = App.shared.process_duration(duration, ws.unit_duration, z_state.current_sequence, z_state.settings)
    ws.unit_duration = res.unit_duration
    z_state.current_sequence = res.sequence

    let msg_up = JSON.stringify({type: `UP`, username: ws.username})

    App.wss.clients.forEach((client) => {
      if ((client !== ws) && (client.readyState === WebSocket.OPEN) && (client.zone === ws.zone)) {
        client.send(msg_up)
      }
    })

    App.send_sequence({sequence: z_state.current_sequence, username: ws.username, zone: ws.zone, unit_duration: ws.unit_duration})
    let letter_delay = (ws.unit_duration * z_state.settings.letter_mult) + 250
    z_state.letter_timeout = setTimeout(() => App.resolve_letter(ws.zone), letter_delay)
  }
}

App.on_active_ws_different = (ws, data, z_state) => {
  let now = Date.now()

  if (now < z_state.lock_expires) {
    return false
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

  return true
}

App.on_active_ws_same = (ws, data, z_state) => {
  let now = Date.now()

  if (now > z_state.lock_expires) {
    z_state.takeover_time = now
  }

  if (!z_state.current_sequence && !z_state.is_pressed && (data.type === `DOWN`)) {
    z_state.control_start_time = now
  }

  if ((now - z_state.control_start_time) > (App.spam_limit * 1000)) {
    ws.penalty_expires = now + App.block_seconds * 1000
    App.blocked_ips[ws.ip] = ws.penalty_expires
    App.force_release(ws, ws.zone)
    App.block_message(ws, App.block_seconds)
    return true
  }

  if ((now - z_state.takeover_time) > (App.transmission_limit * 1000)) {
    ws.penalty_expires = now + App.soft_block_seconds * 1000
    App.blocked_ips[ws.ip] = ws.penalty_expires
    App.force_release(ws, ws.zone)
    App.block_message(ws, App.soft_block_seconds)
    return true
  }

  return false
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

  setInterval(App.get_sekrits, App.sekrit_delay * 1000)
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
  let zone = `${letter}${App.default_speed}`

  while (App.sekrits[zone]) {
    letter = String.fromCharCode(65 + Math.floor(rng() * 26))
    zone = `${letter}${App.default_speed}`
  }

  return zone
}

App.force_release = (ws, zone) => {
  let z_state = App.zone_states[zone]

  if (z_state && (z_state.last_active_ws === ws)) {
    if (z_state.is_pressed) {
      z_state.is_pressed = false
      let msg_up = JSON.stringify({type: `UP`, username: ws.username})

      App.wss.clients.forEach((client) => {
        if ((client.readyState === WebSocket.OPEN) && (client.zone === zone)) {
          client.send(msg_up)
        }
      })
    }

    z_state.current_sequence = ``
    z_state.letters = []
    z_state.press_start_time = 0
    z_state.last_up_time = 0
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
    type: `MESSAGE`,
    text,
    pissed,
  }))
}

App.block_message = (ws, seconds) => {
  App.send_message(ws, `You have been blocked for ${seconds} seconds`)
}

App.get_version()
App.get_words()
App.get_sekrits()
App.get_zone_data()
App.setup_sockets()
App.setup_server()
App.start_server()