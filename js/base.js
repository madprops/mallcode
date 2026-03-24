App.started = false
App.zone = ``
App.max_press_timeout = null
App.last_input_time = 0
App.online_count_zone = 1
App.online_count_global = 1
App.last_focus_time = 0
App.zone_info_el = DOM.el(`#zone-info`)
App.username_info_el = DOM.el(`#username-info`)
App.sound_btn = DOM.el(`#sound-toggle`)
App.overlay_el = DOM.el(`#modal-overlay`)
App.modal_el = DOM.el(`#modal-content`)
App.protocol = window.location.protocol === `https:` ? `wss:` : `ws:`
App.is_pressed = false
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
App.modal_open = false
App.moving = false
App.current_user = ``
App.username = ``
App.version = `0.0.0`
App.ls_storage = `mallcode_v1`

App.create_debouncers = () => {
  App.username_debouncer = Shared.create_debouncer(() => {
    App.username_info_el.textContent = ``
  }, App.restore_username_delay)

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
  App.ws = new WebSocket(`${App.protocol}//${window.location.host}`)

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

    if (data.username) {
      App.current_user = data.username
      App.username_info_el.textContent = data.username
      App.username_debouncer.call()
    }

    if (data.type === `DOWN`) {
      App.remote_lock_time = performance.now()
      App.last_typist_was_local = false
      App.handle_press(null, false)
    }
    else if (data.type === `UP`) {
      App.remote_lock_time = performance.now()
      App.last_typist_was_local = false
      App.handle_release(null, false)
    }
    else if (data.type === `SEQUENCE`) {
      App.current_sequence = data.sequence
      App.update_sequence_display()
    }
    else if (data.type === `LETTER`) {
      App.spawn_sprite(data.letter, `letter`)
      App.current_sequence = ``
      App.update_sequence_display()
    }
    else if (data.type === `WORD`) {
      App.spawn_sprite(data.word, `word`)
    }
    else if (data.type === `ZONE`) {
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
      App.update_sequence_display()

      App.zone = data.zone
      App.username = data.username
      App.zone_settings = Shared.zone_settings[parseInt(App.zone.charAt(1))]
      App.max_press_duration = App.zone_settings.max_press
      App.input_throttle_ms = App.zone_settings.throttle
      App.unit_duration = App.zone_settings.unit_duration
      App.refresh_info()
      App.play_warp_drive()

      if (App.letter_dial_el) {
        App.letter_dial_el.value = App.zone.charAt(0)
      }

      if (App.speed_dial_el) {
        App.speed_dial_el.value = App.zone.charAt(1)
      }

      let theme = App.get_theme(App.zone)
      App.particles_material.color.set(theme.particles)

      if (App.particles_material.map) {
        App.particles_material.map.dispose()
      }

      App.particles_material.map = App.create_particle_texture(theme)
      App.particles_material.needsUpdate = true
    }
    else if (data.type === `MODAL`) {
      App.show_modal(data.text)
    }
    else if (data.type === `USERS`) {
      App.online_count_zone = data.count_zone
      App.online_count_global = data.count_global
      App.refresh_info()
    }
    else if (data.type === `WORDS`) {
      App.update_words_display(data.words)
    }
    else if (data.type === `ZONES_INFO`) {
      App.build_zone_selector(data.zones)
    }
  }

  App.ws.onclose = () => {
    if (App.is_pressed) {
      App.handle_release(null, true)
    }

    setTimeout(() => {
      App.setup_socket()
    }, App.reconnect_delay)
  }

  App.ws.onerror = () => {
    App.ws.close()
  }
}

App.clean_html = (text) => {
  text = text.replace(/</g, `&lt;`)
  return text.replace(/>/g, `&gt;`)
}

App.urlize = (text) => {
  return text.replace(/(https?:\/\/[^\s]+)/g, `<a class="modal-link" href="$1" target="_blank">$1</a>`)
}

