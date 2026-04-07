module.exports = (App) => {
  App.get_version = () => {
    try {
      App.package = JSON.parse(App.i.fs.readFileSync(App.i.path.join(App.dirname, `../package.json`), `utf8`))
      App.version = App.package.version || `0.0.0`
    }
    catch (err) {
      App.version = `0.0.0`
    }
  }

  App.get_words = () => {
    try {
      let data = App.i.fs.readFileSync(App.i.path.join(App.dirname, `words.txt`), `utf8`)

      data.split(`\n`).forEach(line => {
        let word = line.trim()

        if (word) {
          App.words.add(word)
        }
      })

      console.log(`Loaded ${App.words.size} words.`)
    }
    catch (err) {
      console.error(`Error loading words.txt:`, err)
    }
  }

  App.get_sekrits = () => {
    try {
      let file = App.i.path.join(App.dirname, `sekrits.json`)
      let anomalies = {}

      for (let z in App.sekrits) {
        if (App.sekrits[z].expires) {
          anomalies[z] = App.sekrits[z]
        }
      }

      App.sekrits = {}

      if (!App.i.fs.existsSync(file)) {
        throw new Error(`sekrits.json is missing!`)
      }

      let data = JSON.parse(App.i.fs.readFileSync(file, `utf8`))

      data.forEach(s => {
        if (s.word && s.zone) {
          App.sekrits[s.zone.toUpperCase()] = {
            word: s.word.toUpperCase(),
            zone: s.zone.toUpperCase(),
            speed: s.speed,
          }
        }
      })

      for (let z in anomalies) {
        App.sekrits[z] = anomalies[z]
      }

      for (let user in App.user_sekrits) {
        for (let user_zone of App.user_sekrits[user]) {
          if (!App.sekrits[user_zone]) {
            App.user_sekrits[user].delete(user_zone)
            App.zone_data_changed = true
          }
        }
      }

      for (let zone in App.zone_data) {
        if (!App.is_public_zone(zone) && !App.sekrits[zone]) {
          delete App.zone_data[zone]
          App.zone_data_changed = true
        }
      }

      for (let zone in App.zone_states) {
        if (!App.is_public_zone(zone) && !App.sekrits[zone]) {
          delete App.zone_states[zone]
        }
        else {
          App.zone_states[zone].settings = App.get_speed(zone)
        }
      }

      App.wss.clients.forEach(c => {
        if ((c.readyState === WebSocket.OPEN) && !App.is_public_zone(c.zone) && !App.sekrits[c.zone]) {
          App.go_to_zone(c, App.default_zone())
        }
      })
    }
    catch (err) {
      console.error(`Error loading sekrits.`, err)
    }
  }

  App.get_zone_data = () => {
    App.zone_data = {}
    App.data_file = App.i.path.join(App.dirname, `data.json`)

    try {
      if (App.i.fs.existsSync(App.data_file)) {
        let parsed = JSON.parse(App.i.fs.readFileSync(App.data_file, `utf8`))

        if (parsed.zones) {
          App.zone_data = parsed.zones

          for (let user in parsed.sekrits) {
            App.user_sekrits[user] = new Set(parsed.sekrits[user])
          }
        }
        else {
          App.zone_data = parsed
        }
      }
    }
    catch (err) {
      console.error(`Error loading data.json:`, err)
    }
  }

  App.save_zone_data = () => {
    let sekrits_to_save = {}

    for (let user in App.user_sekrits) {
      sekrits_to_save[user] = Array.from(App.user_sekrits[user])
    }

    let data_to_save = {
      zones: App.zone_data,
      sekrits: sekrits_to_save,
    }

    App.i.fs.writeFileSync(App.data_file, JSON.stringify(data_to_save, null, 2), `utf8`)
  }
}