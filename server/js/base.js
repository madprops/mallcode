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
App.zone_dial_delay = 100
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
App.font_string = `noto_font, system-ui, sans-serif`
App.words = []
App.sequence = `above`
App.current_letters = []
App.sekrit_zones = new Set()
App.repo = `github.com/madprops/mallcode`
App.join_sound = true
App.leave_sound = true
App.bg_color = `#000000`
App.echo_delay = 5 * 1000

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

  App.beep_debouncer = Shared.create_debouncer(() => {
    if (App.current_user && App.is_pressed) {
      App.play_beep(App.current_user)
    }
  }, App.beep_delay)

  App.stop_beep_debouncer = Shared.create_debouncer(() => {
    if (App.current_user && App.is_pressed) {
      App.stop_beep()
    }
  }, App.stop_beep_delay)
}

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
    else if (data.type === `SEQUENCE`) {
      let ok = App.on_sequence(data)

      if (!ok) {
        return
      }
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

App.clean_html = (text) => {
  text = text.replace(/</g, `&lt;`)
  return text.replace(/>/g, `&gt;`)
}

App.urlize = (text, clean = false) => {
  let label = text
  let cls = `modal-link`

  if (clean) {
    label = label.replace(/[^a-zA-Z0-9]/g, ` `)
    label = label.replace(/\s+/g, ` `)
    label = label.trim()
    cls = ` clean-link`
  }

  return text.replace(/(https?:\/\/[^\s]+)/g, `<a class="${cls}" href="$1" target="_blank">${label}</a>`)
}

App.show_message = (args = {}) => {
  let def_args = {
    text: ``,
    html: ``,
    pissed: false,
  }

  Shared.def_args(def_args, args)

  if (App.is_pressed) {
    App.handle_release(null, true)
  }

  let content = ``

  if (args.text) {
    content = App.urlize(App.clean_html(args.text), args.pissed)
  }
  else if (args.html) {
    content = args.html
  }

  let container = App.modal_el

  if (args.pissed) {
    container.classList.add(`pissed`)
    container.classList.add(`font-loading`)

    document.fonts.load(`1em piss_font`).then(() => {
      container.innerHTML = content
      container.classList.remove(`font-loading`)
    })
  }
  else {
    container.classList.remove(`pissed`)
    container.innerHTML = content
  }

  App.msg_message.show()
}

App.update_echo_display = (echo = ``) => {
  App.echo = echo

  let current_html = App.echo_el.innerHTML
  let new_html = App.echo ? `<span class="ticker-text">${App.clean_html(App.echo)}</span>` : ``

  if (current_html !== new_html) {
    App.echo_el.innerHTML = new_html

    if (App.echo) {
      let ticker = App.echo_el.querySelector(`.ticker-text`)

      if (ticker) {
        // Calculate width, using a fallback estimation if the element is currently hidden (offsetWidth = 0)
        let width = ticker.offsetWidth || (App.echo.length * 10 + 100)
        // Set a constant speed of 40 pixels per second
        ticker.style.animationDuration = `${width / 40}s`
      }
    }
  }
}

App.update_words_display = (words, echo = ``) => {
  App.words = words
  App.words_container_el.innerHTML = words.map(w => `<div>${w}</div>`).join(``)
  App.update_echo_display(echo)
}

App.create_particle_texture = (theme) => {
  let particle_canvas = DOM.create(`canvas`)
  particle_canvas.width = 64
  particle_canvas.height = 64
  let ctx = particle_canvas.getContext(`2d`)
  ctx.fillStyle = `#ffffff`

  if (theme.shape === `circle`) {
    ctx.beginPath()
    ctx.arc(32, 32, 32, 0, Math.PI * 2)
    ctx.fill()
  }
  else if (theme.shape === `square`) {
    ctx.fillRect(0, 0, 64, 64)
  }
  else if (theme.shape === `triangle`) {
    ctx.beginPath()
    ctx.moveTo(32, 0)
    ctx.lineTo(64, 64)
    ctx.lineTo(0, 64)
    ctx.closePath()
    ctx.fill()
  }
  else if (theme.shape === `star`) {
    ctx.beginPath()

    for (let i = 0; i < 10; i++) {
      let r = i % 2 === 0 ? 32 : 16
      let angle = i * Math.PI / 5 - Math.PI / 2
      ctx.lineTo(32 + Math.cos(angle) * r, 32 + Math.sin(angle) * r)
    }

    ctx.closePath()
    ctx.fill()
  }

  return new THREE.CanvasTexture(particle_canvas)
}

App.setup_canvas = () => {
  App.canvas = DOM.el(`#glcanvas`)
  App.renderer = new THREE.WebGLRenderer({canvas: App.canvas, antialias: true, alpha: true})
  App.renderer.setSize(window.innerWidth, window.innerHeight)
  App.renderer.setPixelRatio(window.devicePixelRatio)
  App.scene = new THREE.Scene()
  App.scene.background = new THREE.Color(App.bg_color)
  App.scene.fog = new THREE.FogExp2(App.bg_color, 0.0015)
  App.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000)
  App.camera.position.z = 40
  App.timer = new THREE.Timer()
  App.particles_geometry = new THREE.BufferGeometry()
  let particles_count = 3000
  let pos_array = new Float32Array(particles_count * 3)

  for (let i = 0; i < particles_count * 3; i++) {
    pos_array[i] = (Math.random() - 0.5) * 150
  }

  App.particles_geometry.setAttribute(`position`, new THREE.BufferAttribute(pos_array, 3))
  let theme = App.get_theme(App.zone)
  let texture = App.create_particle_texture(theme)
  App.particles_material = new THREE.PointsMaterial({size: 0.15, color: new THREE.Color(theme.particles), map: texture, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false})
  App.particle_mesh = new THREE.Points(App.particles_geometry, App.particles_material)
  App.particle_mesh.visible = App.animation
  App.scene.add(App.particle_mesh)
  App.sprites = []
  App.active_sequence_sprite = null
}