App.show_modal = (text = ``, html = ``) => {
  if (App.is_pressed) {
    App.handle_release(null, true)
  }

  if (text) {
    let clean = App.clean_html(text)
    let urlized = App.urlize(clean)
    App.modal_el.innerHTML = urlized
  }
  else if (html) {
    App.modal_el.innerHTML = html
  }

  DOM.show(App.overlay_el)
  App.modal_open = true
}

App.hide_modal = () => {
  DOM.hide(App.overlay_el)
  App.modal_open = false
}

let words_container = DOM.el(`#words-container`)

if (!words_container) {
  words_container = DOM.create(`div`)
  words_container.id = `words-container`
  words_container.style.position = `absolute`
  words_container.style.left = `20px`
  words_container.style.top = `50%`
  words_container.style.transform = `translateY(-50%)`
  words_container.style.color = `#ffffff`
  words_container.style.fontFamily = `sans-serif`
  words_container.style.fontSize = `24px`
  words_container.style.pointerEvents = `none`
  words_container.style.zIndex = `10`
  document.body.appendChild(words_container)
}

App.update_words_display = (words) => {
  words_container.innerHTML = words.map(w => `<div>${w}</div>`).join(``)
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
  App.scene.fog = new THREE.FogExp2(0x020208, 0.0015)
  App.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000)
  App.camera.position.z = 40
  App.clock = new THREE.Clock()
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
  App.scene.add(App.particle_mesh)
  App.sprites = []
  App.active_sequence_sprite = null
}

