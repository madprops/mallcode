App.started = false
App.zone = ``
App.max_press_timeout = null
App.last_input_time = 0
App.online_count_zone = 1
App.online_count_global = 1
App.zone_usernames = []
App.last_focus_time = 0
App.zone_info_el = DOM.el(`#zone-info`)
App.username_info_el = DOM.el(`#username-info`)
App.echo_el = DOM.el(`#echo`)
App.zone_name_el = DOM.el(`#zone-name`)
App.zone_dials_el = DOM.el(`#zone-dials`)
App.sound_btn = DOM.el(`#sound-toggle`)
App.words_container_el = DOM.el(`#words-container`)
App.updates_el = DOM.el(`#updates`)
App.protocol = window.location.protocol === `https:` ? `wss:` : `ws:`
App.is_pressed = false
App.paddle_dot_down = false
App.paddle_dash_down = false
App.is_iambic_keying = false
App.last_iambic_sent = null
App.iambic_timeout = null
App.press_start_time = 0
App.current_sequence = ``
App.current_word = ``
App.remote_lock_time = -Shared.lock_time
App.last_typist_was_local = true
App.restore_username_delay = Shared.lock_time
App.reconnect_delay = 5 * 1000
App.beep_delay = 10
App.stop_beep_delay = 1 * 1000
App.updates_duration = 60 * 1000
App.moving = false
App.current_user = ``
App.username = ``
App.focused = !document.hidden
App.unfocused_beep_count = 0
App.max_unfocused_beeps = 5
App.version = `0.0.0`
App.animation = true
App.ls_storage = `mallcode_v1`
App.font_string = `"noto_font", "morse_arabic", "morse_hebrew", "morse_devanagari", "morse_thai", "morse_jp", "morse_kr", system-ui, sans-serif`
App.words = []
App.sequence = `above`
App.current_letters = []
App.sekrit_zones = new Set()
App.repo = `github.com/Merkoba/Mall-Code`
App.join_sound = true
App.leave_sound = true
App.bg_color = `black`
App.text_color = `white`
App.background = `auto`
App.echo_delay = 3.5 * 1000
App.ticker_speed = 69
App.colorlib = ColorLib()
App.theme_cache = null
App.script = Shared.default_script
App.iambic_mode = Shared.default_iambic
App.particle_size_big = 0.5
App.particle_size_small = 0.25
App.zoom_speed_press = 0.15
App.zoom_speed_release = 0.05
App.zoom_speed = App.zoom_speed_release

App.create_debouncers = () => {
  App.username_debouncer = Shared.create_debouncer(() => {
    App.username_info_el.textContent = ``
  }, App.restore_username_delay)

  App.echo_debouncer = Shared.create_debouncer(() => {
    DOM.hide(App.username_info_el)

    if (App.echo) {
      DOM.show(App.echo_el)
    }
    else {
      DOM.hide(App.echo_el)
    }
  }, App.echo_delay)

  App.zone_dial_debouncer = Shared.create_debouncer(() => {
    App.zone_dial_action()
  }, App.zone_dial_delay)

  App.zone_dial_debouncer_2 = Shared.create_debouncer(() => {
    App.zone_dial_action()
  }, App.zone_dial_delay_2)

  App.stop_beep_debouncer = Shared.create_debouncer(() => {
    if (App.current_user && App.is_pressed) {
      App.stop_beep()
    }
  }, App.stop_beep_delay)

  App.zoom_debouncer = Shared.create_debouncer(() => {
    App.target_z = 40
    App.zoom_speed = App.zoom_speed_release
    App.target_particle_size = App.particle_size_small
  }, 1 * 400)
}

App.setup_events = () => {
  DOM.ev(App.canvas, `contextmenu`, (e) => {
    e.preventDefault()
    App.handle_press(e)
  })

  DOM.ev(document.documentElement, `click`, () => {
    App.init_audio()
  })

  DOM.ev(App.canvas, `mousedown`, App.handle_press)
  DOM.ev(window, `mouseup`, App.handle_release)
  DOM.ev(window, `keydown`, App.handle_press)
  DOM.ev(window, `keyup`, App.handle_release)

  DOM.ev(App.canvas, `touchstart`, (e) => {
    e.preventDefault()
    App.handle_press(e)
  }, {passive: false})

  DOM.ev(window, `touchend`, (e) => {
    if (e.target === App.canvas) {
      e.preventDefault()
    }

    App.handle_release(e)
  }, {passive: false})

  DOM.ev(window, `resize`, () => {
    App.camera.aspect = window.innerWidth / window.innerHeight
    App.camera.updateProjectionMatrix()
    App.renderer.setSize(window.innerWidth, window.innerHeight)
  })

  DOM.ev(window, `focus`, () => {
    App.last_focus_time = performance.now()
  })

  DOM.ev(window, `blur`, () => {
    App.handle_release(null, true)
  })

  DOM.ev(`#about`, `click`, () => {
    App.show_about()
  })

  DOM.ev(`#settings`, `click`, () => {
    App.show_settings()
  })

  // Force a release if we regain focus and were stuck in a pressed state
  window.addEventListener(`focus`, () => {
    if (App.is_pressed) {
      App.handle_release(null, true)
    }
  })

  // Also ensure the AudioContext is actually running
  document.addEventListener(`visibilitychange`, () => {
    App.focused = !document.hidden

    if (App.focused) {
      if (App.audio_ctx) {
        App.audio_ctx.resume()
      }

      App.unfocused_beep_count = 0
    }
    else {
      App.stop_beep()
    }
  })
}

App.hide_cover = () => {
  setTimeout(() => {
    let cover = DOM.el(`#cover`)
    cover.classList.add(`fade`)

    setTimeout(() => {
      cover.remove()
    }, 2200)
  }, 1000)
}

App.set_css_var = (name, value) => {
  document.documentElement.style.setProperty(`--${name}`, value)
}

App.get_about_text = () => {
  return `Mall Code v${App.version}
  This is a Morse Code MMO.
  234 Zones. A letter and a speed number.
  For example: A2, K4, V9, F3, T8.
  Lower numbers mean slower, more forgiving.
  Higher numbers mean closer to real speed.
  Each zone has its own theme.
  The zones remember the words.
  There's also sekrit zones and anomalies.
  You might encounter other users.
  Each user has a personality.
  Iambic keys: LCtrl/RCtrl, Z/X, Left/Right.
  Developed by Merkoba in 2026.
  ${App.repo}`
}

App.load_fonts = () => {
  document.fonts.load(`1em piss_font`)
}

App.announce_anomaly = (data) => {
  App.show_update(`${data.zone} is created`, () => {
    App.go_to_zone(data.zone)
  })
}

App.go_to_zone = (zone) => {
  App.ws.send(JSON.stringify({type: `RESTORE_ZONE`, zone}))
}

App.get_script = () => {
  return App.script || Shared.default_script
}

App.start = () => {
  App.setup_canvas()
  App.setup_events()
  App.setup_sound()
  App.animate()
  App.started = true
}

App.init = async () => {
  await App.load_storage()
  App.create_debouncers()
  App.setup_msg_message()
  App.setup_tooltips()
  App.setup_zone_map()
  App.setup_zone_map_icon()
  App.setup_settings()
  App.setup_dials()

  let params = new URLSearchParams(window.location.search)
  let p_zone = params.get(`zone`)

  if (p_zone) {
    App.zone = p_zone.toUpperCase()
  }

  App.setup_socket()
  App.hide_cover()
  App.update_background()
  App.refresh_background()
  App.load_fonts()
}