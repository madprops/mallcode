const {exec} = require(`child_process`)
const fs = require(`fs`)
const path = require(`path`)
Shared = require(`./js/shared.js`)
const Actions = {word_map: {}, code_map: {}, locks: new Map()}
Actions.lock_delay = 10

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

Actions.run = (obj, ws, zone, value) => {
  let lock_key = `${ws.username}_${zone}_${value}`
  let now = Date.now()

  if (Actions.locks.has(lock_key)) {
    let last_time = Actions.locks.get(lock_key)

    if ((now - last_time) < (obj.lock * 1000)) {
      return
    }
  }

  Actions.locks.set(lock_key, now)
  obj.action(ws, zone, value)
}

Actions.check_word = (ws, zone, word) => {
  let obj = Actions.get_word(zone, word)

  if (!obj) {
    return
  }

  Actions.run(obj, ws, zone, word)
}

Actions.check_code = (ws, zone, code) => {
  let action = Actions.get_code(zone, code)

  if (!action) {
    return
  }

  Actions.run(obj, ws, zone, code)
}

Actions.get = (items, zone, word) => {
  zone = zone.toUpperCase()
  word = word.toUpperCase()

  let base = items[zone]

  if (base && base[word]) {
    return base[word]
  }

  base = items.ANY

  if (!base) {
    return
  }

  if (base && base[word]) {
    return base[word]
  }
}

Actions.get_word = (zone, word) => {
  return Actions.get(Actions.word_map, zone, word)
}

Actions.get_code = (zone, word) => {
  return Actions.get(Actions.code_map, zone, word)
}

Actions.register = (items, zone, word, action, args = {}) => {
  let def_args = {
    lock: Actions.lock_delay,
  }

  Shared.def_args(def_args, args)
  zone = zone.toUpperCase()
  word = word.toUpperCase()

  if (!items[zone]) {
    items[zone] = {}
  }

  let obj = {
    action,
    lock: args.lock,
  }

  items[zone][word] = obj
}

Actions.register_word = (zone, word, action) => {
  Actions.register(Actions.word_map, zone, word, action)
}

Actions.register_code = (zone, word, action) => {
  Actions.register(Actions.code_map, zone, word, action)
}

Actions.register_all = () => {
  /* Register functions in action_funcs.js
  Optional arguments object include "lock"
  lock means how many seconds to block exact command
  To avoid spam. Default is 60 seconds

  Actions.register_word(`j4`, `hi`, (ws, zone, value) => {
    Actions.execute_command(`notify-send hello`)
  })

  Actions.register_code(`k3`, `..-..`, (ws, zone, value) => {
    Actions.execute_command(`unlock computer`)
  })

  Actions.register_word(`any`, `rec`, (ws, zone, value) => {
    Actions.execute_command(`capture video`)
  }, {lock: 60}) */

  let file_path = path.join(__dirname, `action_funcs.js`)

  if (fs.existsSync(file_path)) {
    try {
      let code = fs.readFileSync(file_path, `utf-8`)
      eval(code)
    }
    catch (error) {
      console.error(`Error evaluating action_funcs.js:`, error)
    }
  }
}

Actions.register_all()
module.exports = Actions