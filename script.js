let audio_ctx
let oscillator
let gain_node
let audio_context = window.AudioContext || window.webkitAudioContext
let current_zone = Shared.default_zone
let current_settings = Shared.zone_settings[1]
let max_press_duration = current_settings.max_press
let max_press_timeout = null
let last_input_time = 0
let input_throttle_ms = current_settings.throttle
let online_count = 1
let zone_info_el = document.getElementById(`zone-info`)
let sound_toggle_btn = document.getElementById(`sound-toggle`)
let remote_lock_time = -Shared.lock_time
let volume_level = 0.5

function sound_enabled() {
  return volume_level > 0
}

sound_toggle_btn.addEventListener(`click`, () => {
  if (volume_level === 0.5) {
    volume_level = 0.25
  }
  else if (volume_level === 0.25) {
    volume_level = 0
  }
  else {
    volume_level = 0.5
  }

  if (volume_level === 0.5) {
    sound_toggle_btn.textContent = `🔊`
  }
  else if (volume_level === 0.25) {
    sound_toggle_btn.textContent = `🔉`
  }
  else {
    sound_toggle_btn.textContent = `🔇`
  }

  if (!sound_enabled() && gain_node) {
    gain_node.gain.setTargetAtTime(0, audio_ctx.currentTime, 0.01)
  }

  sound_toggle_btn.blur()
})

function init_audio() {
  if (!audio_ctx) {
    audio_ctx = new audio_context()
    gain_node = audio_ctx.createGain()
    gain_node.gain.value = 0
    gain_node.connect(audio_ctx.destination)
    oscillator = audio_ctx.createOscillator()
    oscillator.type = `sine`
    oscillator.frequency.value = 600
    oscillator.connect(gain_node)
    oscillator.start()
  }

  if (audio_ctx.state === `suspended`) {
    audio_ctx.resume()
  }
}

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
    remote_lock_time = performance.now()
    handle_press(null, false)
  }
  else if (data.type === `UP`) {
    remote_lock_time = performance.now()
    handle_release(null, false)
  }
  else if (data.type === `ZONE`) {
    let new_zone = data.zone
    console.log(`Navigated to zone ${new_zone}`)
    current_zone = new_zone
    current_settings = Shared.zone_settings[parseInt(current_zone.charAt(1))]
    max_press_duration = current_settings.max_press
    input_throttle_ms = current_settings.throttle
    unit_duration = current_settings.unit_duration
    zone_info_el.innerText = `${current_zone} (${online_count})`
    play_warp_drive()
  }
  else if (data.type === `MODAL`) {
    show_modal(data.text)
  }
  else if (data.type === `USERS`) {
    online_count = data.count
    zone_info_el.innerText = `${current_zone} (${online_count})`
  }
  else if (data.type === `WORDS`) {
    update_words_display(data.words)
  }
}

function show_modal(text) {
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

function update_words_display(words) {
  words_container.innerHTML = words.map(w => `<div>${w}</div>`).join(``)
}

let canvas = document.getElementById(`glcanvas`)
let renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
let scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x020208, 0.0015)
let camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 40
let particles_geometry = new THREE.BufferGeometry()
let particles_count = 3000
let pos_array = new Float32Array(particles_count * 3)

for (let i = 0; i < (particles_count * 3); i++) {
  pos_array[i] = ((Math.random() - 0.5) * 150)
}

particles_geometry.setAttribute(`position`, new THREE.BufferAttribute(pos_array, 3))
let particles_material = new THREE.PointsMaterial({size: 0.15, color: 0x4488ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending})
let particle_mesh = new THREE.Points(particles_geometry, particles_material)
scene.add(particle_mesh)
let sprites = []
let active_sequence_sprite = null

function create_text_texture(text, is_word = false, is_sequence = false) {
  let text_canvas = document.createElement(`canvas`)
  text_canvas.width = 1024
  text_canvas.height = 256
  let ctx = text_canvas.getContext(`2d`)
  ctx.clearRect(0, 0, text_canvas.width, text_canvas.height)
  theme = get_theme(current_zone)

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

function spawn_sprite(text, type) {
  let texture = create_text_texture(text, type === `word`, type === `sequence`)
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
    sprites.push(sprite)
  }

  scene.add(sprite)

  while (sprites.length > 40) {
    let old_sprite = sprites.shift()
    scene.remove(old_sprite)
    old_sprite.material.map.dispose()
    old_sprite.material.dispose()
  }

  return sprite
}

