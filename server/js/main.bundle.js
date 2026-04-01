let Shared = {}

Shared.letters = [`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`, `V`, `W`, `X`, `Y`, `Z`]

Shared.morse_code = {
  ".-":         `A`,
  "-...":       `B`,
  "-.-.":       `C`,
  "-..":        `D`,
  ".":          `E`,
  "..-.":       `F`,
  "--.":        `G`,
  "....":       `H`,
  "..":         `I`,
  ".---":       `J`,
  "-.-":        `K`,
  ".-..":       `L`,
  "--":         `M`,
  "-.":         `N`,
  "---":        `O`,
  ".--.":       `P`,
  "--.-":       `Q`,
  ".-.":        `R`,
  "...":        `S`,
  "-":          `T`,
  "..-":        `U`,
  "...-":       `V`,
  ".--":        `W`,
  "-..-":       `X`,
  "-.--":       `Y`,
  "--..":       `Z`,
  ".----":      `1`,
  "..---":      `2`,
  "...--":      `3`,
  "....-":      `4`,
  ".....":      `5`,
  "-....":      `6`,
  "--...":      `7`,
  "---..":      `8`,
  "----.":      `9`,
  "-----":      `0`,
  "--..--":     `,`,
  ".-.-.-":     `.`,
  "-.-.--":     `!`,
  "..--..":     `?`,
  ".----.":     `'`,
  "-....-":     `-`,
  "...-..-":    `$`,
  ".--.-.":     `@`,
  "---...":     `:`,
  "-.--.":      `(`,
  "-.--.-":     `)`,
  "-...-":      `=`,
  ".-...":      `&`,
  "..--.-":     `_`,
  "-..-.":      `/`,
  "-.-.-.":     `;`,
  ".-.-.":      `+`,
  "--.--":      `Ñ`,
  ".-.-":       `Ä`,
  ".--.-":      `Á`,
  "..-..":      `É`,
  "---.":       `Ö`,
  "..--":       `Ü`,
  "----":       `CH`,
  "...-.-":     `SK`,
  "-.-.-":      `CT`,
  "...-.":      `SN`,
  ".-..-.":     `"`,
  "-.-..":      `Ç`,
  ".-..-":      `È`,
  "...---...":  `SOS`,
  "........":   `ERROR`,
  ".--..":      `Þ`,
  "..--.":      `Ð`,
  ".-.-..":     `¶`,
  ".---.":      `Å`,
  "--.-.":      `Ĝ`,
  "...-...":    `Ś`,
  "--..-.":     `Ź`,
  "--..-":      `Ż`,
  "..-.-":      `¿`,
  "--...-":     `¡`,
  "-...-.-":    `BK`,
}

Shared.zone_settings = {
  1: {unit_duration: 350, iambic_duration: 240, letter_mult: 5.0, word_mult: 10, max_press: 2000, throttle: 60, forgiving: true},
  2: {unit_duration: 300, iambic_duration: 220, letter_mult: 4.5, word_mult: 9, max_press: 1800, throttle: 50, forgiving: true},
  3: {unit_duration: 250, iambic_duration: 200, letter_mult: 4.0, word_mult: 8, max_press: 1500, throttle: 45, forgiving: true},
  4: {unit_duration: 210, iambic_duration: 180, letter_mult: 3.5, word_mult: 7, max_press: 1200, throttle: 40, forgiving: true},
  5: {unit_duration: 180, iambic_duration: 160, letter_mult: 3.5, word_mult: 7, max_press: 1000, throttle: 35, forgiving: false},
  6: {unit_duration: 150, iambic_duration: 140, letter_mult: 3.0, word_mult: 7, max_press: 800, throttle: 30, forgiving: false},
  7: {unit_duration: 120, iambic_duration: 120, letter_mult: 3.0, word_mult: 7, max_press: 700, throttle: 25, forgiving: false},
  8: {unit_duration: 100, iambic_duration: 100, letter_mult: 3.0, word_mult: 7, max_press: 600, throttle: 20, forgiving: false},
  9: {unit_duration: 80, iambic_duration: 80, letter_mult: 3.0, word_mult: 7, max_press: 500, throttle: 15, forgiving: false},
}

Shared.lock_time = 3000

