App.settings = [
  {
    comment: `Max beeps when the tab is unfocused`,
    name: `max_unfocused_beeps`,
    value: App.max_unfocused_beeps,
  },
]

App.setup_settings = () => {
  App.msg_settings = Msg.factory({
    before_show: () => {
      let text_value = ``

      for (let setting of App.settings) {
        text_value += `# ${setting.comment}\n`
        text_value += `${setting.name} = ${setting.value}`
      }

      let text = DOM.el(`#settings-textarea`)
      text.value = text_value
    }
  })

  let template = DOM.el(`#settings-template`)
  let clone = template.content.cloneNode(true)
  let c = DOM.el(`#settings-container`, clone)
  let btn = DOM.el(`#save-settings-btn`, clone)
  DOM.ev(btn, `click`, App.check_save_settings)
  App.msg_settings.set(c)
}

App.show_settings = () => {
  App.msg_settings.show()
}

App.check_save_settings = () => {
  let textarea = DOM.el(`#settings-textarea`)
  let content = textarea.value
  let match = /max_unfocused_beeps\s*=\s*(\d+)/.exec(content)

  if (match && match[1]) {
    let value = parseInt(match[1], 10)

    if (!isNaN(value) && (value >= 0) && (value <= 9999)) {
      App.max_unfocused_beeps = value
      App.storage.max_unfocused_beeps = value
      App.save_storage()
      App.msg_settings.close()
    }
    else {
      alert(`'max_unfocused_beeps' must be a number between 0 and 9999.`)
    }
  }
  else {
    alert(`Invalid format for 'max_unfocused_beeps'. Expected 'max_unfocused_beeps = 5'.`)
  }
}