module.exports = (App) => {
  App.on_down = (ws, data, z_state) => {
    if (z_state.is_pressed) {
      return
    }

    let now = Date.now()
    z_state.is_pressed = true
    z_state.press_start_time = now
    clearTimeout(z_state.letter_timeout)
    clearTimeout(z_state.word_timeout)

    let gap = typeof data.gap === `number` ? data.gap : 0

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
      let duration = typeof data.duration === `number` ? data.duration : 0

      let res = App.shared.process_duration(duration, ws.unit_duration, z_state.current_sequence, z_state.settings)
      ws.unit_duration = res.unit_duration
      
      if (typeof data.sequence === `string`) {
        z_state.current_sequence = data.sequence
      }
      else {
        z_state.current_sequence = res.sequence
      }

      let msg_up = JSON.stringify({type: `UP`, username: ws.username, sequence: z_state.current_sequence})

      App.wss.clients.forEach((client) => {
        if ((client !== ws) && (client.readyState === WebSocket.OPEN) && (client.zone === ws.zone)) {
          client.send(msg_up)
        }
      })

      let min_u = z_state.settings.forgiving ? 150 : z_state.settings.unit_duration * 0.8
      let required_time = 0

      for (let i = 0; i < z_state.current_sequence.length; i++) {
        let char = z_state.current_sequence[i]

        if (char === `.`) {
          required_time += min_u
        }
        else if (char === `-`) {
          required_time += min_u * 3
        }
      }

      if (z_state.current_sequence.length > 1) {
        required_time += (z_state.current_sequence.length - 1) * min_u
      }

      let server_elapsed = now - (z_state.control_start_time || now)
      let deficit = Math.max(0, required_time - server_elapsed)

      let letter_delay = (ws.unit_duration * z_state.settings.letter_mult) + 250 + deficit
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
      App.blocked_ips[ws.ip] = now + App.block_seconds * 1000
      App.force_release(ws, ws.zone)
      ws.close(1008, `Spam detected`)
      return true
    }

    if ((now - z_state.takeover_time) > (App.transmission_limit * 1000)) {
      App.blocked_ips[ws.ip] = now + App.soft_block_seconds * 1000
      App.force_release(ws, ws.zone)
      ws.close(1008, `Spam detected`)
      return true
    }

    return false
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

    let username = z_state.last_active_ws ? z_state.last_active_ws.username : ``
    let msg_letter = JSON.stringify({type: `LETTER`, username, letter})

    App.wss.clients.forEach((c) => {
      if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
        c.send(msg_letter)
      }
    })

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
    let msg = JSON.stringify({type: `WORD`, username: z_state.last_active_ws ? z_state.last_active_ws.username : ``, word})
    z_state.letters = []

    App.wss.clients.forEach((c) => {
      if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
        c.send(msg)
      }
    })

    App.process_word(zone, word, z_state.last_active_ws)
  }

  App.process_word = (zone, word, ws) => {
    let sekrit = Object.values(App.sekrits).find(s => s.word === word)

    if (sekrit) {
      if (ws && (ws.readyState === WebSocket.OPEN) && (ws.zone !== sekrit.zone)) {
        if (!sekrit.expires) {
          if (!App.user_sekrits[ws.username]) {
            App.user_sekrits[ws.username] = new Set()
          }

          App.user_sekrits[ws.username].add(sekrit.zone)
          App.zone_data_changed = true
        }

        App.go_to_zone(ws, sekrit.zone)
      }

      return
    }

    App.check_messages(ws, word)

    if ((word.length >= 3) && App.word_match(word)) {
      if (!App.zone_data[zone]) {
        App.zone_data[zone] = {words: []}
      }

      App.zone_data[zone].words = App.zone_data[zone].words.filter(w => w !== word)
      App.zone_data[zone].words.push(word)

      if (App.zone_data[zone].words.length > App.max_words) {
        App.zone_data[zone].words.shift()
      }

      App.get_zone_echo(zone)
      App.zone_data_changed = true
      App.broadcast_zone_words(zone)
      App.check_anomaly(word)
    }
  }

  App.check_messages = (ws, word) => {
    for (let msg of App.messages) {
      if (msg.words.includes(word)) {
        App.send_message(ws, msg.text, msg.pissed)
        break
      }
    }
  }
}