App.create_text_texture = (text, is_word = false, is_sequence = false, force_word_color = false) => {
  let text_canvas = DOM.create(`canvas`)
  text_canvas.width = 1024
  text_canvas.height = 256
  let ctx = text_canvas.getContext(`2d`)
  ctx.clearRect(0, 0, text_canvas.width, text_canvas.height)
  let theme = App.get_theme(App.zone)

  if (is_word) {
    ctx.font = `bold 80px ${App.font_string}`
    ctx.fillStyle = theme.word
    ctx.textAlign = `center`
    ctx.textBaseline = `middle`
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 30
    ctx.fillText(text, text_canvas.width / 2, text_canvas.height / 2)
  }
  else if (is_sequence) {
    ctx.fillStyle = App.get_user_color(App.current_user)
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 10

    let dot_diameter = 18
    let dot_radius = dot_diameter / 2
    let dash_width = dot_diameter * 2
    let dash_height = dot_diameter * 0.9
    let spacing = dot_diameter

    let total_width = 0

    if (text.length > 0) {
      for (let char of text) {
        if (char === `.`) {
          total_width += dot_diameter
        }
        else if (char === `-`) {
          total_width += dash_width
        }
      }

      total_width += (text.length - 1) * spacing
    }

    let current_x = (text_canvas.width - total_width) / 2
    let center_y = text_canvas.height / 2

    let dash_y_offset = 0
    let offset = dot_radius * 1.5

    if (App.sequence === `above`) {
      dash_y_offset = -offset
    }
    else if (App.sequence === `below`) {
      dash_y_offset = offset
    }

    for (let char of text) {
      if (char === `.`) {
        ctx.beginPath()
        ctx.arc(current_x + dot_radius, center_y, dot_radius, 0, Math.PI * 2)
        ctx.fill()
        current_x += dot_diameter + spacing
      }
      else if (char === `-`) {
        ctx.fillRect(current_x, center_y - dash_height / 2 + dash_y_offset, dash_width, dash_height)
        current_x += dash_width + spacing
      }
    }
  }
  else {
    ctx.font = `bold 180px ${App.font_string}`
    ctx.fillStyle = force_word_color ? theme.word : theme.letter
    ctx.textAlign = `center`
    ctx.textBaseline = `middle`
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 30
    ctx.fillText(text, text_canvas.width / 2, text_canvas.height / 2)
  }

  return new THREE.CanvasTexture(text_canvas)
}

