App.zone = Shared.default_zone
App.zone_settings = Shared.zone_settings[1]
App.max_press_duration = App.zone_settings.max_press
App.max_press_timeout = null
App.last_input_time = 0
App.input_throttle_ms = App.zone_settings.throttle
App.online_count = 1
App.last_focus_time = 0
App.zone_info_el = document.getElementById(`zone-info`)
App.sound_btn = document.getElementById(`sound-toggle`)
App.remote_lock_time = -Shared.lock_time

let protocol = window.location.protocol === `https:` ? `wss:` : `ws:`
let ws = new WebSocket(`${protocol}//${window.location.host}`)

ws.onmessage = (event) => {
  let data

  try {
    data = JSON.parse(event.data)
  }
  catch (err) {
    return
  }

  if (data.type === `DOWN`) {
    App.remote_lock_time = performance.now()
    App.handle_press(null, false)
  }
  else if (data.type === `UP`) {
    App.remote_lock_time = performance.now()
    App.handle_release(null, false)
  }
  else if (data.type === `ZONE`) {
    let new_zone = data.zone
    console.log(`Navigated to zone ${new_zone}`)
    App.zone = new_zone
    App.zone_settings = Shared.zone_settings[parseInt(App.zone.charAt(1))]
    App.max_press_duration = App.zone_settings.max_press
    App.input_throttle_ms = App.zone_settings.throttle
    unit_duration = App.zone_settings.unit_duration
    App.zone_info_el.innerText = `${App.zone} (${App.online_count})`
    App.play_warp_drive()
    let theme = App.get_theme(App.zone)
    App.particles_material.color.set(theme.particles)
  }
  else if (data.type === `MODAL`) {
    App.show_modal(data.text)
  }
  else if (data.type === `USERS`) {
    App.online_count = data.count
    App.zone_info_el.innerText = `${App.zone} (${App.online_count})`
  }
  else if (data.type === `WORDS`) {
    App.update_words_display(data.words)
  }
}

App.show_modal = (text) => {
  let modal_overlay = document.createElement(`div`)
  modal_overlay.id = `modal-overlay`
  let modal_content = document.createElement(`div`)
  modal_content.id = `modal-content`
  modal_content.innerText = text
  modal_overlay.appendChild(modal_content)

  modal_overlay.addEventListener(`click`, (e) => {
    if (e.target === modal_overlay && document.body.contains(modal_overlay)) {
      document.body.removeChild(modal_overlay)
    }
  })

  document.body.appendChild(modal_overlay)
}

let words_container = document.getElementById(`words-container`)

