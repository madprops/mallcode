App.setup_socket = () => {
  let ws_url = `${App.protocol}//${window.location.host}`

  if (App.zone) {
    ws_url += `/?zone=${App.zone}`
  }

  App.ws = new WebSocket(ws_url)

  App.ws.onopen = () => {
    if (App.zone) {
      App.ws.send(JSON.stringify({type: `RESTORE_ZONE`, zone: App.zone}))
    }
  }

  App.ws.onmessage = (event) => {
    let data

    try {
      data = JSON.parse(event.data)
    }
    catch (err) {
      return
    }

    if (data.username && [`DOWN`, `UP`].includes(data.type)) {
      App.on_up_or_down(data)
    }

    if (data.type === `DOWN`) {
      App.on_down(data)
    }
    else if (data.type === `UP`) {
      App.on_up(data)
    }
    else if (data.type === `WORD_END`) {
      App.on_word_end(data)
    }
    else if (data.type === `ZONE`) {
      App.on_zone(data)
    }
    else if (data.type === `MESSAGE`) {
      App.show_message({text: data.text, pissed: data.pissed})
    }
    else if (data.type === `USERS`) {
      App.on_users(data)
    }
    else if (data.type === `GLOBAL_COUNT`) {
      App.online_count_global = data.count_global
      App.refresh_info()
    }
    else if (data.type === `WORDS`) {
      App.update_words_display(data.words, data.echo)
    }
    else if (data.type === `ZONES_INFO`) {
      App.on_zones_info(data)
    }
  }

  App.ws.onclose = () => {
    App.on_ws_close()
  }

  App.ws.onerror = () => {
    App.ws.close()
  }
}

App.on_ws_close = () => {
  if (App.is_pressed) {
    App.handle_release(null, true)
  }

  setTimeout(() => {
    App.setup_socket()
  }, App.reconnect_delay)
}

App.on_up_or_down = (data) => {
  App.current_user = data.username
  App.username_info_el.textContent = data.username
  DOM.show(App.username_info_el)
  DOM.hide(App.echo_el)
  App.username_debouncer.call()
  App.echo_debouncer.call()
}

App.on_down = (data) => {
  App.remote_lock_time = performance.now()
  App.last_typist_was_local = false
  clearTimeout(App.letter_timeout)
  clearTimeout(App.word_timeout)
  App.handle_press(null, false)
}

App.on_up = (data) => {
  App.remote_lock_time = performance.now()
  App.last_typist_was_local = false
  App.handle_release(null, false)
}

App.on_word_end = (data) => {
  if (data.username === App.username) {
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
}

App.on_zone = (data) => {
  if (data.version) {
    App.version = data.version
  }

  if (!App.started) {
    App.start()
  }

  App.moving = false

  if (App.is_pressed) {
    App.handle_release(null, false)
  }

  App.current_sequence = ``
  App.current_letters = []
  App.update_sequence_display()

  App.zone = data.zone
  App.update_url()
  App.clear_updates()
  App.username = data.username
  let z_num = parseInt(App.zone.charAt(1))
  App.update_background()
  App.refresh_background()
  App.zone_settings = Shared.zone_settings[isNaN(z_num) ? 5 : z_num]
  App.max_press_duration = App.zone_settings.max_press
  App.input_throttle_ms = App.zone_settings.throttle
  App.unit_duration = App.zone_settings.unit_duration
  App.iambic_duration = App.zone_settings.iambic_duration
  App.refresh_info()
  App.play_warp_drive()
  App.update_echo_display(data.echo)
  DOM.hide(App.username_info_el)
  let theme = App.get_theme(App.zone, true)

  if (App.echo) {
    DOM.show(App.echo_el)
  }
  else {
    DOM.hide(App.echo_el)
  }

  if (Shared.is_public_zone(App.zone)) {
    if (App.letter_dial_el) {
      App.letter_dial_el.value = App.zone.charAt(0)
      App.letter_dial_el.textContent = App.zone.charAt(0)
    }

    if (App.speed_dial_el) {
      App.speed_dial_el.value = App.zone.charAt(1)
      App.speed_dial_el.textContent = App.zone.charAt(1)
    }

    DOM.show(App.zone_dials_el)
    DOM.hide(App.zone_name_el)
  }
  else {
    App.sekrit_zones.add(App.zone)
    App.zone_name_el.textContent = App.zone
    App.zone_name_el.style.color = theme.particles
    DOM.show(App.zone_name_el)
    DOM.hide(App.zone_dials_el)
  }

  App.set_css_var(`zone_color`, theme.particles)
  App.refresh_sound_icon()
}

App.on_zones_info = (data) => {
  if (data.sekrits) {
    App.sekrit_zones.clear()

    for (let zone of data.sekrits) {
      App.sekrit_zones.add(zone)
    }
  }

  App.build_zone_selector(data.zones)
}

App.on_users = (data) => {
  App.online_count_zone = data.count_zone
  App.online_count_global = data.count_global
  App.zone_usernames = data.usernames

  if (data.event && (data.username !== App.username)) {
    if (data.event === `join`) {
      App.show_update(`${data.username} joined`)
    }
    else if (data.event === `leave`) {
      App.show_update(`${data.username} left`)
    }

    if (data.count_zone <= 10) {
      if (data.event === `join`) {
        App.play_zone_enter()
      }
      else if (data.event === `leave`) {
        App.play_zone_leave()
      }
    }
  }

  App.refresh_info()
}