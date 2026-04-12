App.material_cache = {}

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
  App.particles_material = new THREE.PointsMaterial({size: App.particle_size_small, color: new THREE.Color(theme.particles), map: texture, transparent: true, opacity: 0.6, blending: blend_mode, depthWrite: false})
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
  let is_cjk = /[\u3040-\u30ff\u3130-\u318f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af]/.test(text)

  if (is_word) {
    let font_size = is_cjk ? 110 : 80
    ctx.font = `bold ${font_size}px ${App.font_string}`
    ctx.fillStyle = theme.word
    ctx.textAlign = `center`
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 30
    let metrics = ctx.measureText(text)
    let visual_center_y = (text_canvas.height / 2) + ((metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2)
    ctx.fillText(text, text_canvas.width / 2, visual_center_y)
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
    let font_size = is_cjk ? 240 : 180
    ctx.font = `bold ${font_size}px ${App.font_string}`
    ctx.fillStyle = force_word_color ? theme.word : theme.letter
    ctx.textAlign = `center`
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 30
    let metrics = ctx.measureText(text)
    let visual_center_y = (text_canvas.height / 2) + ((metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2)
    ctx.fillText(text, text_canvas.width / 2, visual_center_y)
  }

  return new THREE.CanvasTexture(text_canvas)
}

App.spawn_sprite = (text, type) => {
  let cache_key = `${text}_${type}`
  let base_material

  if (App.material_cache[cache_key]) {
    base_material = App.material_cache[cache_key]
  }
  else {
    let texture = App.create_text_texture(text, type === `word`, type === `sequence`)
    let theme = App.get_theme(App.zone)
    let blend_mode = theme.is_dark ? THREE.AdditiveBlending : THREE.NormalBlending
    base_material = new THREE.SpriteMaterial({map: texture, transparent: true, blending: blend_mode})
    App.material_cache[cache_key] = base_material
  }

  let material = base_material.clone()
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
    }

    App.sprites.push(sprite)
  }

  App.scene.add(sprite)

  while (App.sprites.length > 40) {
    let old_sprite = App.sprites.shift()
    App.scene.remove(old_sprite)
    old_sprite.material.dispose()
  }

  return sprite
}

App.update_sequence_display = () => {
  if (App.active_sequence_sprite) {
    App.scene.remove(App.active_sequence_sprite)
    App.active_sequence_sprite.material.dispose()
    App.active_sequence_sprite = null
  }

  if (App.current_sequence) {
    App.active_sequence_sprite = App.spawn_sprite(App.current_sequence, `sequence`)
  }
}

App.animate = () => {
  requestAnimationFrame(App.animate)
  App.timer.update()
  let delta = App.timer.getDelta()

  if (App.animation) {
    App.particle_mesh.rotation.y += 0.02 * delta
    App.particle_mesh.rotation.x += 0.01 * delta
  }
  else {
    App.camera.position.z = 40
  }

  if (App.target_z === undefined) {
    App.target_z = 40
  }

  if (App.target_particle_size === undefined) {
    App.target_particle_size = App.particle_size_small
  }

  if (App.is_pressed !== App.was_pressed) {
    if (App.is_pressed) {
      App.zoom_speed = App.zoom_speed_press
      App.zoom_debouncer.cancel()
      App.target_z = 35
      App.target_particle_size = App.particle_size_big
    }
    else {
      App.zoom_debouncer.call()
    }

    App.was_pressed = App.is_pressed
  }

  if (App.animation) {
    App.camera.position.z = THREE.MathUtils.lerp(App.camera.position.z, App.target_z, App.zoom_speed)
    App.particles_material.size = THREE.MathUtils.lerp(App.particles_material.size, App.target_particle_size, App.zoom_speed)
  }
  else {
    App.camera.position.z = 40
    App.particles_material.size = App.particle_size_small
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
      s.material.dispose()
      App.sprites.splice(i, 1)
    }
  }

  App.animate_zone_map_icon()
  App.renderer.render(App.scene, App.camera)
}

App.refresh_animation = () => {
  if (App.particle_mesh) {
    App.particle_mesh.visible = App.animation
  }
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