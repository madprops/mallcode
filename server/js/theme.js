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
    App.zone_map_icon_locked_color = `#ff8899`
    App.zone_map_icon_unlocked_color = `#88ffaa`
  }

  else {
    App.text_color = `black`
    App.zone_map_icon_locked_color = `#e05070`
    App.zone_map_icon_unlocked_color = `#22aa55`
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

  if (!Shared.is_public_zone(zone_name)) {
    let seed = Shared.get_string_hash(zone_name)
    let random = Shared.create_seeded_random(seed)
    let keys = Object.keys(App.zone_colors)
    letter = keys[Shared.random_int({min: 0, max: keys.length - 1, rand: random})]
  }

  if (App.zone_colors[letter]) {
    return App.zone_colors[letter]
  }

  return `#000000`
}

App.get_bg_color = (zone) => {
  if (App.background === `auto`) {
    return App.get_zone_color(zone)
  }
  else {
    return App.background
  }
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

App.update_background = () => {
  App.bg_color = App.get_bg_color(App.zone)
}

App.refresh_background = () => {
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