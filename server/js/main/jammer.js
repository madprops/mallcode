App.jammer = null

App.on_jammer = (data) => {
  App.jammer = data.jammer || null

  if (App.jammer) {
    App.show_update(`Jammer ${App.jammer.name} has appeared! HP: ${App.jammer.health}`)
  } else {
    // Jammer defeated or disappeared
  }
}