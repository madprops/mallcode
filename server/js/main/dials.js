App.zone_dial_delay = 100
App.zone_dial_delay_2 = 600
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
      let zone = App.get_dial_zone()

      if (zone === App.zone) {
        return
      }

      App.moving = true
      clearTimeout(App.moving_timeout)

      App.moving_timeout = setTimeout(() => {
        if (App.moving) {
          App.moving = false
        }
      }, 5 * 100)

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

App.get_dial_zone = () => {
  let letter = App.letter_dial_el.value
  let speed = App.speed_dial_el.value
  return `${letter}${speed}`
}

App.zone_dial_action = () => {
  let new_zone = App.get_dial_zone()

  if ((new_zone !== App.zone) && App.ws && (App.ws.readyState === WebSocket.OPEN)) {
    App.go_to_zone(new_zone)
  }
}