module.exports = (App) => {
  App.is_public_zone = (zone) => {
    if (typeof zone !== `string`) {
      return false
    }

    return App.shared.is_public_zone(zone) && !App.sekrits[zone.toUpperCase()]
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

  App.get_speed = (zone) => {
    let z_num = parseInt(zone.charAt(1))

    if (App.sekrits[zone] && App.sekrits[zone].speed) {
      z_num = App.sekrits[zone].speed
    }
    else if (isNaN(z_num)) {
      z_num = App.shared.default_speed
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

  App.set_zone = (ws, zone) => {
    ws.zone = zone
    ws.sekrit = App.sekrits[zone]
  }

  App.go_to_zone = (ws, zone) => {
    let old_zone = ws.zone

    let speed = 5
    let z_num = parseInt(zone.charAt(1))

    if (App.sekrits[zone] && App.sekrits[zone].speed) {
      speed = App.sekrits[zone].speed
    }
    else if (!isNaN(z_num)) {
      speed = z_num
    }
    else if (App.shared.default_speed) {
      speed = App.shared.default_speed
    }

    // If the user is already in this zone, just acknowledge and return
    if (old_zone === zone) {
      let echo = App.zone_data[ws.zone] && App.zone_data[ws.zone].echo ? App.zone_data[ws.zone].echo : ``
      ws.send(JSON.stringify({type: `ZONE`, zone: ws.zone, username: ws.username, version: App.version, echo, speed}))
      App.broadcast_zone_words(ws.zone, ws)
      return
    }

    App.force_release(ws, old_zone)
    App.set_zone(ws, zone)
    let echo = App.zone_data[ws.zone] && App.zone_data[ws.zone].echo ? App.zone_data[ws.zone].echo : ``
    ws.send(JSON.stringify({type: `ZONE`, zone: ws.zone, username: ws.username, version: App.version, echo, speed}))

    if (old_zone) {
      App.broadcast_zone_update(old_zone, ws.username, `leave`)
    }

    App.broadcast_zone_update(ws.zone, ws.username, `join`)
    App.broadcast_zone_words(ws.zone, ws)
    App.update_zone_activity(ws.zone)
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
    let zone = `${letter}${App.shared.default_speed}`

    while (App.sekrits[zone]) {
      letter = String.fromCharCode(65 + Math.floor(rng() * 26))
      zone = `${letter}${App.shared.default_speed}`
    }

    return zone
  }

  App.random_zone = () => {
    let letter = App.shared.random_letter()
    let speed = App.shared.random_speed()
    return `${letter}${speed}`
  }

  App.check_expired_sekrits = () => {
    let now = Date.now()

    for (let zone in App.sekrits) {
      let sekrit = App.sekrits[zone]

      if (sekrit.expires && (now > sekrit.expires)) {
        delete App.sekrits[zone]

        if (App.zone_data[zone]) {
          delete App.zone_data[zone]
          App.zone_data_changed = true
        }

        if (App.zone_states[zone]) {
          delete App.zone_states[zone]
        }

        App.wss.clients.forEach(c => {
          if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
            App.go_to_zone(c, App.random_zone())
          }
        })
      }
    }
  }

  App.get_zone_echo = (zone) => {
    try {
      let echo = App.get_markov_text()
      echo = App.shared.ticker_text(echo).substring(0, App.max_echo_length).trim()
      App.zone_data[zone].echo = echo
    }
    catch (err) {
      App.zone_data[zone].echo = ``
    }
  }
}