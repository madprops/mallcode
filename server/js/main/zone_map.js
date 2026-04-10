App.zone_refresh_delay = 60
App.max_zone_map_updates = 12
App.zone_map_updates = 0
App.zone_map_heat_hours = 12

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

    if (style.tooltip) {
      btn.dataset.tooltip = style.tooltip
    }
    else {
      btn.removeAttribute(`data-tooltip`)
    }
  }
}

App.setup_zone_map = () => {
  let template = DOM.el(`#zone-map-template`)
  let clone = template.content.cloneNode(true)
  let c = DOM.el(`#zone-map-container`, clone)

  App.msg_zone_map = Msg.factory({
    after_show: () => {
      let active_btn = DOM.el(`[data-zone="${App.zone}"]`, c)

      if (active_btn) {
        active_btn.scrollIntoView({behavior: `instant`, block: `center`, inline: `center`})
      }

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

  App.msg_zone_map.set(c)
  App.zone_map_grid_el = DOM.el(`#zone-map-grid`, c)
  App.zone_map_has_dragged = false
  App.zone_map_down = false

  let start_drag = (e) => {
    App.zone_map_down = true
    App.zone_map_has_dragged = false
    App.zone_map_start_y = e.pageY || (e.touches && e.touches[0].pageY)
    App.zone_map_scroll_top = App.zone_map_grid_el.scrollTop
    App.zone_map_grid_el.style.cursor = `grabbing`
    App.zone_map_grid_el.style.userSelect = `none`
    App.hide_tooltips()
  }

  let end_drag = () => {
    App.zone_map_down = false
    App.zone_map_grid_el.style.cursor = `grab`
    App.zone_map_grid_el.style.userSelect = ``
    App.show_tooltips()
  }

  let move_drag = (e) => {
    if (!App.zone_map_down) {
      return
    }

    let page_y = e.pageY || (e.touches && e.touches[0].pageY)

    if (page_y === undefined) {
      return
    }

    let walk = page_y - App.zone_map_start_y

    if (Math.abs(walk) > 5) {
      App.zone_map_has_dragged = true

      if (e.cancelable && (e.type === `touchmove`)) {
        e.preventDefault()
      }
    }

    App.zone_map_grid_el.scrollTop = App.zone_map_scroll_top - walk
  }

  App.zone_map_grid_el.style.cursor = `grab`

  DOM.ev(App.zone_map_grid_el, `mousedown`, start_drag)
  DOM.ev(App.zone_map_grid_el, `mouseleave`, end_drag)
  DOM.ev(App.zone_map_grid_el, `mouseup`, end_drag)
  DOM.ev(App.zone_map_grid_el, `mousemove`, move_drag)

  DOM.ev(App.zone_map_grid_el, `touchstart`, start_drag, {passive: true})
  DOM.ev(App.zone_map_grid_el, `touchend`, end_drag)
  DOM.ev(App.zone_map_grid_el, `touchcancel`, end_drag)
  DOM.ev(App.zone_map_grid_el, `touchmove`, move_drag, {passive: false})

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
      App.go_to_zone(zone)
    }

    clearInterval(App.zone_refresh_interval)
    App.msg_zone_map.close()
  })
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
    let fraction_of_time = time_since_active / (3600000 * App.zone_map_heat_hours)
    activity = Math.max(0, 1 - fraction_of_time)
  }

  let hue = Math.round(120 - (activity * 120))
  let color = `hsl(${hue}, 100%, 60%)`
  let bg = `hsl(${hue}, 50%, 15%)`

  return {color, bg}
}

App.get_zone_styling = (zone, current_time) => {
  let info = App.zones_info[zone] || {last_activity: 0, user_count: 0, latest_word: ``}
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

  let tooltip = ``

  if (info.user_count > 0) {
    tooltip += Shared.singular_or_plural(info.user_count, `user`, `users`)
  }

  if (info.latest_word) {
    if (tooltip) {
      tooltip += ` | `
    }

    tooltip += info.latest_word
  }

  if (!tooltip) {
    tooltip = `Empty`
  }

  return {color: colors.color, bg: colors.bg, cls, tooltip}
}

App.get_zone_btn_html = (zone, current_time) => {
  let style = App.get_zone_styling(zone, current_time)
  let title_attr = style.tooltip ? ` data-tooltip="${style.tooltip}"` : ``
  return `<div class="${style.cls}" data-zone="${zone}" style="color: ${style.color}; background-color: ${style.bg};"${title_attr}>${zone}</div>`
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

App.setup_zone_map_icon = () => {
  App.zone_map_icon = DOM.el(`#zone-map-icon`)

  if (!App.zone_map_icon) {
    return
  }

  App.zone_map_ctx = App.zone_map_icon.getContext(`2d`)
  App.zone_map_icon.width = 48
  App.zone_map_icon.height = 48

  DOM.ev(App.zone_map_icon, `click`, App.show_zone_map)
}

App.animate_zone_map_icon = () => {
  if (!App.zone_map_ctx || !App.zone_map_icon_locked_color) {
    return
  }

  let w = App.zone_map_icon.width
  let h = App.zone_map_icon.height
  App.zone_map_ctx.fillStyle = App.bg_color
  App.zone_map_ctx.fillRect(0, 0, w, h)

  if (!App.zone) {
    return
  }

  let time = App.animation ? performance.now() * 0.0035 : 1
  let pulse = (Math.sin(time) + 1) / 2
  let now = performance.now()
  let is_locked = App.is_pressed || ((now - App.remote_lock_time) < Shared.lock_time) || ((now - App.last_input_time) < Shared.lock_time)

  App.zone_map_ctx.fillStyle = is_locked ? App.zone_map_icon_locked_color : App.zone_map_icon_unlocked_color
  App.zone_map_ctx.globalAlpha = 1.0
  App.zone_map_ctx.beginPath()

  let core_radius = 12 + pulse * 4
  App.zone_map_ctx.arc(w / 2, h / 2, core_radius, 0, Math.PI * 2)
  App.zone_map_ctx.fill()

  if (App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.zone_map_ctx.strokeStyle = App.text_color
    App.zone_map_ctx.globalAlpha = 0.8
    App.zone_map_ctx.lineWidth = 3
    App.zone_map_ctx.beginPath()

    let ring_radius = core_radius + 5
    App.zone_map_ctx.arc(w / 2, h / 2, ring_radius, 0, Math.PI * 2)
    App.zone_map_ctx.stroke()
  }

  App.zone_map_ctx.globalAlpha = 1.0
}