App.spawn_sprite = (text, type) => {
  let texture = App.create_text_texture(text, type === `word`, type === `sequence`)
  let material = new THREE.SpriteMaterial({map: texture, transparent: true, blending: THREE.AdditiveBlending})
  let sprite = new THREE.Sprite(material)

  if (type === `sequence`) {
    sprite.scale.set(40, 10, 1)
    sprite.position.set(0, -8, 15)
  }
  else {
    if (type === `word`) {
      sprite.scale.set(25, 6.25, 1)
    }
    else {
      sprite.scale.set(12, 3, 1)
    }

    sprite.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, type === `word` ? 20 : 0)
    sprite.userData = {text, type, velocity: new THREE.Vector3((Math.random() - 0.5) * 0.05, Math.random() * 0.05 + 0.02, 0.05), life: 1.0, decay_rate: type === `word` ? 0.25 : 0.5, age: 0, growth: type === `word` ? 2 : 10}
    App.sprites.push(sprite)
  }

  App.scene.add(sprite)

  while (App.sprites.length > 40) {
    let old_sprite = App.sprites.shift()
    App.scene.remove(old_sprite)
    old_sprite.material.map.dispose()
    old_sprite.material.dispose()
  }

  return sprite
}

App.update_sequence_display = () => {
  if (App.active_sequence_sprite) {
    App.scene.remove(App.active_sequence_sprite)
    App.active_sequence_sprite.material.map.dispose()
    App.active_sequence_sprite.material.dispose()
    App.active_sequence_sprite = null
  }

  if (App.current_sequence) {
    App.active_sequence_sprite = App.spawn_sprite(App.current_sequence, `sequence`)
  }
}

App.trigger_down = (is_local = true) => {
  if (App.is_pressed) {
    return
  }

  let now = performance.now()

  if (is_local) {
    App.last_typist_was_local = true
    App.current_user = App.username
    App.username_info_el.textContent = App.username
    DOM.show(App.username_info_el)
    DOM.hide(App.echo_el)
    App.username_debouncer.call()
    App.echo_debouncer.call()
  }

  let gap = 0

  if (App.last_input_time > 0) {
    gap = now - App.last_input_time

    if (is_local) {
      App.unit_duration = Shared.process_gap(gap, App.unit_duration, App.current_sequence.length, App.zone_settings)
    }
  }

  App.last_input_time = now
  App.is_pressed = true
  App.press_start_time = now
  App.last_typist_was_local = is_local

  if ((is_local !== false) && App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.ws.send(JSON.stringify({type: `DOWN`, gap}))
  }

  if (App.sound_enabled() && App.current_user) {
    App.beep_debouncer.call()
  }

  App.particle_mesh.material.size = 0.5
  clearTimeout(App.max_press_timeout)

  App.max_press_timeout = setTimeout(() => {
    App.handle_release(null, true)
  }, App.max_press_duration)
}

App.trigger_up = (is_local = true) => {
  if (!App.is_pressed) {
    return
  }

  let now = performance.now()
  App.is_pressed = false
  clearTimeout(App.max_press_timeout)
  let duration = now - App.press_start_time
  App.last_input_time = now

  if (is_local) {
    let res = Shared.process_duration(duration, App.unit_duration, App.current_sequence, App.zone_settings)
    App.unit_duration = res.unit_duration
    App.current_sequence = res.sequence
    App.update_sequence_display()
    App.echo_debouncer.call()
  }

  if ((is_local !== false) && App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.ws.send(JSON.stringify({type: `UP`, duration}))
  }

  App.stop_beep()
  App.particle_mesh.material.size = 0.15
}

