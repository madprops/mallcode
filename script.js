let MORSE_CODE = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
  "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
  "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
  ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
  "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
  "--..": "Z", ".----": "1", "..---": "2", "...--": "3",
  "....-": "4", ".....": "5", "-....": "6", "--...": "7",
  "---..": "8", "----.": "9", "-----": "0",
}

let audio_context = window.AudioContext || window.webkitAudioContext
let audio_ctx
let oscillator
let gain_node
let max_press_duration = 3000
let max_press_timeout = null
let last_input_time = 0
let input_throttle_ms = 40

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
  if (event.data === `DOWN`) {
    handle_press(null, false)
  }
  else if (event.data === `UP`) {
    handle_release(null, false)
  }
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

for (let i = 0; i < particles_count * 3; i++) {
  pos_array[i] = (Math.random() - 0.5) * 150
}

particles_geometry.setAttribute(`position`, new THREE.BufferAttribute(pos_array, 3))

let particles_material = new THREE.PointsMaterial({
  size: 0.15,
  color: 0x4488ff,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending
})

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

  if (is_word) {
    ctx.font = `bold 120px sans-serif`
    ctx.fillStyle = `#ffaa00`
  }
  else if (is_sequence) {
    ctx.font = `bold 100px sans-serif`
    ctx.fillStyle = `#ff5555` // Updated to a reddish color
  }
  else {
    ctx.font = `bold 180px sans-serif`
    ctx.fillStyle = `#ffffff`
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
  let material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending
  })
  let sprite = new THREE.Sprite(material)

  if (type === `sequence`) {
    sprite.scale.set(40, 10, 1)
    sprite.position.set(0, -8, 15) // Changed Y from -15 to -8
  }
  else {
    sprite.scale.set(40, 10, 1)
    sprite.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, type === `word` ? 20 : 0)
    sprite.userData = {
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.05, Math.random() * 0.05 + 0.02, 0.05),
      life: 1.0,
      decay: type === `word` ? 0.004 : 0.008,
      age: 0
    }
    sprites.push(sprite)
  }

  scene.add(sprite)
  return sprite
}

let is_pressed = false
let press_start_time = 0
let current_sequence = ``
let current_word = ``
let unit_duration = 120
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

  let letter = MORSE_CODE[current_sequence]

  if (letter) {
    current_word += letter
    spawn_sprite(letter, `letter`)
  }
  else {
    spawn_sprite(`?`, `letter`)
  }

  current_sequence = ``
  update_sequence_display()

  // Wait 4 more units to complete the 7-unit word gap (we already waited 3)
  word_timeout = setTimeout(resolve_word, unit_duration * 4)
}

function resolve_word() {
  if (!current_word) {
    return
  }

  spawn_sprite(current_word, `word`)
  current_word = ``
}

function handle_press(e, is_local = true) {
  if (e && e.repeat) {
    return
  }

  if (is_pressed) {
    return
  }

  let now = performance.now()

  // Anti-spam: block inputs that happen faster than humanly possible (switch bounce / macros)
  if (is_local && ((now - last_input_time) < input_throttle_ms)) {
    return
  }

  last_input_time = now
  is_pressed = true
  press_start_time = now

  if ((is_local !== false) && (ws.readyState === WebSocket.OPEN)) {
    ws.send(`DOWN`)
  }

  init_audio()
  clearTimeout(letter_timeout)
  clearTimeout(word_timeout)
  clearTimeout(max_press_timeout)
  gain_node.gain.setTargetAtTime(0.5, audio_ctx.currentTime, 0.01)
  particle_mesh.material.size = 0.5

  // Anti-stuck: Force a local release if the tone plays for too long
  max_press_timeout = setTimeout(() => {
    handle_release(null, true)
  }, max_press_duration)
}

function handle_release(e, is_local = true) {
  if (!is_pressed) {
    return
  }

  let now = performance.now()
  is_pressed = false
  clearTimeout(max_press_timeout)

  // We don't throttle the release to ensure the socket doesn't get stuck in a DOWN state,
  // but we do update the timestamp so the next press is measured from here.
  last_input_time = now

  if ((is_local !== false) && (ws.readyState === WebSocket.OPEN)) {
    ws.send(`UP`)
  }

  let duration = now - press_start_time
  gain_node.gain.setTargetAtTime(0, audio_ctx.currentTime, 0.01)
  particle_mesh.material.size = 0.15

  if (duration < unit_duration * 2) {
    current_sequence += `.`
    let estimated_unit = duration
    unit_duration = unit_duration * 0.7 + estimated_unit * 0.3
  }
  else {
    current_sequence += `-`
    let estimated_unit = duration / 3
    unit_duration = unit_duration * 0.7 + estimated_unit * 0.3
  }

  unit_duration = Math.max(50, Math.min(250, unit_duration))
  update_sequence_display()
  letter_timeout = setTimeout(resolve_letter, unit_duration * 3)
}

window.addEventListener(`mousedown`, handle_press)
window.addEventListener(`mouseup`, handle_release)
window.addEventListener(`keydown`, handle_press)
window.addEventListener(`keyup`, handle_release)

window.addEventListener(`touchstart`, (e) => {
  e.preventDefault()
  handle_press(e)
}, {passive: false})

window.addEventListener(`touchend`, (e) => {
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
    s.userData.life -= s.userData.decay
    let fade_in = Math.min(1.0, s.userData.age * 3.0)
    s.material.opacity = Math.max(0, fade_in * s.userData.life)
    s.scale.x += s.userData.decay * 10
    s.scale.y += s.userData.decay * 5

    if (s.userData.life <= 0) {
      scene.remove(s)
      s.material.map.dispose()
      s.material.dispose()
      sprites.splice(i, 1)
    }
  }

  renderer.render(scene, camera)
}

animate()