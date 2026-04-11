App.jammer = null

App.on_jammer = (data) => {
  App.jammer = data.jammer || null

  if (data.event === `defeated`) {
    App.show_update(`⚔️ ${data.username} hits ${App.jammer.name} for ${data.damage} damage!`)
    App.show_update(`🎉 ${App.jammer.name} is destroyed!`)
  }
  else if (data.event === `attacked`) {
    App.show_update(`⚔️ ${data.username} hits ${App.jammer.name} for ${data.damage} damage!`)
  }
  else if (App.jammer) {
    App.show_update(`🤖 ${App.jammer.name} controls this zone.`)
    App.show_update(`Attack with: boom, pulse, shock, flare, crash`)
  }
  else {
    // Jammer defeated or disappeared
  }
}