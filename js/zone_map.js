App.zone_refresh_delay = 10

App.setup_zone_map = () => {
  App.msg_zone_map = Msg.factory()
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

  let btns = DOM.els(`.zone-map-btn`, c)

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
  }, App.zone_refresh_delay * 1000)

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

  if (App.zone_refresh_interval) {
    clearInterval(App.zone_refresh_interval)
  }
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
  let html = ``
  let now = Date.now()

  if (App.sekrit_zones.size > 0) {
    html += ``
    let sorted_sekrits = Array.from(App.sekrit_zones).sort()

    for (let zone of sorted_sekrits) {
      let info = zones_info[zone] || {last_activity: 0}
      let colors = App.get_zone_colors(info.last_activity, now)
      let is_current = zone === App.zone
      let cls = is_current ? `zone-map-btn zone-map-current` : `zone-map-btn`
      html += `<button class="${cls}" data-zone="${zone}" style="color: ${colors.color}; background-color: ${colors.bg}; border-color: ${is_current ? `#00aaff` : colors.color}">${zone}</button>`
    }
  }

  DOM.el(`#zone-map-sekrit-row`).innerHTML = html
  html = ``

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

  DOM.el(`#zone-map-grid`).innerHTML = html
  App.msg_zone_map.show()
}