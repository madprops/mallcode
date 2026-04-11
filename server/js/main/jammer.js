App.jammer = null

App.on_jammer = (data) => {
  App.jammer = data.jammer || null

  if (App.jammer) {
    App.show_update(`🤖 ${App.jammer.name} controls this zone.`)
    App.show_update(`Attack with: boom, pulse, shock, flare, crash`)
  } else {
    // Jammer defeated or disappeared
  }
}