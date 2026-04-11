module.exports = (App) => {
  App.jammer_chance = 20

  App.jammer_words = [
    `boom`,
    `pulse`,
    `shock`,
    `flare`,
    `crash`,
  ]

  App.check_jammer = (zone) => {
    if (!App.zone_data[zone] || App.zone_data[zone].jammer) {
      return
    }

    let chance = App.shared.random_int({min: 1, max: 100})

    if (chance <= App.jammer_chance) {
      let name = App.shared.random_word(3, null, true)
      App.zone_data[zone].jammer = {name, health: 100}
      App.zone_data_changed = true

      let msg = JSON.stringify({type: `JAMMER`, jammer: App.zone_data[zone].jammer})

      App.wss.clients.forEach((c) => {
        if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
          c.send(msg)
        }
      })
    }
  }

  App.attack_jammer = (zone, word, ws) => {
    let lower_word = word.toLowerCase()

    if (!App.jammer_words.includes(lower_word)) {
      return false
    }

    let jammer = App.zone_data[zone] && App.zone_data[zone].jammer

    if (jammer) {
      let damage = App.shared.random_int({min: 1, max: 100}) * 10
      jammer.health -= damage
      App.zone_data_changed = true
      let username = ws ? ws.username : `Someone`

      if (jammer.health <= 0) {
        jammer.health = 0
        let name = jammer.name

        let msg = JSON.stringify({type: `JAMMER`, jammer, event: `defeated`, name, username, damage})

        App.wss.clients.forEach((c) => {
          if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
            c.send(msg)
          }
        })

        App.zone_data[zone].jammer = null
      }
      else {
        let msg = JSON.stringify({type: `JAMMER`, jammer, event: `attacked`, username, damage})

        App.wss.clients.forEach((c) => {
          if ((c.readyState === WebSocket.OPEN) && (c.zone === zone)) {
            c.send(msg)
          }
        })
      }
    }

    return true
  }
}