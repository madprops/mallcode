App.handle_press = (e, is_local = true) => {
  if (App.moving || App.dial_visible || App.modal_open()) {
    return
  }

  let event_time = e && e.timeStamp ? e.timeStamp : performance.now()

  if (event_time > 1e12) {
    event_time = performance.now()
  }

  if (e && ((e.type === `mousedown`) || (e.type === `touchstart`))) {
    if (!document.hasFocus() || ((performance.now() - App.last_focus_time) < 100)) {
      return
    }
  }

  if (e && (e.type === `keydown`)) {
    if ([`Meta`, `OS`, `Alt`, `Shift`, `F5`, `F11`, `F12`].includes(e.key)) {
      return
    }

    e.preventDefault()
  }

  if (e && e.repeat) {
    return
  }

  let is_iambic = false
  let is_dot = false
  let is_dash = false

  if (is_local && e && (e.type === `keydown`)) {
    if (App.is_iambic_left(e)) {
      is_iambic = true
      is_dot = true
    }
    else if (App.is_iambic_right(e)) {
      if (App.iambic_mode === `bug`) {
        // Bug mode dashes act as a straight key. Cancel any running dots.
        clearTimeout(App.iambic_timeout)
        App.is_iambic_keying = false
        App.paddle_dot_down = false
        App.dot_memory = false
      }
      else {
        is_iambic = true
        is_dash = true
      }
    }
  }

  let now = performance.now()

  if (is_local && !App.last_typist_was_local && ((now - App.remote_lock_time) < Shared.lock_time)) {
    return
  }

  // Straight key pressed. Cancel any running iambic loop.
  if (is_local && !is_iambic) {
    clearTimeout(App.iambic_timeout)
    App.is_iambic_keying = false
    App.paddle_dot_down = false
    App.paddle_dash_down = false
    App.dot_memory = false
    App.dash_memory = false
  }

  if (is_iambic) {
    // Ignore iambic paddle presses if straight key (or bug dash) is currently held down
    if (is_local && App.is_pressed && !App.is_iambic_keying) {
      return
    }

    if (is_dot) {
      App.paddle_dot_down = true
      App.dot_memory = true
      App.last_paddle_pressed = `dot`
    }

    if (is_dash) {
      App.paddle_dash_down = true
      App.dash_memory = true
      App.last_paddle_pressed = `dash`
    }

    if (!App.is_iambic_keying) {
      App.is_iambic_keying = true
      App.iambic_loop(event_time)
    }

    return
  }

  if (App.is_pressed) {
    return
  }

  if (is_local && ((event_time - App.last_input_time) < App.input_throttle_ms)) {
    return
  }

  App.trigger_down(is_local, event_time)
}

App.handle_release = (e, is_local = true) => {
  if (App.moving || App.dial_visible || App.modal_open()) {
    if (!App.is_pressed && !App.is_iambic_keying) {
      return
    }
  }

  let event_time = e && e.timeStamp ? e.timeStamp : performance.now()

  if (event_time > 1e12) {
    event_time = performance.now()
  }

  if (e && (e.type === `keyup`)) {
    if ([`Meta`, `OS`, `Alt`, `Shift`, `F5`, `F12`].includes(e.key)) {
      return
    }

    e.preventDefault()
  }

  let is_iambic = false
  let is_dot = false
  let is_dash = false

  if (is_local && e && (e.type === `keyup`)) {
    if (App.is_iambic_left(e)) {
      is_iambic = true
      is_dot = true
    }
    else if (App.is_iambic_right(e)) {
      if (App.iambic_mode === `bug`) {
        // Bypassed for straight key logic
      }
      else {
        is_iambic = true
        is_dash = true
      }
    }
  }

  if (is_iambic) {
    if (is_dot) {
      App.paddle_dot_down = false
    }

    if (is_dash) {
      App.paddle_dash_down = false
    }

    return
  }

  // Global blur / reset
  if (!e && is_local) {
    App.paddle_dot_down = false
    App.paddle_dash_down = false
    App.dot_memory = false
    App.dash_memory = false
    clearTimeout(App.iambic_timeout)
    App.is_iambic_keying = false
  }

  if (!App.is_pressed) {
    return
  }

  // Prevent non-iambic releases (like mouseup) from interrupting an active iambic element
  if (is_local && !is_iambic && App.is_iambic_keying) {
    return
  }

  App.trigger_up(is_local, event_time)
}

App.trigger_down = (is_local = true, event_time = null) => {
  if (App.is_pressed) {
    return
  }

  let now = event_time || performance.now()

  if (is_local) {
    clearTimeout(App.letter_timeout)
    clearTimeout(App.word_timeout)

    App.last_typist_was_local = true
    App.current_user = App.username
    App.username_info_el.textContent = App.username
    DOM.show(App.username_info_el)
    DOM.hide(App.echo_el)
    App.username_debouncer.call()
    App.echo_debouncer.call()

    let gap = 0

    if (App.last_input_time > 0) {
      gap = Math.max(0, now - App.last_input_time)
      App.unit_duration = Shared.process_gap(gap, App.unit_duration, App.current_sequence.length, App.zone_settings)
    }

    if (App.ws && (App.ws.readyState === WebSocket.OPEN)) {
      App.ws.send(JSON.stringify({type: `DOWN`, gap}))
    }
  }

  App.last_input_time = now
  App.is_pressed = true
  App.press_start_time = now
  App.last_typist_was_local = is_local

  if (App.sound_enabled() && App.current_user) {
    App.play_beep(App.current_user)
  }

  App.particle_mesh.material.size = 0.5
  clearTimeout(App.max_press_timeout)

  App.max_press_timeout = setTimeout(() => {
    App.handle_release(null, is_local)
  }, App.max_press_duration)
}