Shared.get_string_hash = (str) => {
  let hash = 0x811c9dc5

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

Shared.create_seeded_random = (seed) => {
  return function() {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

Shared.random_word = (parts = 3, seed = null, capitalize = false) => {
  let cons = `bcdfghjklmnpqrstvwxyz`
  let vowels = `aeiou`
  let rng = seed ? Shared.create_seeded_random(Shared.get_string_hash(seed.toString())) : Math.random
  let cons_next = Math.floor(rng() * 2) === 0
  let word = ``

  for (let i = 0; i < parts * 2; i++) {
    if (!cons_next) {
      let index = Math.floor(rng() * cons.length)
      word += cons[index]
    }
    else {
      let index = Math.floor(rng() * vowels.length)
      word += vowels[index]
    }

    cons_next = !cons_next
  }

  if (capitalize) {
    word = word.charAt(0).toUpperCase() + word.slice(1)
  }

  return word
}

Shared.create_debouncer = (func, delay) => {
  if (typeof func !== `function`) {
    console.error(`Invalid debouncer function`)
    return
  }

  if ((typeof delay !== `number`) || (delay < 1)) {
    console.error(`Invalid debouncer delay`)
    return
  }

  let timer
  let obj = {}

  function clear() {
    clearTimeout(timer)
    timer = undefined
  }

  function run(...args) {
    func(...args)
  }

  obj.call = (...args) => {
    clear()

    timer = setTimeout(() => {
      run(...args)
    }, delay)
  }

  obj.call_2 = (...args) => {
    if (timer) {
      return
    }

    obj.call(args)
  }

  obj.now = (...args) => {
    clear()
    run(...args)
  }

  obj.cancel = () => {
    clear()
  }

  return obj
}

Shared.random_int = (args = {}) => {
  let def_args = {
    exclude: [],
  }

  Shared.def_args(def_args, args)

  if (args.exclude.length > 0) {
    let available = []

    for (let i = args.min; i <= args.max; i++) {
      if (!args.exclude.includes(i)) {
        available.push(i)
      }
    }

    if (!available.length) {
      return
    }

    let random_index

    if (args.rand) {
      random_index = Math.floor(args.rand() * available.length)
    }
    else {
      random_index = Math.floor(Math.random() * available.length)
    }

    return available[random_index]
  }

  if (args.rand) {
    return Math.floor(args.rand() * (args.max - args.min + 1) + args.min)
  }

  return Math.floor(Math.random() * (args.max - args.min + 1) + args.min)
}

Shared.def_args = (def, args) => {
  for (let key in def) {
    if ((args[key] === undefined) && (def[key] !== undefined)) {
      args[key] = def[key]
    }
  }
}

Shared.is_url = (text) => {
  return text.startsWith(`http://`) || text.startsWith(`https://`)
}

Shared.process_gap = (gap, unit_duration, sequence_length, settings) => {
  if ((typeof gap === `number`) && (gap > 0) && (sequence_length > 0)) {
    let max_gap = settings.max_press
    let safe_gap = Math.min(gap, max_gap)

    if (safe_gap < (unit_duration * 2)) {
      let estimated_unit = safe_gap
      unit_duration = unit_duration * 0.8 + estimated_unit * 0.2
      let min_u = settings.forgiving ? 150 : settings.unit_duration * 0.8
      let max_u = settings.forgiving ? 500 : settings.unit_duration * 1.2
      unit_duration = Math.max(min_u, Math.min(max_u, unit_duration))
    }
  }

  return unit_duration
}

Shared.process_duration = (duration, unit_duration, sequence, settings) => {
  let max_allowed = settings.max_press + 500
  let safe_duration = Math.max(10, Math.min(duration, max_allowed))
  let max_seq_length = 15

  if (sequence.length < max_seq_length) {
    if (safe_duration < (unit_duration * 1.5)) {
      sequence += `.`
      let estimated_unit = safe_duration
      unit_duration = unit_duration * 0.7 + estimated_unit * 0.3
    }
    else {
      sequence += `-`
      let estimated_unit = safe_duration / 3
      unit_duration = unit_duration * 0.7 + estimated_unit * 0.3
    }
  }

  let min_u = settings.forgiving ? 150 : settings.unit_duration * 0.8
  let max_u = settings.forgiving ? 500 : settings.unit_duration * 1.2
  unit_duration = Math.max(min_u, Math.min(max_u, unit_duration))

  return {unit_duration, sequence}
}

Shared.validate_timing = (client_time, server_time, max_latency = 1500) => {
  if ((typeof client_time !== `number`) || (client_time <= 0)) {
    return server_time
  }

  let diff = Math.abs(client_time - server_time)

  if (diff <= max_latency) {
    return client_time
  }

  return server_time
}

Shared.is_public_zone = (zone) => {
  return /^[A-Z][1-9]$/i.test(zone)
}

Shared.capitalize = (s) => {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

Shared.ticker_text = (text) => {
  let formatted = text.toLowerCase()

  // turn newlines into a stylized separator for the ticker
  formatted = formatted.replace(/[\r\n]+/g, ` // `)

  // strip out dialogue hyphens
  formatted = formatted.replace(/- /g, ``)

  // remove leading punctuation from segments
  formatted = formatted.replace(/(^|\/\/)\s*[,.;:-]+/g, `$1 `)

  // remove trailing punctuation from segments
  formatted = formatted.replace(/[,.;:-]+(?=\s*(?:\/\/|$))/g, ``)

  // clean up any accidental double spaces
  formatted = formatted.replace(/\s+/g, ` `)

  return formatted.trim()
}

if ((typeof module !== `undefined`) && module.exports) {
  module.exports = Shared
}
else {
  window.Shared = Shared
}
;
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
App.font_string = `noto_font, system-ui, sans-serif`
App.words = []
App.sequence = `above`
App.current_letters = []
App.sekrit_zones = new Set()
App.repo = `github.com/madprops/mallcode`
App.join_sound = true
App.leave_sound = true
App.bg_color = `black`
App.text_color = `white`
App.echo_delay = 5 * 1000
App.ticker_speed = 66
App.colorlib = ColorLib()
App.theme_cache = null

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
        let width = ticker.offsetWidth || (App.echo.length * 10 + 100)
        ticker.style.animationDuration = `${width / App.ticker_speed}s`
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
  let theme = App.get_theme(App.zone, true)
  let texture = App.create_particle_texture(theme)
  let blend_mode = theme.is_dark ? THREE.AdditiveBlending : THREE.NormalBlending
  App.particles_material = new THREE.PointsMaterial({size: 0.15, color: new THREE.Color(theme.particles), map: texture, transparent: true, opacity: 0.6, blending: blend_mode, depthWrite: false})
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
  let theme = App.get_theme(App.zone)
  let blend_mode = theme.is_dark ? THREE.AdditiveBlending : THREE.NormalBlending
  let material = new THREE.SpriteMaterial({map: texture, transparent: true, blending: blend_mode})
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

    sprite.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      type === `word` ? 20 : 0,
    )

    sprite.userData = {
      text,
      type,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        Math.random() * 0.05 + 0.02, 0.05,
      ),
      age: 0,
      life: 1.0,
      decay_rate: type === `word` ? 0.25 : 0.35,
      growth: type === `word` ? 2 : 10,
    },

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
  if (App.moving || App.dial_visible || App.modal_open()) {
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
  if (App.moving || App.dial_visible || App.modal_open()) {
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

App.get_color = (color_string) => {
  if (color_string.startsWith(`#`) || color_string.startsWith(`rgb`)) {
    return color_string
  }

  let temp_el = DOM.create(`div`)
  temp_el.style.color = color_string
  document.body.appendChild(temp_el)
  let rgb = window.getComputedStyle(temp_el).color
  document.body.removeChild(temp_el)
  return rgb
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

  App.set_css_var(`bg_color`, App.bg_color)
}

App.set_css_var = (name, value) => {
  document.documentElement.style.setProperty(`--${name}`, value)
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

  if (App.zone) {
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
  App.bg_color = App.get_zone_color(data.zone)
  App.refresh_bg_color()
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
  There's also sekrit zones and anomalies.
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
  App.setup_about()
  App.setup_zone_map()
  App.setup_zone_map_canvas()
  App.setup_settings()
  App.setup_dials()

  let params = new URLSearchParams(window.location.search)
  let p_zone = params.get(`zone`)

  if (p_zone) {
    App.zone = p_zone.toUpperCase()
  }

  App.setup_socket()
  App.hide_cover()
  App.refresh_bg_color()
}
;
App.zone_dial_delay = 100
App.zone_dial_delay_2 = 1000
App.dial_visible = false

App.setup_dials = () => {
  App.letter_dial_el = DOM.el(`#zone-dial-letter`)
  App.speed_dial_el = DOM.el(`#zone-dial-speed`)

  App.dial_menu_el = DOM.create(`div`)
  App.dial_menu_el.id = `dial-menu`
  App.dial_menu_el.classList.add(`hidden`)
  document.body.appendChild(App.dial_menu_el)

  DOM.ev(App.letter_dial_el, `click`, (e) => {
    e.stopPropagation()
    App.show_dial_menu(`letter`, App.letter_dial_el)
    App.stop_beep()
  })

  DOM.ev(App.letter_dial_el, `wheel`, (e) => {
    let direction = e.deltaY > 0 ? 1 : -1
    let val = App.letter_dial_el.value
    let index = Shared.letters.indexOf(val)
    let new_index

    if (direction > 0) {
      new_index = index + 1
    }
    else {
      new_index = index - 1
    }

    if (new_index < 0) {
      new_index = 0
    }
    else if (new_index >= Shared.letters.length) {
      new_index = Shared.letters.length - 1
    }

    if (index === new_index) {
      return
    }

    let new_val = Shared.letters[new_index]
    let s_val = new_val.toString()
    App.letter_dial_el.value = s_val
    App.letter_dial_el.textContent = s_val
    App.zone_dial_debouncer_2.call()
    e.preventDefault()
  })

  DOM.ev(App.speed_dial_el, `click`, (e) => {
    e.stopPropagation()
    App.show_dial_menu(`speed`, App.speed_dial_el)
    App.stop_beep()
  })

  DOM.ev(App.speed_dial_el, `wheel`, (e) => {
    let direction = e.deltaY > 0 ? 1 : -1
    let val = App.speed_dial_el.value
    let new_val

    if (direction > 0) {
      new_val = parseInt(val) + 1
    }
    else {
      new_val = parseInt(val) - 1
    }

    if (new_val < 1) {
      new_val = 1
    }
    else if (new_val > 9) {
      new_val = 9
    }

    if (val === new_val) {
      return
    }

    let s_val = new_val.toString()
    App.speed_dial_el.value = s_val
    App.speed_dial_el.textContent = s_val
    App.zone_dial_debouncer_2.call()
    e.preventDefault()
  })

  DOM.ev(document.documentElement, `click`, () => {
    App.hide_dial_menu()
  })

  DOM.ev(`#zone-map`, `click`, App.show_zone_map)
}

App.show_dial_menu = (type, anchor_el) => {
  App.dial_menu_el.innerHTML = ``

  let items = []

  if (type === `letter`) {
    for (let i = 0; i < 26; i++) {
      items.push(String.fromCharCode(65 + i))
    }
  }
  else {
    for (let i = 1; i <= 9; i++) {
      items.push(i.toString())
    }
  }

  for (let item of items) {
    let el = DOM.create(`div`)
    el.className = `dial-menu-item`
    el.textContent = item

    DOM.ev(el, `click`, (e) => {
      e.stopPropagation()
      App.hide_dial_menu()
      anchor_el.value = item
      anchor_el.textContent = item
      App.moving = true
      App.defocus_dial()
      App.zone_dial_debouncer.call()
    })

    App.dial_menu_el.appendChild(el)
  }

  DOM.show(App.dial_menu_el)

  let rect = anchor_el.getBoundingClientRect()
  App.dial_menu_el.style.top = `${rect.bottom + 5}px`
  App.dial_menu_el.style.left = `${rect.left}px`
  App.dial_menu_el.style.minWidth = `${rect.width}px`

  let current_val = anchor_el.value

  if (current_val) {
    let selected_el = Array.from(App.dial_menu_el.children).find(c => c.textContent === current_val.toString())

    if (selected_el) {
      selected_el.scrollIntoView({block: `center`})
    }
  }

  App.dial_visible = true
}

App.hide_dial_menu = () => {
  if (App.dial_menu_el) {
    DOM.hide(App.dial_menu_el)
  }

  App.dial_visible = false
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
;
App.get_settings = () => {
  return [
    {
      comment: `Volume level of the beeps`,
      name: `volume`,
      value: App.volume,
      type: `string`,
      options: [`max`, `mid`, `mute`],
    },
    {
      comment: `Sound effect for join events`,
      name: `join_sound`,
      value: App.join_sound,
      type: `boolean`,
    },
    {
      comment: `Sound effect for leave events`,
      name: `leave_sound`,
      value: App.leave_sound,
      type: `boolean`,
    },
    {
      comment: `Max beeps when unfocused`,
      name: `max_unfocused_beeps`,
      value: App.max_unfocused_beeps,
      type: `number`,
      min: 0,
      max: 9999,
    },
    {
      comment: `The background color`,
      name: `bg_color`,
      value: App.bg_color,
      type: `string`,
      color: true,
    },
    {
      comment: `Enable or disable effects`,
      name: `animation`,
      value: App.animation,
      type: `boolean`,
    },
    {
      comment: `Dot dash sequence type`,
      name: `sequence`,
      value: App.sequence,
      type: `string`,
      options: [`base`, `above`, `below`],
    },
  ]
}

App.get_options = (name) => {
  for (let setting of App.get_settings()) {
    if (setting.name === name) {
      return setting.options
    }
  }

  return []
}

App.setup_settings = () => {
  App.msg_settings = Msg.factory({
    before_show: () => {
      let text_value = ``
      let settings = App.get_settings()

      for (let setting of settings) {
        text_value += `\n# ${setting.comment}\n`

        if (setting.options) {
          text_value += `# ${setting.options.join(`, `)}\n`
        }

        if (setting.type === `string`) {
          text_value += `${setting.name} = "${setting.value}"\n`
        }
        else {
          text_value += `${setting.name} = ${setting.value}\n`
        }
      }

      if (App.settings_editor) {
        App.settings_editor.updateCode(text_value.trim())
      }
    },
  })

  let template = DOM.el(`#settings-template`)
  let clone = template.content.cloneNode(true)
  let c = DOM.el(`#settings-container`, clone)
  let btn = DOM.el(`#save-settings-btn`, clone)
  let editor_el = DOM.el(`#settings-editor`, clone)

  let highlight_fn = (editor) => {
    let code = editor.textContent
    editor.innerHTML = Prism.highlight(code, Prism.languages.toml, `toml`)
  }

  App.settings_editor = CodeJar(editor_el, highlight_fn)
  DOM.ev(btn, `click`, App.check_save_settings)
  App.msg_settings.set(c)
}

App.show_settings = () => {
  App.msg_settings.show()
}

App.check_save_settings = () => {
  let content = App.settings_editor.toString()
  let parsed_toml = {}

  try {
    parsed_toml = toml.parse(content)
  }
  catch (error) {
    console.error(error)
    alert(`Invalid TOML format. Please check your syntax.`)
    return
  }

  let settings = App.get_settings()

  for (let setting of settings) {
    let setting_value = parsed_toml[setting.name]

    if (setting_value === undefined) {
      alert(`Missing '${setting.name}' setting.`)
      return
    }

    if (typeof setting_value !== setting.type) {
      alert(`'${setting.name}' must be of type ${setting.type}.`)
      return
    }

    if (setting.type === `number`) {
      if ((setting.min !== undefined) && (setting_value < setting.min)) {
        alert(`'${setting.name}' must be at least ${setting.min}.`)
        return
      }

      if ((setting.max !== undefined) && (setting_value > setting.max)) {
        alert(`'${setting.name}' must be at most ${setting.max}.`)
        return
      }
    }
    else if (setting.type === `boolean`) {
      if ((setting_value !== true) && (setting_value !== false)) {
        alert(`'${setting.name}' must be a boolean.`)
        return
      }
    }
    else if (setting.options) {
      if (!setting.options.includes(setting_value)) {
        alert(`'${setting.name}' must be one of ${setting.options.join(`, `)}.`)
        return
      }
    }
  }

  for (let setting of settings) {
    let value = parsed_toml[setting.name]
    setting.value = value
    App[setting.name] = value
    App.storage[setting.name] = value
  }

  App.get_theme(App.zone, true)
  App.refresh_sound_icon()
  App.refresh_bg_color()
  App.save_storage()
  App.msg_settings.close()
}
;
App.audio_context = window.AudioContext || window.webkitAudioContext
App.max_volume_level = 0.5
App.mid_volume_level = 0.25
App.mute_volume_level = 0
App.volume = `max`
App.audio_started = false

App.init_audio = () => {
  if (!App.audio_ctx) {
    App.audio_ctx = new App.audio_context()
  }

  if (App.audio_ctx.state === `suspended`) {
    App.audio_ctx.resume()
  }

  App.audio_started = true
}

App.play_warp_drive = () => {
  if (!App.audio_started || !App.focused) {
    return
  }

  let duration = 1.5
  let start_time = App.audio_ctx.currentTime
  let osc_main = App.audio_ctx.createOscillator()
  let osc_sub = App.audio_ctx.createOscillator()
  let main_gain = App.audio_ctx.createGain()
  let low_pass_filter = App.audio_ctx.createBiquadFilter()

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
  low_pass_filter.connect(App.audio_ctx.destination)

  osc_main.start(start_time)
  osc_sub.start(start_time)

  osc_main.stop(start_time + duration)
  osc_sub.stop(start_time + duration)
}

App.play_zone_enter = () => {
  if (!App.audio_started || !App.focused || !App.join_sound) {
    return
  }

  let duration = 1.2
  let start_time = App.audio_ctx.currentTime
  let osc_main = App.audio_ctx.createOscillator()
  let osc_sub = App.audio_ctx.createOscillator()
  let main_gain = App.audio_ctx.createGain()
  let filter = App.audio_ctx.createBiquadFilter()

  osc_main.type = `sine`
  // swapped square for triangle to remove the harsh digital edge
  osc_sub.type = `triangle`
  filter.type = `bandpass`

  // sweeping to a lower peak frequency makes it less piercing
  filter.frequency.setValueAtTime(200, start_time)
  filter.frequency.exponentialRampToValueAtTime(1200, start_time + 0.3)

  osc_main.frequency.setValueAtTime(440, start_time)
  osc_main.frequency.setValueAtTime(659.25, start_time + 0.2)

  osc_sub.frequency.setValueAtTime(220, start_time)
  osc_sub.frequency.setValueAtTime(329.63, start_time + 0.2)

  // slower attack and lower peak volume for a gentler swell
  main_gain.gain.setValueAtTime(0, start_time)
  main_gain.gain.linearRampToValueAtTime(0.12, start_time + 0.15)
  main_gain.gain.exponentialRampToValueAtTime(0.01, start_time + duration)

  osc_main.connect(main_gain)
  osc_sub.connect(main_gain)
  main_gain.connect(filter)
  filter.connect(App.audio_ctx.destination)

  osc_main.start(start_time)
  osc_sub.start(start_time)

  osc_main.stop(start_time + duration)
  osc_sub.stop(start_time + duration)
}

App.play_zone_leave = () => {
  if (!App.audio_started || !App.focused || !App.leave_sound) {
    return
  }

  let duration = 0.7
  let start_time = App.audio_ctx.currentTime
  let osc_main = App.audio_ctx.createOscillator()
  let osc_sub = App.audio_ctx.createOscillator()
  let main_gain = App.audio_ctx.createGain()
  let filter = App.audio_ctx.createBiquadFilter()

  osc_main.type = `sine`
  // returning to a triangle wave softens the exit so it feels less abrupt
  osc_sub.type = `triangle`
  filter.type = `lowpass`

  // sweeping the filter down muffles the sound over time, making it feel distant
  filter.frequency.setValueAtTime(2000, start_time)
  filter.frequency.exponentialRampToValueAtTime(100, start_time + duration)

  // a smooth downward frequency slide to simulate powering down or leaving
  osc_main.frequency.setValueAtTime(440, start_time)
  osc_main.frequency.exponentialRampToValueAtTime(55, start_time + duration)

  osc_sub.frequency.setValueAtTime(220, start_time)
  osc_sub.frequency.exponentialRampToValueAtTime(27.5, start_time + duration)

  // quick initial presence, then a faster fade into nothingness
  main_gain.gain.setValueAtTime(0, start_time)
  main_gain.gain.linearRampToValueAtTime(0.15, start_time + 0.1)
  main_gain.gain.exponentialRampToValueAtTime(0.01, start_time + duration)

  osc_main.connect(main_gain)
  osc_sub.connect(main_gain)
  main_gain.connect(filter)
  filter.connect(App.audio_ctx.destination)

  osc_main.start(start_time)
  osc_sub.start(start_time)

  osc_main.stop(start_time + duration)
  osc_sub.stop(start_time + duration)
}

App.sound_enabled = () => {
  return App.volume !== `mute`
}

App.refresh_sound_icon = () => {
  if (App.volume === `max`) {
    App.sound_btn.textContent = `🔊`
  }
  else if (App.volume === `mid`) {
    App.sound_btn.textContent = `🔉`
  }
  else {
    App.sound_btn.textContent = `🔇`
  }
}

App.setup_sound = () => {
  App.refresh_sound_icon()

  App.sound_btn.addEventListener(`click`, () => {
    if (App.volume === `max`) {
      App.volume = `mid`
    }
    else if (App.volume === `mid`) {
      App.volume = `mute`
    }
    else {
      App.volume = `max`
    }

    if (App.storage) {
      App.save_storage()
    }

    App.refresh_sound_icon()

    if (!App.sound_enabled()) {
      App.stop_beep()
    }

    App.sound_btn.blur()
  })
}

App.play_beep = (seed = `normal`) => {
  if (App.active_osc) {
    App.stop_beep()
  }

  if (!App.audio_started) {
    return
  }

  if (!App.focused) {
    if (App.unfocused_beep_count >= App.max_unfocused_beeps) {
      return
    }

    App.unfocused_beep_count += 1
  }

  if (App.volume === `mute`) {
    return
  }

  let hash = Shared.get_string_hash(seed)
  let rng = Shared.create_seeded_random(hash)
  let start_time = App.audio_ctx.currentTime
  App.active_osc = App.audio_ctx.createOscillator()
  App.gain_node = App.audio_ctx.createGain()
  let filter = App.audio_ctx.createBiquadFilter()
  filter.type = `lowpass`
  let instrument_type = Math.floor(rng() * 4)

  // 10ms attack prevents popping but feels instantly responsive
  let attack = 0.01

  let start_freq = 400 + rng() * 400

  if (instrument_type === 0) {
    App.active_osc.type = `sine`
    filter.frequency.value = 20000
  }
  else if (instrument_type === 1) {
    App.active_osc.type = `triangle`
    filter.frequency.value = start_freq * 3
  }
  else if (instrument_type === 2) {
    App.active_osc.type = `square`
    filter.frequency.value = start_freq * 1.5
  }
  else {
    App.active_osc.type = `sawtooth`
    filter.frequency.value = start_freq * 1.2
  }

  App.active_osc.frequency.setValueAtTime(start_freq, start_time)
  App.gain_node.gain.setValueAtTime(0, start_time)
  App.gain_node.gain.linearRampToValueAtTime(App.get_volume(), start_time + attack)
  App.active_osc.connect(filter)
  filter.connect(App.gain_node)
  App.gain_node.connect(App.audio_ctx.destination)
  App.active_osc.start(start_time)
  App.stop_beep_debouncer.call()
}

App.get_volume = () => {
  if (App.volume === `max`) {
    return App.max_volume_level
  }

  if (App.volume === `mid`) {
    return App.mid_volume_level
  }

  return App.mute_volume_level
}

App.stop_beep = () => {
  if (!App.active_osc) {
    return
  }

  let stop_time = App.audio_ctx.currentTime

  // 20ms release cuts off cleanly without a popping artifact
  let release = 0.02

  App.gain_node.gain.cancelScheduledValues(stop_time)
  App.gain_node.gain.setValueAtTime(App.gain_node.gain.value, stop_time)
  App.gain_node.gain.linearRampToValueAtTime(0, stop_time + release)
  App.active_osc.stop(stop_time + release + 0.01)
  App.active_osc = null
  App.gain_node = null
}
;
App.zone_colors = {
  A: `rgb(60, 0, 0)`,
  B: `rgb(80, 40, 0)`,
  C: `rgb(60, 60, 0)`,
  D: `rgb(40, 80, 0)`,
  E: `rgb(0, 60, 0)`,
  F: `rgb(0, 80, 40)`,
  G: `rgb(0, 60, 60)`,
  H: `rgb(0, 40, 80)`,
  I: `rgb(0, 0, 80)`,
  J: `rgb(40, 0, 80)`,
  K: `rgb(60, 0, 60)`,
  L: `rgb(80, 0, 40)`,
  M: `rgb(90, 10, 20)`,
  N: `rgb(70, 30, 10)`,
  O: `rgb(70, 50, 0)`,
  P: `rgb(20, 70, 20)`,
  Q: `rgb(10, 70, 70)`,
  R: `rgb(10, 10, 70)`,
  S: `rgb(50, 10, 90)`,
  T: `rgb(70, 20, 60)`,
  U: `rgb(30, 40, 40)`,
  V: `rgb(15, 20, 60)`,
  W: `rgb(60, 50, 20)`,
  X: `rgb(80, 30, 30)`,
  Y: `rgb(30, 60, 40)`,
  Z: `rgb(0, 0, 0)`,
}

App.get_theme = (zone, force = false) => {
  if (!force && App.theme_cache) {
    return App.theme_cache
  }

  let seed = Shared.get_string_hash(zone)
  let random = Shared.create_seeded_random(seed)
  let bg_val = App.get_color(App.bg_color)
  let is_dark = App.colorlib.is_dark(bg_val)
  let base_hue = random() * 360
  let hue1 = base_hue
  let hue2 = (base_hue + 120 + random() * 40 - 20) % 360
  let particle_hue = random() * 360
  let l_min, l_max, p_min, p_max

  if (is_dark) {
    l_min = 60
    l_max = 80
    p_min = 55
    p_max = 75
  }

  else {
    l_min = 10
    l_max = 30
    p_min = 15
    p_max = 35
  }

  let shapes = [`circle`, `square`, `triangle`, `star`]
  let shape = shapes[Shared.random_int({min: 0, max: shapes.length - 1, rand: random})]

  let theme = {
    letter: `hsl(${Math.round(hue1)}, ${Shared.random_int({min: 70, max: 100, rand: random})}%, ${Shared.random_int({min: l_min, max: l_max, rand: random})}%)`,
    word: `hsl(${Math.round(hue2)}, ${Shared.random_int({min: 70, max: 100, rand: random})}%, ${Shared.random_int({min: l_min, max: l_max, rand: random})}%)`,
    particles: `hsl(${Math.round(particle_hue)}, ${Shared.random_int({min: 80, max: 100, rand: random})}%, ${Shared.random_int({min: p_min, max: p_max, rand: random})}%)`,
    shape,
    is_dark,
  }

  if (is_dark) {
    App.text_color = `white`
  }
  else {
    App.text_color = `black`
  }

  let text_val = App.get_color(App.text_color)
  App.set_css_var(`text_color`, text_val)

  App.border_color = App.colorlib.get_lighter_or_darker(text_val, 0.6)
  App.set_css_var(`border_color`, App.border_color)

  App.highlight_color = App.colorlib.get_lighter_or_darker(bg_val, 0.1)
  App.set_css_var(`highlight_color`, App.highlight_color)

  App.theme_cache = theme

  if (App.particles_material) {
    if (App.particles_material.map) {
      App.particles_material.map.dispose()
    }

    App.particles_material.map = App.create_particle_texture(theme)
    App.particles_material.color.set(theme.particles)
    App.particles_material.blending = theme.is_dark ? THREE.AdditiveBlending : THREE.NormalBlending
    App.particles_material.needsUpdate = true
  }

  return theme
}

App.get_zone_color = (zone_name) => {
  let letter = zone_name.charAt(0)

  if (App.zone_colors[letter]) {
    return App.zone_colors[letter]
  }

  return `#000000`
}
;
App.zone_refresh_delay = 10
App.max_zone_map_updates = 12
App.zone_map_updates = 0

App.update_zone_map_styles = () => {
  let c = DOM.el(`#zone-map-container`)

  if (!c) {
    return
  }

  let current_time = Date.now()
  let btns = DOM.els(`.zone-map-btn`, c)

  for (let btn of btns) {
    let zone = btn.dataset.zone
    let style = App.get_zone_styling(zone, current_time)

    btn.className = style.cls
    btn.style.color = style.color
    btn.style.backgroundColor = style.bg
    btn.style.borderColor = style.border
  }
}

App.setup_zone_map = () => {
  App.msg_zone_map = Msg.factory({
    after_show: () => {
      App.zone_refresh_interval = setInterval(() => {
        if (App.zone_map_updates >= App.max_zone_map_updates) {
          App.msg_zone_map.close()
          return
        }

        App.show_zone_map()
      }, App.zone_refresh_delay * 1000)
    },
    after_close: () => {
      clearInterval(App.zone_refresh_interval)
      App.zone_map_updates = 0
    },
  })

  let template = DOM.el(`#zone-map-template`)
  let clone = template.content.cloneNode(true)
  let c = DOM.el(`#zone-map-container`, clone)
  App.msg_zone_map.set(c)

  let grid_el = DOM.el(`#zone-map-grid`, c)
  let is_down = false
  let start_y
  let scroll_top
  App.zone_map_has_dragged = false

  let start_drag = (e) => {
    is_down = true
    App.zone_map_has_dragged = false
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
      App.zone_map_has_dragged = true

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

  DOM.ev(c, `click`, (e) => {
    if (!e.target.classList.contains(`zone-map-btn`)) {
      return
    }

    let btn = e.target

    if (App.zone_map_has_dragged) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    let zone = btn.dataset.zone

    if (Shared.is_public_zone(zone)) {
      App.letter_dial_el.value = zone.charAt(0)
      App.speed_dial_el.value = zone.charAt(1)
      App.zone_dial_action()
    }
    else if ((zone !== App.zone) && App.ws && (App.ws.readyState === WebSocket.OPEN)) {
      App.ws.send(JSON.stringify({type: `RESTORE_ZONE`, zone}))
    }

    clearInterval(App.zone_refresh_interval)
    App.msg_zone_map.close()
  })

  setTimeout(() => {
    let active_btn = DOM.el(`[data-zone="${App.zone}"]`, c)

    if (active_btn) {
      active_btn.scrollIntoView({behavior: `instant`, block: `center`, inline: `center`})
    }
  }, 10)
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

  let hue = Math.round(120 - (activity * 120))
  let color = `hsl(${hue}, 100%, 60%)`
  let bg = `hsl(${hue}, 50%, 15%)`

  return {color, bg}
}

App.get_zone_styling = (zone, current_time) => {
  let info = App.zones_info[zone] || {last_activity: 0, user_count: 0}
  let colors = App.get_zone_colors(info.last_activity, current_time)
  let is_current = zone === App.zone
  let is_populated = info.user_count > 0
  let cls = `zone-map-btn`

  if (is_current) {
    cls += ` zone-map-current`
  }
  else if (is_populated) {
    cls += ` zone-map-populated`
  }

  return {color: colors.color, bg: colors.bg, cls}
}

App.get_zone_btn_html = (zone, current_time) => {
  let style = App.get_zone_styling(zone, current_time)
  return `<button class="${style.cls}" data-zone="${zone}" style="color: ${style.color}; background-color: ${style.bg};">${zone}</button>`
}

App.build_zone_selector = (zones_info) => {
  App.zones_info = zones_info

  if (App.msg_zone_map.is_open()) {
    App.zone_map_updates += 1
    App.update_zone_map_styles()
    return
  }

  App.zone_map_updates = 0
  let html = ``
  let now = Date.now()
  let grid = DOM.el(`#zone-map-grid`)

  if (App.sekrit_zones.size > 0) {
    let sorted_sekrits = Array.from(App.sekrit_zones).sort()

    for (let zone of sorted_sekrits) {
      html += App.get_zone_btn_html(zone, now)
    }
  }

  DOM.el(`#zone-map-sekrit-row`).innerHTML = html
  html = ``

  for (let i = 0; i < 26; i++) {
    let letter = String.fromCharCode(65 + i)

    for (let speed = 1; speed <= 9; speed++) {
      let zone = `${letter}${speed}`
      html += App.get_zone_btn_html(zone, now)
    }
  }

  grid.innerHTML = html
  App.msg_zone_map.show()
}