App.create_text_texture = (text, is_word = false, is_sequence = false) => {
  let text_canvas = DOM.create(`canvas`)
  text_canvas.width = 1024
  text_canvas.height = 256
  let ctx = text_canvas.getContext(`2d`)
  ctx.clearRect(0, 0, text_canvas.width, text_canvas.height)
  let theme = App.get_theme(App.zone)

  if (is_word) {
    ctx.font = `bold 80px sans-serif`
    ctx.fillStyle = theme.word
  }
  else if (is_sequence) {
    ctx.font = `bold 100px sans-serif`
    ctx.fillStyle = App.get_user_color(App.current_user)
  }
  else {
    ctx.font = `bold 180px sans-serif`
    ctx.fillStyle = theme.letter
  }

  ctx.textAlign = `center`
  ctx.textBaseline = `middle`
  ctx.shadowColor = ctx.fillStyle
  ctx.shadowBlur = is_sequence ? 10 : 30
  ctx.fillText(text, text_canvas.width / 2, text_canvas.height / 2)
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
    sprite.userData = {velocity: new THREE.Vector3((Math.random() - 0.5) * 0.05, Math.random() * 0.05 + 0.02, 0.05), life: 1.0, decay_rate: type === `word` ? 0.25 : 0.5, age: 0, growth: type === `word` ? 2 : 10}
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

App.handle_press = (e, is_local = true) => {
  if (App.moving || App.modal_open) {
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

  if (App.is_pressed) {
    return
  }

  let now = performance.now()

  if (is_local && !App.last_typist_was_local && ((now - App.remote_lock_time) < Shared.lock_time)) {
    return
  }

  if (is_local) {
    App.last_typist_was_local = true
    App.current_user = App.username
    App.username_info_el.textContent = App.username
    App.username_debouncer.call()
  }

  if (is_local && ((now - App.last_input_time) < App.input_throttle_ms)) {
    return
  }

  App.last_input_time = now
  App.is_pressed = true
  App.press_start_time = now
  App.last_typist_was_local = is_local

  if ((is_local !== false) && App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.ws.send(JSON.stringify({type: `DOWN`}))
  }

  if (App.sound_enabled() && App.current_user) {
    App.beep_debouncer.call()
  }

  App.particle_mesh.material.size = 0.5
  App.init_audio()

  App.max_press_timeout = setTimeout(() => {
    App.handle_release(null, true)
  }, App.max_press_duration)
}

App.handle_release = (e, is_local = true) => {
  if (App.moving || App.modal_open) {
    return
  }

  if (e && (e.type === `keyup`)) {
    if ([`Meta`, `OS`, `Control`, `Alt`, `Shift`, `F5`, `F12`].includes(e.key)) {
      return
    }

    e.preventDefault()
  }

  if (!App.is_pressed) {
    return
  }

  let now = performance.now()
  App.is_pressed = false
  clearTimeout(App.max_press_timeout)
  App.last_input_time = now

  if ((is_local !== false) && App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.ws.send(JSON.stringify({type: `UP`}))
  }

  App.stop_beep()
  App.particle_mesh.material.size = 0.15
}

App.setup_events = () => {
  DOM.ev(App.canvas, `contextmenu`, (e) => {
    e.preventDefault()
    App.handle_press(e)
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
    e.preventDefault()
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
    App.show_menu()
  })

  DOM.ev(`#modal-overlay`, `click`, (e) => {
    if (e.target.id === `modal-overlay`) {
      App.hide_modal()
    }
  })

  // Force a release if we regain focus and were stuck in a pressed state
  window.addEventListener(`focus`, () => {
    if (App.is_pressed) {
      App.handle_release(null, true)
    }
  })

  // Also ensure the AudioContext is actually running
  document.addEventListener(`visibilitychange`, () => {
    if ((document.visibilityState === `visible`) && App.audio_ctx) {
      App.audio_ctx.resume()
    }
  })
}

App.animate = () => {
  requestAnimationFrame(App.animate)
  let delta = App.clock.getDelta()
  App.particle_mesh.rotation.y += 0.02 * delta
  App.particle_mesh.rotation.x += 0.01 * delta
  let target_z = App.is_pressed ? 35 : 40
  App.camera.position.z = THREE.MathUtils.lerp(App.camera.position.z, target_z, 0.15)

  for (let i = App.sprites.length - 1; i >= 0; i--) {
    let s = App.sprites[i]
    s.position.add(s.userData.velocity)
    s.userData.age += delta
    let decay_amount = s.userData.decay_rate * delta
    s.userData.life -= decay_amount
    let fade_in = Math.min(1.0, s.userData.age * 3.0)
    s.material.opacity = Math.max(0, fade_in * s.userData.life)
    s.scale.x += decay_amount * s.userData.growth
    s.scale.y += decay_amount * s.userData.growth * 0.25

    if (s.userData.life <= 0) {
      App.scene.remove(s)
      s.material.map.dispose()
      s.material.dispose()
      App.sprites.splice(i, 1)
    }
  }

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

App.setup_dials = () => {
  App.letter_dial_el = DOM.el(`#zone-dial-letter`)
  App.speed_dial_el = DOM.el(`#zone-dial-speed`)

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

App.show_menu = () => {
  let text = `Mall Code v${App.version}
This is a Morse Code MMO.
234 Zones. A letter and a speed number.
For example: A2, K4, V9, F3, T8.
Lower numbers mean slower, more forgiving.
Higher numbers mean closer to real speed.
Each zone has its own theme.
The zones remember the words.
You might encounter other users.
Each user has a personality.`

  App.show_modal(text)
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

        if (App.storage.volume_level !== undefined) {
          App.volume_level = App.storage.volume_level
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

  let tx = App.db.transaction(`store`, `readwrite`)
  let store = tx.objectStore(`store`)
  store.put(App.storage, `data`)
}

App.show_zone_map = () => {
  if (App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.ws.send(JSON.stringify({type: `GET_ZONES`}))
  }
}

App.get_zone_colors = (last_activity, current_time) => {
  let activity = 0

  if (last_activity > 0) {
    let time_since_active = current_time - last_activity
    let fraction_of_hour = time_since_active / 3600000
    activity = Math.max(0, 1 - fraction_of_hour)
  }

  let hue = Math.round(120 - activity * 120)
  let color = `hsl(${hue}, 100%, 60%)`
  let bg = `hsl(${hue}, 50%, 15%)`
  return {color, bg}
}

App.build_zone_selector = (zones_info) => {
  let html = `<div class="zone-map-grid">`
  let now = Date.now()

  for (let i = 0; i < 26; i++) {
    let letter = String.fromCharCode(65 + i)

    for (let speed = 1; speed <= 9; speed++) {
      let zone = `${letter}${speed}`
      let info = zones_info[zone] || {last_activity: 0}
      let colors = App.get_zone_colors(info.last_activity, now)
      let is_current = zone === App.zone
      let cls = is_current ? `zone-map-btn zone-map-current` : `zone-map-btn`
      html += `<button class="${cls}" data-zone="${zone}" style="color: ${colors.color}; background-color: ${colors.bg}; border-color: ${is_current ? `#00aaff` : colors.color}">${zone}</button>`
    }
  }

  html += `</div>`
  App.show_modal(``, html)
  let btns = DOM.els(`.zone-map-btn`, App.modal_el)

  let grid_el = DOM.el(`.zone-map-grid`, App.modal_el)
  let is_down = false
  let start_y
  let scroll_top
  let has_dragged = false

  let start_drag = (e) => {
    is_down = true
    has_dragged = false
    start_y = e.pageY || (e.touches && e.touches[0].pageY)
    scroll_top = grid_el.scrollTop
    grid_el.style.cursor = `grabbing`
    grid_el.style.userSelect = `none`
  }

  let end_drag = () => {
    is_down = false
    grid_el.style.cursor = `grab`
    grid_el.style.userSelect = ``
  }

  let move_drag = (e) => {
    if (!is_down) {
      return
    }

    let page_y = e.pageY || (e.touches && e.touches[0].pageY)

    if (page_y === undefined) {
      return
    }

    let walk = page_y - start_y

    if (Math.abs(walk) > 5) {
      has_dragged = true

      if (e.cancelable && (e.type === `touchmove`)) {
        e.preventDefault()
      }
    }

    grid_el.scrollTop = scroll_top - walk
  }

  grid_el.style.cursor = `grab`

  DOM.ev(grid_el, `mousedown`, start_drag)
  DOM.ev(grid_el, `mouseleave`, end_drag)
  DOM.ev(grid_el, `mouseup`, end_drag)
  DOM.ev(grid_el, `mousemove`, move_drag)

  DOM.ev(grid_el, `touchstart`, start_drag, {passive: true})
  DOM.ev(grid_el, `touchend`, end_drag)
  DOM.ev(grid_el, `touchcancel`, end_drag)
  DOM.ev(grid_el, `touchmove`, move_drag, {passive: false})

  setTimeout(() => {
    let active_btn = DOM.el(`[data-zone="${App.zone}"]`, App.modal_el)

    if (active_btn) {
      active_btn.scrollIntoView({behavior: `instant`, block: `center`, inline: `center`})
    }
  }, 10)

  if (App.zone_refresh_interval) {
    clearInterval(App.zone_refresh_interval)
  }

  App.zone_refresh_interval = setInterval(() => {
    let current_time = Date.now()

    for (let btn of btns) {
      let zone = btn.dataset.zone
      let info = zones_info[zone] || {last_activity: 0}
      let colors = App.get_zone_colors(info.last_activity, current_time)
      btn.style.color = colors.color
      btn.style.backgroundColor = colors.bg
      let is_current = zone === App.zone

      if (is_current) {
        btn.classList.add(`zone-map-current`)
      }
      else {
        btn.classList.remove(`zone-map-current`)
      }
    }
  }, 10 * 1000)

  for (let btn of btns) {
    DOM.ev(btn, `click`, (e) => {
      if (has_dragged) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      let zone = btn.dataset.zone
      App.letter_dial_el.value = zone.charAt(0)
      App.speed_dial_el.value = zone.charAt(1)
      App.zone_dial_action()
      clearInterval(App.zone_refresh_interval)
      App.hide_modal()
    })
  }
}

App.refresh_info = () => {
  let template = DOM.el(`#info-template`)

  if (template) {
    let clone = template.content.cloneNode(true)
    DOM.el(`#global-count`, clone).textContent = App.online_count_global
    DOM.el(`#zone-count`, clone).textContent = App.online_count_zone
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

App.init = async () => {
  await App.load_storage()
  App.create_debouncers()
  App.setup_dials()
  App.setup_socket()
  App.hide_cover()
}