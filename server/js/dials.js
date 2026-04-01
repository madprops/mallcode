App.zone_dial_delay = 100
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

  DOM.ev(App.speed_dial_el, `click`, (e) => {
    e.stopPropagation()
    App.show_dial_menu(`speed`, App.speed_dial_el)
    App.stop_beep()
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