let is_pressed = false
let press_start_time = 0
let current_sequence = ``
let current_word = ``
let unit_duration = current_settings.unit_duration
let letter_timeout = null
let word_timeout = null

function update_sequence_display() {
  if (active_sequence_sprite) {
    scene.remove(active_sequence_sprite)
    active_sequence_sprite.material.map.dispose()
    active_sequence_sprite.material.dispose()
    active_sequence_sprite = null
  }

  if (current_sequence) {
    active_sequence_sprite = spawn_sprite(current_sequence, `sequence`)
  }
}

function resolve_letter() {
  if (!current_sequence) {
    return
  }

  let letter = Shared.morse_code[current_sequence]

  if (letter) {
    current_word += letter
    spawn_sprite(letter, `letter`)
  }
  else {
    spawn_sprite(`?`, `letter`)
  }

  current_sequence = ``
  update_sequence_display()
  word_timeout = setTimeout(resolve_word, unit_duration * current_settings.word_mult)
}

function resolve_word() {
  if (!current_word) {
    return
  }

  spawn_sprite(current_word, `word`)
  current_word = ``
}

function handle_press(e, is_local = true) {
  if (e && e.target === sound_toggle_btn) {
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
    if (!document.hasFocus() || performance.now() - last_focus_time < 100) {
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

  if (is_local && ((now - remote_lock_time) < Shared.lock_time)) {
    return
  }

  if (is_local && ((now - last_input_time) < input_throttle_ms)) {
    return
  }

  last_input_time = now
  is_pressed = true
  press_start_time = now

  if ((is_local !== false) && (ws.readyState === WebSocket.OPEN)) {
    ws.send(JSON.stringify({type: `DOWN`}))
  }

  init_audio()
  clearTimeout(letter_timeout)
  clearTimeout(word_timeout)
  clearTimeout(max_press_timeout)

  if (sound_enabled()) {
    gain_node.gain.setTargetAtTime(volume_level, audio_ctx.currentTime, 0.01)
  }

  particle_mesh.material.size = 0.5

  max_press_timeout = setTimeout(() => {
    handle_release(null, true)
  }, max_press_duration)
}

function handle_release(e, is_local = true) {
  if (e && (e.target === sound_toggle_btn)) {
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
  clearTimeout(max_press_timeout)
  last_input_time = now

  if ((is_local !== false) && (ws.readyState === WebSocket.OPEN)) {
    ws.send(JSON.stringify({type: `UP`}))
  }

  let duration = now - press_start_time
  gain_node.gain.setTargetAtTime(0, audio_ctx.currentTime, 0.01)
  particle_mesh.material.size = 0.15

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

  let min_u = current_settings.forgiving ? 150 : current_settings.unit_duration * 0.8
  let max_u = current_settings.forgiving ? 500 : current_settings.unit_duration * 1.2
  unit_duration = Math.max(min_u, Math.min(max_u, unit_duration))
  update_sequence_display()
  letter_timeout = setTimeout(resolve_letter, unit_duration * current_settings.letter_mult)
}

window.addEventListener(`contextmenu`, (e) => {
  if (e.target === sound_toggle_btn) {
    return
  }

  if (document.getElementById(`modal-overlay`)) {
    return
  }

  e.preventDefault()
  handle_press(e)
})

window.addEventListener(`mousedown`, handle_press)
window.addEventListener(`mouseup`, handle_release)
window.addEventListener(`keydown`, handle_press)
window.addEventListener(`keyup`, handle_release)

window.addEventListener(`touchstart`, (e) => {
  if (e.target === sound_toggle_btn) {
    return
  }

  if (document.getElementById(`modal-overlay`)) return
  e.preventDefault()
  handle_press(e)
}, {passive: false})

window.addEventListener(`touchend`, (e) => {
  if (e.target === sound_toggle_btn) {
    return
  }

  if (document.getElementById(`modal-overlay`)) return
  e.preventDefault()
  handle_release(e)
}, {passive: false})

window.addEventListener(`resize`, () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

let clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  let delta = clock.getDelta()
  particle_mesh.rotation.y += 0.02 * delta
  particle_mesh.rotation.x += 0.01 * delta
  let target_z = is_pressed ? 35 : 40
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, target_z, 0.15)

  for (let i = sprites.length - 1; i >= 0; i--) {
    let s = sprites[i]
    s.position.add(s.userData.velocity)
    s.userData.age += delta
    let decay_amount = s.userData.decay_rate * delta
    s.userData.life -= decay_amount
    let fade_in = Math.min(1.0, s.userData.age * 3.0)
    s.material.opacity = Math.max(0, fade_in * s.userData.life)
    s.scale.x += decay_amount * s.userData.growth
    s.scale.y += decay_amount * s.userData.growth * 0.25

    if (s.userData.life <= 0) {
      scene.remove(s)
      s.material.map.dispose()
      s.material.dispose()
      sprites.splice(i, 1)
    }
  }

  renderer.render(scene, camera)
}

let last_focus_time = 0

window.addEventListener(`focus`, () => {
  last_focus_time = performance.now()
})

window.addEventListener(`blur`, () => {
  handle_release(null, true)
})

function get_string_hash(str) {
  let hash = 0x811c9dc5

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

function create_seeded_random(seed) {
  return function() {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function get_theme(zone) {
  let seed = get_string_hash(zone)
  let random = create_seeded_random(seed)
  let base_hue = random() * 360
  let hue1 = base_hue
  let hue2 = (base_hue + 120 + (random() * 40 - 20)) % 360
  let hue3 = (base_hue + 240 + (random() * 40 - 20)) % 360

  return {
    letter: `hsl(${hue1.toFixed(1)}, ${(70 + random() * 30).toFixed(1)}%, ${(60 + random() * 20).toFixed(1)}%)`,
    word: `hsl(${hue2.toFixed(1)}, ${(70 + random() * 30).toFixed(1)}%, ${(60 + random() * 20).toFixed(1)}%)`,
    sequence: `hsl(${hue3.toFixed(1)}, ${(70 + random() * 30).toFixed(1)}%, ${(60 + random() * 20).toFixed(1)}%)`,
  }
}

function play_warp_drive() {
  init_audio()

  let duration = 1.5
  let start_time = audio_ctx.currentTime
  let osc_main = audio_ctx.createOscillator()
  let osc_sub = audio_ctx.createOscillator()
  let main_gain = audio_ctx.createGain()
  let low_pass_filter = audio_ctx.createBiquadFilter()

  osc_main.type = `sine`
  // using a triangle wave instead of sawtooth removes the harsh, buzzy edge
  osc_sub.type = `triangle`
  low_pass_filter.type = `lowpass`

  // muffling the high frequencies makes the effect sound deeper and more distant
  low_pass_filter.frequency.setValueAtTime(400, start_time)
  low_pass_filter.frequency.exponentialRampToValueAtTime(50, start_time + duration)

  // a lower, smoother frequency sweep for the main tone
  osc_main.frequency.setValueAtTime(60, start_time)
  osc_main.frequency.exponentialRampToValueAtTime(600, start_time + 1.2)

  osc_sub.frequency.setValueAtTime(80, start_time)
  osc_sub.frequency.exponentialRampToValueAtTime(15, start_time + 1.3)

  // softening the volume envelope so it fades in and out gently
  main_gain.gain.setValueAtTime(0, start_time)
  main_gain.gain.linearRampToValueAtTime(0.15, start_time + 0.3)
  main_gain.gain.exponentialRampToValueAtTime(0.01, start_time + duration)

  osc_main.connect(main_gain)
  osc_sub.connect(main_gain)
  main_gain.connect(low_pass_filter)
  low_pass_filter.connect(audio_ctx.destination)

  osc_main.start(start_time)
  osc_sub.start(start_time)

  osc_main.stop(start_time + duration)
  osc_sub.stop(start_time + duration)
}

animate()