App.iambic_loop = () => {
  if (!App.paddle_dot_down && !App.paddle_dash_down) {
    App.is_iambic_keying = false
    App.last_iambic_sent = null
    return
  }

  let send_type = null

  if (App.paddle_dot_down && App.paddle_dash_down) {
    if (App.last_iambic_sent === `dot`) {
      send_type = `dash`
    }
    else {
      send_type = `dot`
    }
  }
  else if (App.paddle_dot_down) {
    send_type = `dot`
  }
  else if (App.paddle_dash_down) {
    send_type = `dash`
  }

  App.last_iambic_sent = send_type
  let active_duration = App.iambic_duration

  if (send_type === `dash`) {
    active_duration = App.iambic_duration * 3
  }

  App.trigger_down(true)
  clearTimeout(App.iambic_timeout)

  App.iambic_timeout = setTimeout(() => {
    App.trigger_up(true)

    App.iambic_timeout = setTimeout(() => {
      App.iambic_loop()
    }, App.iambic_duration)
  }, active_duration)
}

App.handle_press = (e, is_local = true) => {
  if (App.moving || App.modal_open()) {
    return
  }

  if (e && ((e.type === `mousedown`) || (e.type === `touchstart`))) {
    if (!document.hasFocus() || ((performance.now() - App.last_focus_time) < 100)) {
      return
    }
  }

  if (e && (e.type === `keydown`)) {
    if ([`Meta`, `OS`, `Control`, `Alt`, `Shift`, `F5`, `F11`, `F12`].includes(e.key)) {
      return
    }

    if (e.ctrlKey || e.metaKey || e.altKey) {
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
    if ([`z`, `Z`, `ArrowLeft`].includes(e.key)) {
      is_iambic = true
      is_dot = true
    }
    else if ([`x`, `X`, `ArrowRight`].includes(e.key)) {
      is_iambic = true
      is_dash = true
    }
  }

  let now = performance.now()

  if (is_local && !App.last_typist_was_local && ((now - App.remote_lock_time) < Shared.lock_time)) {
    return
  }

  if (is_iambic) {
    if (is_dot) {
      App.paddle_dot_down = true
    }

    if (is_dash) {
      App.paddle_dash_down = true
    }

    if (!App.is_iambic_keying) {
      App.is_iambic_keying = true
      App.iambic_loop()
    }

    return
  }

  if (App.is_pressed) {
    return
  }

  if (is_local && ((now - App.last_input_time) < App.input_throttle_ms)) {
    return
  }

  App.trigger_down(is_local)
}

App.handle_release = (e, is_local = true) => {
  if (App.moving || App.modal_open()) {
    return
  }

  if (e && (e.type === `keyup`)) {
    if ([`Meta`, `OS`, `Control`, `Alt`, `Shift`, `F5`, `F12`].includes(e.key)) {
      return
    }

    e.preventDefault()
  }

  let is_iambic = false
  let is_dot = false
  let is_dash = false

  if (is_local && e && (e.type === `keyup`)) {
    if ([`z`, `Z`, `ArrowLeft`].includes(e.key)) {
      is_iambic = true
      is_dot = true
    }
    else if ([`x`, `X`, `ArrowRight`].includes(e.key)) {
      is_iambic = true
      is_dash = true
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

  if (!e && is_local) {
    App.paddle_dot_down = false
    App.paddle_dash_down = false
    clearTimeout(App.iambic_timeout)
    App.is_iambic_keying = false
  }

  if (!App.is_pressed) {
    return
  }

  App.trigger_up(is_local)
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
  DOM.ev(App.canvas, `mouseup`, App.handle_release)
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

App.animate = () => {
  requestAnimationFrame(App.animate)
  // Call update before getting delta
  App.timer.update()
  let delta = App.timer.getDelta()

  if (App.animation) {
    App.particle_mesh.rotation.y += 0.02 * delta
    App.particle_mesh.rotation.x += 0.01 * delta
  }
  else {
    App.camera.position.z = 40
  }

  let target_z = App.is_pressed ? 35 : 40

  if (App.animation) {
    App.camera.position.z = THREE.MathUtils.lerp(App.camera.position.z, target_z, 0.15)
  }
  else {
    App.camera.position.z = 40
  }

  for (let i = App.sprites.length - 1; i >= 0; i--) {
    let s = App.sprites[i]

    if (App.animation) {
      s.position.add(s.userData.velocity)
    }

    s.userData.age += delta
    let decay_amount = s.userData.decay_rate * delta
    s.userData.life -= decay_amount
    let fade_in = Math.min(1.0, s.userData.age * 3.0)
    s.material.opacity = Math.max(0, fade_in * s.userData.life)

    if (App.animation) {
      s.scale.x += decay_amount * s.userData.growth
      s.scale.y += decay_amount * s.userData.growth * 0.25
    }

    if (s.userData.life <= 0) {
      App.scene.remove(s)
      s.material.map.dispose()
      s.material.dispose()
      App.sprites.splice(i, 1)
    }
  }

  App.animate_zone_map()
  App.renderer.render(App.scene, App.camera)
}

App.get_user_color = (name = `nobody`) => {
  let seed = Shared.get_string_hash(name)
  let random = Shared.create_seeded_random(seed)
  let base_hue = random() * 360
  return `hsl(${Math.round(base_hue)}, ${Shared.random_int({min: 80, max: 100, rand: random})}%, ${Shared.random_int({min: 55, max: 75, rand: random})}%)`
}

App.get_theme = (zone) => {
  let seed = Shared.get_string_hash(zone)
  let random = Shared.create_seeded_random(seed)
  let base_hue = random() * 360
  let hue1 = base_hue
  let hue2 = (base_hue + 120 + random() * 40 - 20) % 360
  let particle_hue = random() * 360
  let shapes = [`circle`, `square`, `triangle`, `star`]
  let shape = shapes[Shared.random_int({min: 0, max: shapes.length - 1, rand: random})]

  return {
    letter: `hsl(${Math.round(hue1)}, ${Shared.random_int({min: 70, max: 100, rand: random})}%, ${Shared.random_int({min: 60, max: 80, rand: random})}%)`,
    word: `hsl(${Math.round(hue2)}, ${Shared.random_int({min: 70, max: 100, rand: random})}%, ${Shared.random_int({min: 60, max: 80, rand: random})}%)`,
    particles: `hsl(${Math.round(particle_hue)}, ${Shared.random_int({min: 80, max: 100, rand: random})}%, ${Shared.random_int({min: 55, max: 75, rand: random})}%)`,
    shape,
  }
}

App.setup_zone_map_canvas = () => {
  App.zone_map_canvas = DOM.el(`#zone-map`)

  if (!App.zone_map_canvas) {
    return
  }

  App.zone_map_ctx = App.zone_map_canvas.getContext(`2d`)
  App.zone_map_canvas.width = 48
  App.zone_map_canvas.height = 48
}

App.animate_zone_map = () => {
  if (!App.zone_map_ctx) {
    return
  }

  let w = App.zone_map_canvas.width
  let h = App.zone_map_canvas.height
  App.zone_map_ctx.fillStyle = App.bg_color
  App.zone_map_ctx.fillRect(0, 0, w, h)

  if (!App.zone) {
    return
  }

  let theme = App.get_theme(App.zone)
  let time = App.animation ? performance.now() * 0.002 : 1
  let pulse1 = (Math.sin(time) + 1) / 2
  let pulse2 = (Math.cos(time * 0.8) + 1) / 2

  App.zone_map_ctx.fillStyle = theme.particles
  App.zone_map_ctx.globalAlpha = 0.6 + pulse1 * 0.4
  App.zone_map_ctx.beginPath()
  App.zone_map_ctx.arc(w / 2, h / 2, 10 + pulse2 * 4, 0, Math.PI * 2)
  App.zone_map_ctx.fill()

  App.zone_map_ctx.strokeStyle = theme.word
  App.zone_map_ctx.globalAlpha = 0.5 + pulse2 * 0.5
  App.zone_map_ctx.lineWidth = 3
  App.zone_map_ctx.beginPath()
  App.zone_map_ctx.arc(w / 2, h / 2, 16 + pulse1 * 4, 0, Math.PI * 2)
  App.zone_map_ctx.stroke()

  App.zone_map_ctx.globalAlpha = 1.0
}

App.setup_dials = () => {
  App.letter_dial_el = DOM.el(`#zone-dial-letter`)
  App.speed_dial_el = DOM.el(`#zone-dial-speed`)

  let opt_l0 = DOM.create(`option`)
  opt_l0.value = `0`
  opt_l0.text = `0`
  opt_l0.hidden = true
  App.letter_dial_el.appendChild(opt_l0)

  let opt_s0 = DOM.create(`option`)
  opt_s0.value = `0`
  opt_s0.text = `0`
  opt_s0.hidden = true
  App.speed_dial_el.appendChild(opt_s0)

  for (let i = 0; i < 26; i++) {
    let char = String.fromCharCode(65 + i)
    let opt = DOM.create(`option`)
    opt.value = char
    opt.text = char
    App.letter_dial_el.appendChild(opt)
  }

  for (let i = 1; i <= 9; i++) {
    let opt = DOM.create(`option`)
    opt.value = i
    opt.text = i
    App.speed_dial_el.appendChild(opt)
  }

  DOM.ev(App.letter_dial_el, `input`, () => {
    App.moving = true
    App.defocus_dial()
    App.zone_dial_debouncer.call()
  })

  DOM.ev(App.speed_dial_el, `input`, () => {
    App.moving = true
    App.defocus_dial()
    App.zone_dial_debouncer.call()
  })

  DOM.ev(App.letter_dial_el, `click`, () => {
    App.stop_beep()
  })

  DOM.ev(App.speed_dial_el, `click`, () => {
    App.stop_beep()
  })

  DOM.ev(`#zone-map`, `click`, App.show_zone_map)
}

App.defocus_dial = () => {
  App.letter_dial_el.blur()
  App.speed_dial_el.blur()
}

App.zone_dial_action = () => {
  let letter = App.letter_dial_el.value
  let speed = App.speed_dial_el.value
  let new_zone = `${letter}${speed}`

  if ((new_zone !== App.zone) && App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.ws.send(JSON.stringify({type: `RESTORE_ZONE`, zone: new_zone}))
  }
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

App.load_storage = async () => {
  return new Promise((resolve) => {
    let request = window.indexedDB.open(App.ls_storage, 1)

    request.onupgradeneeded = (e) => {
      let db = e.target.result

      if (!db.objectStoreNames.contains(`store`)) {
        db.createObjectStore(`store`)
      }
    }

    request.onsuccess = (e) => {
      App.db = e.target.result
      let tx = App.db.transaction(`store`, `readonly`)
      let store = tx.objectStore(`store`)
      let get_req = store.get(`data`)

      get_req.onsuccess = () => {
        App.storage = get_req.result || {}

        if (App.storage.volume !== undefined) {
          App.volume = App.storage.volume

          if (!App.get_options(`volume`).includes(App.volume)) {
            App.volume = `max`
          }
        }

        if (App.storage.animation !== undefined) {
          App.animation = Boolean(App.storage.animation)
        }

        if (App.storage.sequence !== undefined) {
          App.sequence = App.storage.sequence

          if (!App.get_options(`sequence`).includes(App.sequence)) {
            App.sequence = `above`
          }
        }

        App.join_sound = Boolean(App.storage.join_sound)
        App.leave_sound = Boolean(App.storage.leave_sound)

        if (App.storage.max_unfocused_beeps !== undefined) {
          App.max_unfocused_beeps = App.storage.max_unfocused_beeps
        }

        if (App.storage.bg_color !== undefined) {
          App.bg_color = App.storage.bg_color
        }

        resolve()
      }

      get_req.onerror = () => {
        App.storage = {}
        resolve()
      }
    }

    request.onerror = () => {
      console.error(`Error loading IndexedDB`)
      App.storage = {}
      resolve()
    }
  })
}

App.save_storage = () => {
  if (!App.db || !App.storage) {
    return
  }

  App.storage.volume = App.volume
  App.storage.animation = App.animation
  App.storage.sequence = App.sequence
  App.storage.max_unfocused_beeps = App.max_unfocused_beeps
  App.storage.join_sound = App.join_sound
  App.storage.leave_sound = App.leave_sound
  App.storage.bg_color = App.bg_color

  let tx = App.db.transaction(`store`, `readwrite`)
  let store = tx.objectStore(`store`)
  store.put(App.storage, `data`)
}

App.refresh_info = () => {
  let template = DOM.el(`#info-template`)

  if (template) {
    let clone = template.content.cloneNode(true)
    let global_count_el = DOM.el(`#global-count`, clone)
    let zone_count_el = DOM.el(`#zone-count`, clone)
    let zone_count_container_el = DOM.el(`#zone-count-container`, clone)
    global_count_el.textContent = App.online_count_global
    zone_count_el.textContent = App.online_count_zone
    let users = App.zone_usernames.join(` ✦ `)
    zone_count_container_el.title = users
    App.zone_info_el.innerHTML = ``
    App.zone_info_el.appendChild(clone)
  }
}

App.start = () => {
  App.setup_canvas()
  App.setup_events()
  App.setup_sound()
  App.animate()
  App.started = true
}

App.cycle_seq = () => {
  if (App.sequence === `base`) {
    App.sequence = `above`
  }
  else if (App.sequence === `above`) {
    App.sequence = `below`
  }
  else if (App.sequence === `below`) {
    App.sequence = `base`
  }

  App.refresh_sequence()
  App.save_storage()
}

App.refresh_bg_color = () => {
  if (App.canvas) {
    App.canvas.style.backgroundColor = App.bg_color
  }

  if (App.scene) {
    try {
      App.scene.background = new THREE.Color(App.bg_color)
    }
    catch (err) {
      //
    }
  }

  if (App.scene && App.scene.fog) {
    try {
      App.scene.fog.color.set(App.bg_color)
    }
    catch (err) {
      //
    }
  }

  document.documentElement.style.setProperty(`--bg_color`, App.bg_color)
}

App.show_update = (msg) => {
  let el = DOM.create(`div`)
  el.textContent = msg
  App.updates_el.prepend(el)

  setTimeout(() => {
    el.remove()
  }, App.updates_duration)
}

App.clear_updates = () => {
  App.updates_el.innerHTML = ``
}

App.update_url = () => {
  let url = new URL(window.location)

  if (Shared.is_public_zone(App.zone)) {
    url.searchParams.set(`zone`, App.zone)
  }
  else {
    url.searchParams.delete(`zone`)
  }

  window.history.replaceState({}, ``, url)
}

App.on_sequence = (data) => {
  if (data.unit_duration) {
    App.unit_duration = data.unit_duration
  }

  if (data.resolve) {
    let letter = Shared.morse_code[data.sequence] || ``

    if (letter) {
      App.spawn_sprite(letter, `letter`)
      App.current_letters.push(letter)
    }

    App.current_sequence = ``
    App.update_sequence_display()
  }
  else if (data.username !== App.username) {
    // Only update the sequence string for remote users to prevent local rubber-banding
    App.current_sequence = data.sequence
    App.update_sequence_display()
  }

  return true
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
  App.handle_press(null, false)
}

App.on_up = (data) => {
  App.remote_lock_time = performance.now()
  App.last_typist_was_local = false
  App.handle_release(null, false)
}

App.on_word_end = (data) => {
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
  App.zone_settings = Shared.zone_settings[isNaN(z_num) ? 5 : z_num]
  App.max_press_duration = App.zone_settings.max_press
  App.input_throttle_ms = App.zone_settings.throttle
  App.unit_duration = App.zone_settings.unit_duration
  App.iambic_duration = App.zone_settings.iambic_duration
  App.refresh_info()
  App.play_warp_drive()
  App.update_echo_display(data.echo)
  DOM.hide(App.username_info_el)
  if (App.echo) {
    DOM.show(App.echo_el)
  }
  else {
    DOM.hide(App.echo_el)
  }

  if (Shared.is_public_zone(App.zone)) {
    if (App.letter_dial_el) {
      App.letter_dial_el.value = App.zone.charAt(0)
    }

    if (App.speed_dial_el) {
      App.speed_dial_el.value = App.zone.charAt(1)
    }

    DOM.show(App.zone_dials_el)
    DOM.hide(App.zone_name_el)
  }
  else {
    App.sekrit_zones.add(App.zone)
    let theme = App.get_theme(App.zone)
    App.zone_name_el.textContent = App.zone
    App.zone_name_el.style.color = theme.particles
    DOM.show(App.zone_name_el)
    DOM.hide(App.zone_dials_el)
  }

  let theme = App.get_theme(App.zone)
  App.particles_material.color.set(theme.particles)

  if (App.particles_material.map) {
    App.particles_material.map.dispose()
  }

  App.particles_material.map = App.create_particle_texture(theme)
  App.particles_material.needsUpdate = true
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

App.on_ws_close = () => {
  if (App.is_pressed) {
    App.handle_release(null, true)
  }

  setTimeout(() => {
    App.setup_socket()
  }, App.reconnect_delay)
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

App.get_about_text = () => {
  return `Mall Code v${App.version}
  This is a Morse Code MMO.
  234 Zones. A letter and a speed number.
  For example: A2, K4, V9, F3, T8.
  Lower numbers mean slower, more forgiving.
  Higher numbers mean closer to real speed.
  Each zone has its own theme.
  The zones remember the words.
  You might encounter other users.
  Each user has a personality.
  Iambic keys: z/x and left/right.
  Developed by Merkoba in 2026.
  ${App.repo}`
}

App.setup_about = () => {
  App.msg_about = Msg.factory({
    before_show: () => {
      let c = DOM.el(`#about-container`)
      c.textContent = App.get_about_text()
    },
  })

  let template = DOM.el(`#about-template`)
  let clone = template.content.cloneNode(true)
  let c = DOM.el(`#about-container`, clone)
  App.msg_about.set(c)
}

App.show_about = () => {
  App.msg_about.show()
}

App.modal_open = () => {
  return App.msg_about.any_open()
}

App.setup_msg_message = () => {
  App.msg_message = Msg.factory({id: `message`})
  let template = DOM.el(`#message-template`)
  let clone = template.content.cloneNode(true)
  let c = DOM.el(`#message-container`, clone)
  App.modal_el = c
  App.msg_message.set(c)
}

App.init = async () => {
  await App.load_storage()
  App.create_debouncers()
  App.setup_msg_message()
  App.setup_about()
  App.setup_zone_map()
  App.setup_zone_map_canvas()
  App.setup_settings()
  App.setup_dials()

  let params = new URLSearchParams(window.location.search)
  let p_zone = params.get(`zone`)

  if (p_zone && /^[A-Z][1-9]$/i.test(p_zone)) {
    App.zone = p_zone.toUpperCase()
  }

  App.setup_socket()
  App.hide_cover()
  App.refresh_bg_color()
}