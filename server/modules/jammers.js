module.exports = (App) => {
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
}