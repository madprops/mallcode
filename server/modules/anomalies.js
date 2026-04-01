module.exports = (App) => {
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
      if (!App.sekrits[word] && !App.shared.is_public_zone(word)) {
        let zone_name = App.shared.random_word(3, word)
        zone_name = zone_name.toUpperCase()

        App.sekrits[zone_name] = {
          word: zone_name,
          zone: zone_name,
          speed: App.anomaly_speed,
          expires: Date.now() + App.anomaly_hours * 60 * 60 * 1000,
        }
      }
    }
  }
}