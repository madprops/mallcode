module.exports = (App) => {
  App.anomaly_hours = 2
  App.anomaly_speed = 9
  App.anomaly_chance = 100
  App.max_anomalies = 6

  App.get_anomaly_chance = () => {
    let base_chance = App.anomaly_chance / 100
    let current_anomalies = Object.values(App.sekrits).filter(s => s.expires).length

    if (current_anomalies >= App.max_anomalies) {
      return 0
    }

    let active_users = App.wss.clients.size
    let user_multiplier = active_users / 3

    if (user_multiplier > 1) {
      return base_chance / user_multiplier
    }

    return base_chance
  }

  App.check_anomaly = (word) => {
    if (Math.random() < App.get_anomaly_chance()) {
      App.create_anomaly(word)
    }
  }

  App.create_anomaly = (word) => {
    let zone_name = App.shared.random_word(3, word)
    zone_name = zone_name.toUpperCase()

    App.sekrits[zone_name] = {
      word: zone_name,
      zone: zone_name,
      speed: App.anomaly_speed,
      expires: Date.now() + App.anomaly_hours * 60 * 60 * 1000,
    }

    App.announce_anomaly(zone_name)
  }

  App.announce_anomaly = (zone) => {
    let msg = JSON.stringify({type: `ANOMALY`, zone})

    App.wss.clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) {
        c.send(msg)
      }
    })
  }
}