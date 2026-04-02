module.exports = (App) => {
  App.setup_sockets = () => {
    App.wss.on(`connection`, (ws, req) => {
      let is_allowed = App.prepare_ws(ws, req)

      if (is_allowed === `banned`) {
        ws.close(1008, `Banned`)
        return
      }

      if (!is_allowed) {
        ws.close(1008, `Too many connections`)
        return
      }

      ws.on(`pong`, () => {
        ws.is_alive = true
      })

      ws.on(`message`, (message) => {
        let spam_res = App.add_spam(ws, 1)

        if (spam_res === `already_banned`) {
          return
        }

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

        if (![`DOWN`, `UP`, `LETTER`, `WORD`].includes(signal)) {
          return
        }

        let now = Date.now()

        if (App.blocked_ips[ws.ip] && (now < App.blocked_ips[ws.ip])) {
          ws.close(1008, `Banned`)
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
        else if (signal === `LETTER`) {
          App.on_client_letter(ws, data, z_state)
        }
        else if (signal === `WORD`) {
          App.on_client_word(ws, data, z_state)
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

    if (App.blocked_ips[ws.ip] && (Date.now() < App.blocked_ips[ws.ip])) {
      return `banned`
    }

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
      let is_anomaly = App.sekrits[upper_zone] && App.sekrits[upper_zone].expires

      if (App.is_public_zone(upper_zone) || is_authorized || is_anomaly) {
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
    ws.get_zones_timestamps = []
    return true
  }

  App.force_release = (ws, zone) => {
    let z_state = App.zone_states[zone]

    if (z_state && (z_state.last_active_ws === ws)) {
      if (z_state.is_pressed) {
        z_state.is_pressed = false
        let msg_up = JSON.stringify({type: `UP`, username: ws.username, sequence: z_state.current_sequence})

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
    }
  }

  App.send_message = (ws, text, pissed = false) => {
    ws.send(JSON.stringify({
      type: `MESSAGE`,
      text,
      pissed,
    }))
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

    let zone_msg = JSON.stringify({
      type: `USERS`,
      count_zone,
      count_global,
      username,
      usernames,
      event,
    })

    let global_msg = JSON.stringify({
      type: `GLOBAL_COUNT`,
      count_global,
    })

    App.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (client.zone === zone) {
          client.send(zone_msg)
        }
        else {
          client.send(global_msg)
        }
      }
    })
  }

  App.broadcast_zone_words = (zone, client = null) => {
    if (!App.enable_zone_words) {
      return
    }

    let words = App.zone_data[zone] ? App.zone_data[zone].words : []
    let echo = App.zone_data[zone] && App.zone_data[zone].echo ? App.zone_data[zone].echo : ``
    let msg = JSON.stringify({type: `WORDS`, words, echo})

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

  App.on_restore_zone = (ws, data) => {
    if (data.zone) {
      let upper_zone = data.zone.toUpperCase()
      let is_authorized = App.user_sekrits[ws.username] && App.user_sekrits[ws.username].has(upper_zone)
      let is_anomaly = App.sekrits[upper_zone] && App.sekrits[upper_zone].expires

      if (!App.is_public_zone(upper_zone) && (upper_zone !== ws.zone) && !is_authorized && !is_anomaly) {
        return
      }

      App.go_to_zone(ws, upper_zone)
    }
  }

  App.on_get_zones = (ws, data) => {
    let now = Date.now()
    ws.get_zones_timestamps = ws.get_zones_timestamps.filter(t => (now - t) < 60000)

    if (ws.get_zones_timestamps.length >= App.max_info_per_minute) {
      return
    }

    ws.get_zones_timestamps.push(now)
    let zones_info = {}

    for (let z in App.zone_data) {
      if (App.is_public_zone(z)) {
        zones_info[z] = {
          last_activity: App.zone_data[z].last_activity,
          user_count: 0,
        }
      }
    }

    for (let key in App.sekrits) {
      let sekrit = App.sekrits[key]

      if (sekrit.expires) {
        let z = sekrit.zone

        if (!zones_info[z]) {
          zones_info[z] = {
            last_activity: App.zone_data[z] ? App.zone_data[z].last_activity : 0,
            user_count: 0,
          }
        }
      }
    }

    let user_sekrits = App.user_sekrits[ws.username] ? Array.from(App.user_sekrits[ws.username]) : []
    let sekrits_to_send = [...user_sekrits]

    for (let key in App.sekrits) {
      let sekrit = App.sekrits[key]

      if (sekrit.expires && !sekrits_to_send.includes(sekrit.zone)) {
        sekrits_to_send.push(sekrit.zone)
      }
    }

    for (let z of user_sekrits) {
      if (App.zone_data[z]) {
        if (!zones_info[z]) {
          zones_info[z] = {
            last_activity: App.zone_data[z].last_activity,
            user_count: 0,
          }
        }
      }
    }

    App.wss.clients.forEach((client) => {
      if ((client.readyState === WebSocket.OPEN) && client.zone) {
        let is_anomaly = App.sekrits[client.zone] && App.sekrits[client.zone].expires

        if (App.is_public_zone(client.zone) || user_sekrits.includes(client.zone) || is_anomaly) {
          if (!zones_info[client.zone]) {
            zones_info[client.zone] = {last_activity: 0, user_count: 0}
          }

          zones_info[client.zone].user_count += 1
        }
      }
    })

    ws.send(JSON.stringify({type: `ZONES_INFO`, zones: zones_info, sekrits: sekrits_to_send}))
  }
}