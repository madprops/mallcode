App.show_message = (args = {}) => {
  let def_args = {
    text: ``,
    html: ``,
    pissed: false,
    pre: false,
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
  }
  else {
    container.classList.remove(`pissed`)
  }

  if (args.pre) {
    container.classList.add(`pre`)
  }
  else {
    container.classList.remove(`pre`)
  }

  container.innerHTML = content
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

App.show_update = (msg, func) => {
  let el = DOM.create(`div`)
  el.textContent = msg

  if (func) {
    DOM.ev(el, `click`, func)
    el.classList.add(`pointer`)
  }

  App.updates_el.prepend(el)

  setTimeout(() => {
    el.remove()
  }, App.updates_duration)
}

App.clear_updates = () => {
  App.updates_el.innerHTML = ``
}

App.show_about = () => {
  let text = App.get_about_text()
  App.show_message({text, pre: true})
}

App.modal_open = () => {
  return App.msg_message.any_open()
}

App.setup_msg_message = () => {
  App.msg_message = Msg.factory({id: `message`})
  let template = DOM.el(`#message-template`)
  let clone = template.content.cloneNode(true)
  let c = DOM.el(`#message-container`, clone)
  App.modal_el = c
  App.msg_message.set(c)
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
    label = label.substring(0, 25).trim()
    cls = ` clean-link`
  }

  return text.replace(/(https?:\/\/[^\s]+)/g, `<a class="${cls}" href="$1" target="_blank">${label}</a>`)
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