App.trigger_up = (is_local = true, event_time = null) => {
  if (!App.is_pressed) {
    return
  }

  let now = event_time || performance.now()
  App.is_pressed = false
  clearTimeout(App.max_press_timeout)
  let duration = Math.max(0, now - App.press_start_time)
  App.last_input_time = now

  if (is_local) {
    let res = Shared.process_duration(duration, App.unit_duration, App.current_sequence, App.zone_settings)
    App.unit_duration = res.unit_duration
    App.current_sequence = res.sequence
    App.update_sequence_display()

    App.echo_debouncer.call()

    let letter_delay = (App.unit_duration * App.zone_settings.letter_mult) + 250

    App.letter_timeout = setTimeout(() => {
      App.resolve_local_letter(is_local)
    }, letter_delay)

    if (App.ws && (App.ws.readyState === WebSocket.OPEN)) {
      App.ws.send(JSON.stringify({type: `UP`, duration, sequence: App.current_sequence, script: App.get_script()}))
    }
  }

  App.stop_beep()
  App.particle_mesh.material.size = 0.15
}

App.resolve_local_letter = (is_local = true) => {
  if (!App.current_sequence) {
    return
  }

  let letter = Shared.get_letter(App.script, App.current_sequence)

  if (letter !== ``) {
    App.spawn_sprite(letter, `letter`)
    App.current_letters.push(letter)
  }

  App.current_sequence = ``
  App.update_sequence_display()

  if (is_local) {
    if (App.ws && (App.ws.readyState === WebSocket.OPEN)) {
      App.ws.send(JSON.stringify({type: `LETTER`}))
    }

    let word_delay = (App.unit_duration * App.zone_settings.word_mult) + 250

    App.word_timeout = setTimeout(() => {
      App.resolve_local_word()
    }, word_delay)
  }
}

App.resolve_local_word = () => {
  if (!App.current_letters.length) {
    return
  }

  let word = App.current_letters.join(``)
  let found = false

  if (App.current_letters.length === 1) {
    for (let i = App.sprites.length - 1; i >= 0; i--) {
      let s = App.sprites[i]

      if ((s.userData.type === `letter`) && (s.userData.text === word)) {
        s.userData.type = `word`
        s.userData.decay_rate = 0.25
        s.userData.growth = 2
        let old_map = s.material.map
        s.material.map = App.create_text_texture(word, false, false, true)
        old_map.dispose()
        found = true
        break
      }
    }
  }

  if (!found && (word.length > 0)) {
    App.spawn_sprite(word, `word`)
  }

  App.current_letters = []

  if (App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.ws.send(JSON.stringify({type: `WORD`}))
  }
}

App.iambic_loop = () => {
  if (App.iambic_mode === `b`) {
    if (App.paddle_dot_down) {
      App.dot_memory = true
    }

    if (App.paddle_dash_down) {
      App.dash_memory = true
    }
  }

  let dot_request = App.paddle_dot_down || App.dot_memory
  let dash_request = App.paddle_dash_down || App.dash_memory

  if (!dot_request && !dash_request) {
    App.is_iambic_keying = false
    App.last_iambic_sent = null

    return
  }

  let send_type = null

  if (dot_request && dash_request) {
    if (App.iambic_mode === `ultimatic`) {
      send_type = App.last_paddle_pressed
    }
    else if (App.iambic_mode === `single`) {
      if ((App.last_iambic_sent === `dot`) && App.paddle_dot_down) {
        send_type = `dot`
        App.dash_memory = false
      }
      else if ((App.last_iambic_sent === `dash`) && App.paddle_dash_down) {
        send_type = `dash`
        App.dot_memory = false
      }
      else {
        send_type = App.last_paddle_pressed || `dot`

        if (send_type === `dot`) {
          App.dash_memory = false
        }
        else {
          App.dot_memory = false
        }
      }
    }
    else if (App.last_iambic_sent === `dot`) {
      send_type = `dash`
    }
    else {
      send_type = `dot`
    }
  }
  else if (dot_request) {
    send_type = `dot`
  }
  else if (dash_request) {
    send_type = `dash`
  }

  App.last_iambic_sent = send_type
  let active_duration = App.unit_duration

  if (send_type === `dash`) {
    active_duration = App.unit_duration * 3
  }

  if (send_type === `dot`) {
    App.dot_memory = false
  }
  else {
    App.dash_memory = false
  }

  App.trigger_down(true)
  clearTimeout(App.iambic_timeout)

  App.iambic_timeout = setTimeout(() => {
    App.trigger_up(true)

    App.iambic_timeout = setTimeout(() => {
      App.iambic_loop()
    }, App.unit_duration)
  }, active_duration)
}

App.is_iambic_left = (e) => {
  if ([`z`, `Z`].includes(e.key)) {
    return true
  }

  if (`ArrowLeft` === e.key) {
    return true
  }

  if ((e.key === `Control`) && (e.location === 1)) {
    return true
  }
}

App.is_iambic_right = (e) => {
  if ([`x`, `X`].includes(e.key)) {
    return true
  }

  if (`ArrowRight` === e.key) {
    return true
  }

  if ((e.key === `Control`) && (e.location === 2)) {
    return true
  }
}