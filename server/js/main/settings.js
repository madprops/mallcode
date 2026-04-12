App.scripts = {
  latin: {
    title: `Standard International Morse Code for the Latin alphabet`,
  },
  greek: {
    title: `Morse code mapped to the Greek alphabet`,
  },
  cyrillic: {
    title: `Morse code mapped to the Cyrillic alphabet (used for Russian and others)`,
  },
  hebrew: {
    title: `Morse code mapped to the Hebrew alphabet`,
  },
  arabic: {
    title: `Morse code mapped to the Arabic alphabet`,
  },
  persian: {
    title: `Morse code mapped to the Persian alphabet`,
  },
  esperanto: {
    title: `International Morse Code with extensions for Esperanto letters with diacritics`,
  },
  devanagari: {
    title: `Morse code mapped to the Devanagari script (used for Hindi, Marathi, etc.)`,
  },
  korean: {
    title: `SKATS (Standard Korean Alphabet Transliteration System) for Hangul`,
  },
  wabun: {
    title: `Japanese Morse code used to transmit kana characters`,
  },
  thai: {
    title: `Morse code mapped to the Thai alphabet`,
  },
}

App.iambic_modes = {
  b: {
    title: `Alternates dots and dashes when both held. Adds an extra opposite element upon release`,
  },
  a: {
    title: `Alternates dots and dashes when both held. Stops immediately upon release`,
  },
  ultimatic: {
    title: `Holding both paddles repeats the element of the last pressed paddle`,
  },
  bug: {
    title: `Semi-automatic keyer. Automatic repeating dots, manual straight-key dashes`,
  },
  single: {
    title: `Emulates a single paddle. No squeeze alternating`,
  },
  manual: {
    title: `Dual-lever straight key. Elements require individual presses and do not auto-repeat`,
  },
}

App.get_settings = () => {
  return [
    {
      comment: `Volume level of the beeps`,
      name: `volume`,
      value: App.volume,
      type: `string`,
      options: [`max`, `mid`, `mute`],
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
    {
      comment: `Max beeps when unfocused`,
      name: `max_unfocused_beeps`,
      value: App.max_unfocused_beeps,
      type: `number`,
      min: 0,
      max: 9999,
    },
    {
      comment: `auto or color`,
      name: `background`,
      value: App.background,
      type: `string`,
    },
    {
      comment: `Enable or disable effects`,
      name: `animation`,
      value: App.animation,
      type: `boolean`,
    },
    {
      comment: `Dot dash sequence type`,
      name: `sequence`,
      value: App.sequence,
      type: `string`,
      options: [`base`, `above`, `below`],
    },
    {
      comment: `Character set to use for letters`,
      name: `script`,
      value: App.script,
      type: `string`,
    },
    {
      comment: `The mode of the iambic keyer`,
      name: `iambic_mode`,
      value: App.iambic_mode,
      type: `string`,
    },
  ]
}

App.get_options = (name) => {
  for (let setting of App.get_settings()) {
    if (setting.name === name) {
      return setting.options
    }
  }

  return []
}

App.setup_settings = () => {
  App.msg_settings = Msg.factory({
    before_show: () => {
      let text_value = ``
      let settings = App.get_settings()

      for (let setting of settings) {
        text_value += `\n# ${setting.comment}\n`

        if (setting.options) {
          text_value += `# ${setting.options.join(`, `)}\n`
        }

        if (setting.type === `string`) {
          text_value += `${setting.name} = "${setting.value}"\n`
        }
        else {
          text_value += `${setting.name} = ${setting.value}\n`
        }
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
  DOM.ev(`#script-settings-btn`, `click`, App.show_script_picker)
  DOM.ev(`#iambic-settings-btn`, `click`, App.show_iambic_picker)
  App.setup_scripts()
  App.setup_iambic()
}

App.setup_scripts = () => {
  App.msg_script = App.make_settings_msg(App.scripts, `Scripts`, (value) => {
    App.msg_script.close()
    App.check_save_settings({script: value})
  })
}

App.setup_iambic = () => {
  App.msg_iambic = App.make_settings_msg(App.iambic_modes, `Iambic`, (value) => {
    App.msg_iambic.close()
    App.check_save_settings({iambic_mode: value})
  })
}

App.make_settings_msg = (items, title, action) => {
  let msg = Msg.factory({
    window_x: `none`,
    center_titlebar: true,
    titlebar_class: `blue`,
    enable_titlebar: true,
  })

  let lc = DOM.create(`div`, `flex-column-center settings-picker`)

  for (let value of Object.keys(items)) {
    let item = DOM.create(`div`, `settings-picker-item`)
    item.textContent = value
    item.title = items[value].title

    DOM.ev(item, `click`, () => {
      action(value)
    })

    lc.append(item)
  }

  msg.set(lc)
  msg.set_title(title)
  return msg
}

App.show_settings = () => {
  App.msg_settings.show()
}

App.check_save_settings = (args = {}) => {
  let content = App.settings_editor.toString()
  let parsed_toml = {}

  try {
    parsed_toml = toml.parse(content)
  }
  catch (error) {
    console.error(error)
    alert(`Invalid TOML format. Please check your syntax.`)
    return
  }

  for (let key in args) {
    if (parsed_toml[key] !== undefined) {
      parsed_toml[key] = args[key]
    }
  }

  let settings = App.get_settings()

  for (let setting of settings) {
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
    else if (setting.options) {
      if (!setting.options.includes(setting_value)) {
        alert(`'${setting.name}' must be one of ${setting.options.join(`, `)}.`)
        return
      }
    }
  }

  for (let setting of settings) {
    let value = parsed_toml[setting.name]
    setting.value = value
    App[setting.name] = value
    App.storage[setting.name] = value
  }

  App.update_background()
  App.refresh_background()
  App.get_theme(App.zone, true)
  App.refresh_sound_icon()
  App.refresh_animation()
  App.save_storage()
  App.msg_settings.close()
}

App.show_script_picker = () => {
  App.msg_script.show()
}

App.show_iambic_picker = () => {
  App.msg_iambic.show()
}