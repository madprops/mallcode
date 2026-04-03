App.setup_tooltips = () => {
  App.tooltip_el = DOM.create(`div`)
  App.tooltip_el.id = `app-tooltip`
  document.body.appendChild(App.tooltip_el)

  DOM.ev(document.body, `mouseover`, (e) => {
    let target = e.target.closest(`[data-tooltip]`)

    if (target) {
      App.create_tooltip(target)
    }
  })

  DOM.ev(document.body, `mouseout`, (e) => {
    let target = e.target.closest(`[data-tooltip]`)

    if (target) {
      App.hide_tooltip()
    }
  })

  // Hide the tooltip on interactions
  DOM.ev(document.body, `mousedown`, App.hide_tooltip)
  DOM.ev(document.body, `touchstart`, App.hide_tooltip, {passive: true})
}

App.create_tooltip = (target) => {
  App.tooltip_el.textContent = target.dataset.tooltip
  App.tooltip_el.style.opacity = `1`

  let rect = target.getBoundingClientRect()
  App.tooltip_el.style.top = `${rect.top}px`
  App.tooltip_el.style.left = `${rect.left + (rect.width / 2)}px`
}

App.hide_tooltip = () => {
  App.tooltip_el.style.opacity = `0`
}