if (!words_container) {
  words_container = document.createElement(`div`)
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

App.setup_canvas = () => {
  App.canvas = document.getElementById(`glcanvas`)
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

  for (let i = 0; i < (particles_count * 3); i++) {
    pos_array[i] = ((Math.random() - 0.5) * 150)
  }

  App.particles_geometry.setAttribute(`position`, new THREE.BufferAttribute(pos_array, 3))
  let theme = App.get_theme(App.zone)
  App.particles_material = new THREE.PointsMaterial({size: 0.15, color: new THREE.Color(theme.particles), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending})
  App.particle_mesh = new THREE.Points(App.particles_geometry, App.particles_material)
  App.scene.add(App.particle_mesh)
  App.sprites = []
  App.active_sequence_sprite = null
}

App.create_text_texture = (text, is_word = false, is_sequence = false) => {
  let text_canvas = document.createElement(`canvas`)
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
    ctx.fillStyle = theme.sequence
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

    sprite.position.set(((Math.random() - 0.5) * 20), ((Math.random() - 0.5) * 10), type === `word` ? 20 : 0)
    sprite.userData = {velocity: new THREE.Vector3(((Math.random() - 0.5) * 0.05), (Math.random() * 0.05) + 0.02, 0.05), life: 1.0, decay_rate: type === `word` ? 0.25 : 0.5, age: 0, growth: type === `word` ? 2 : 10}
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

let is_pressed = false
let press_start_time = 0
let current_sequence = ``
let current_word = ``
let unit_duration = App.zone_settings.unit_duration
let letter_timeout = null
let word_timeout = null

App.update_sequence_display = () => {
  if (App.active_sequence_sprite) {
    App.scene.remove(App.active_sequence_sprite)
    App.active_sequence_sprite.material.map.dispose()
    App.active_sequence_sprite.material.dispose()
    App.active_sequence_sprite = null
  }

  if (current_sequence) {
    App.active_sequence_sprite = App.spawn_sprite(current_sequence, `sequence`)
  }
}

App.resolve_letter = () => {
  if (!current_sequence) {
    return
  }

  let letter = Shared.morse_code[current_sequence]

  if (letter) {
    current_word += letter
    App.spawn_sprite(letter, `letter`)
  }
  else {
    App.spawn_sprite(`?`, `letter`)
  }

  current_sequence = ``
  App.update_sequence_display()
  word_timeout = setTimeout(App.resolve_word, unit_duration * App.zone_settings.word_mult)
}

App.resolve_word = () => {
  if (!current_word) {
    return
  }

  App.spawn_sprite(current_word, `word`)
  current_word = ``
}

App.handle_press = (e, is_local = true) => {
  if (e && e.target === App.sound_btn) {
    return
  }

  if (document.getElementById(`modal-overlay`)) {
    if (e && e.type === `keydown` && e.key === `Escape`) {
      let m = document.getElementById(`modal-overlay`)
      if (m && document.body.contains(m)) document.body.removeChild(m)
    }
    return
  }

  if (e && (e.type === `mousedown` || e.type === `touchstart`)) {
    if (!document.hasFocus() || performance.now() - App.last_focus_time < 100) {
      return
    }
  }

  if (e && e.type === `keydown`) {
    if ((e.key === `Meta`) || (e.key === `OS`) || (e.key === `Control`) || (e.key === `Alt`) || (e.key === `Shift`)) {
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

  if (is_pressed) {
    return
  }

  let now = performance.now()

  if (is_local && ((now - App.remote_lock_time) < Shared.lock_time)) {
    return
  }

  if (is_local && ((now - App.last_input_time) < App.input_throttle_ms)) {
    return
  }

  App.last_input_time = now
  is_pressed = true
  press_start_time = now

  if ((is_local !== false) && (ws.readyState === WebSocket.OPEN)) {
    ws.send(JSON.stringify({type: `DOWN`}))
  }

  clearTimeout(letter_timeout)
  clearTimeout(word_timeout)
  clearTimeout(App.max_press_timeout)

  if (App.sound_enabled()) {
    App.play_beep()
  }

  App.particle_mesh.material.size = 0.5

  App.max_press_timeout = setTimeout(() => {
    App.handle_release(null, true)
  }, App.max_press_duration)
}

App.handle_release = (e, is_local = true) => {
  if (e && (e.target === App.sound_btn)) {
    return
  }

  if (document.getElementById(`modal-overlay`)) {
    return
  }

  if (e && (e.type === `keyup`)) {
    if ((e.key === `Meta`) || (e.key === `OS`) || (e.key === `Control`) || (e.key === `Alt`) || (e.key === `Shift`)) {
      return
    }

    e.preventDefault()
  }

  if (!is_pressed) {
    return
  }

  let now = performance.now()
  is_pressed = false
  clearTimeout(App.max_press_timeout)
  App.last_input_time = now

  if ((is_local !== false) && (ws.readyState === WebSocket.OPEN)) {
    ws.send(JSON.stringify({type: `UP`}))
  }

  let duration = now - press_start_time
  App.mute_beep()
  App.particle_mesh.material.size = 0.15

  if (duration < (unit_duration * 1.5)) {
    current_sequence += `.`
    let estimated_unit = duration
    unit_duration = (unit_duration * 0.7) + (estimated_unit * 0.3)
  }
  else {
    current_sequence += `-`
    let estimated_unit = duration / 3
    unit_duration = (unit_duration * 0.7) + (estimated_unit * 0.3)
  }

  let min_u = App.zone_settings.forgiving ? 150 : App.zone_settings.unit_duration * 0.8
  let max_u = App.zone_settings.forgiving ? 500 : App.zone_settings.unit_duration * 1.2
  unit_duration = Math.max(min_u, Math.min(max_u, unit_duration))
  App.update_sequence_display()
  letter_timeout = setTimeout(App.resolve_letter, unit_duration * App.zone_settings.letter_mult)
}

App.setup_events = () => {
  window.addEventListener(`contextmenu`, (e) => {
    if (e.target === App.sound_btn) {
      return
    }

    if (document.getElementById(`modal-overlay`)) {
      return
    }

    e.preventDefault()
    App.handle_press(e)
  })

  window.addEventListener(`mousedown`, App.handle_press)
  window.addEventListener(`mouseup`, App.handle_release)
  window.addEventListener(`keydown`, App.handle_press)
  window.addEventListener(`keyup`, App.handle_release)

  window.addEventListener(`touchstart`, (e) => {
    if (e.target === App.sound_btn) {
      return
    }

    if (document.getElementById(`modal-overlay`)) {
      return
    }

    e.preventDefault()
    App.handle_press(e)
  }, {passive: false})

  window.addEventListener(`touchend`, (e) => {
    if (e.target === App.sound_btn) {
      return
    }

    if (document.getElementById(`modal-overlay`)) return
    e.preventDefault()
    App.handle_release(e)
  }, {passive: false})

  window.addEventListener(`resize`, () => {
    App.camera.aspect = window.innerWidth / window.innerHeight
    App.camera.updateProjectionMatrix()
    App.renderer.setSize(window.innerWidth, window.innerHeight)
  })

  window.addEventListener(`focus`, () => {
    App.last_focus_time = performance.now()
  })

  window.addEventListener(`blur`, () => {
    App.handle_release(null, true)
  })
}

App.animate = () => {
  requestAnimationFrame(App.animate)
  let delta = App.clock.getDelta()
  App.particle_mesh.rotation.y += 0.02 * delta
  App.particle_mesh.rotation.x += 0.01 * delta
  let target_z = is_pressed ? 35 : 40
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

App.get_theme = (zone) => {
  let seed = App.get_string_hash(zone)
  let random = App.create_seeded_random(seed)
  let base_hue = random() * 360
  let hue1 = base_hue
  let hue2 = (base_hue + 120 + random() * 40 - 20) % 360
  let hue3 = (base_hue + 240 + random() * 40 - 20) % 360
  let particle_hue = random() * 360

  return {
    letter: `hsl(${Math.round(hue1)}, ${Math.round(70 + random() * 30)}%, ${Math.round(60 + random() * 20)}%)`,
    word: `hsl(${Math.round(hue2)}, ${Math.round(70 + random() * 30)}%, ${Math.round(60 + random() * 20)}%)`,
    sequence: `hsl(${Math.round(hue3)}, ${Math.round(70 + random() * 30)}%, ${Math.round(60 + random() * 20)}%)`,
    particles: `hsl(${Math.round(particle_hue)}, ${Math.round(80 + random() * 20)}%, ${Math.round(30 + random() * 20)}%)`
  }
}

App.init = () => {
  App.setup_canvas()
  App.setup_events()
  App.setup_sound()
  App.animate()
}
