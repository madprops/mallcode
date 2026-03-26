const {exec} = require(`child_process`)
const Actions = {items: {}}

Actions.execute_command = (command) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command '${command}':`, error.message)
      return
    }

    if (stderr) {
      console.error(`Command '${command}' stderr:`, stderr)
      return
    }

    console.log(`Command '${command}' executed successfully. Output:\n${stdout}`)
  })
}

Actions.check = (ws, zone, word) => {
  let action = Actions.get(zone, word)

  if (!action) {
    return
  }

  if (typeof action === `function`) {
    action(ws, zone, word)
  }
}

Actions.get = (zone, word) => {
  let base = Actions.items[zone.toUpperCase()]

  if (!base) {
    return
  }

  return base[word.toUpperCase()]
}

Actions.register = (zone, word, action) => {
  zone = zone.toUpperCase()
  word = word.toUpperCase()

  if (!Actions.items[zone]) {
    Actions.items[zone] = {}
  }

  Actions.items[zone][word] = action
}

Actions.register_all = () => {
  Actions.register(`j4`, `hi`, () => {
    Actions.execute_command(`notify-send hello`)
  })
}

Actions.register_all()
module.exports = Actions