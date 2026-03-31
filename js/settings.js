App.settings = [
  {
    comment: `Max beeps when the tab is unfocused`,
    name: `max_unfocused_beeps`,
    value: App.max_unfocused_beeps,
    type: `number`,
    min: 0,
    max: 9999,
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
]

App.setup_settings = () => {
  App.msg_settings = Msg.factory({
    before_show: () => {
      let text_value = ``

      for (let setting of App.settings) {
        text_value += `\n# ${setting.comment}\n`
        text_value += `${setting.name} = ${setting.value}\n`
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
    alert(`Invalid TOML format. Please check your syntax.`)
    return
  }

  for (let setting of App.settings) {
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
  }

  for (let setting of App.settings) {
    let setting_value = parsed_toml[setting.name]
    setting.value = setting_value
    App[setting.name] = setting_value
    App.storage[setting.name] = setting_value
  }

  App.save_storage()
  App.msg_settings.close()
}