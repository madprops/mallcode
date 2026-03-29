const {exec} = require(`child_process`)
const fs = require(`fs`)
const path = require(`path`)
const Shared = require(`./js/shared.js`)

const Actions = {
  word_map: {},
  code_map: {},
  global_word_map: [],
  global_code_map: [],
  locks: new Map(),
}

Actions.lock_delay = 10

Actions.post_args = {
  lock: 60,
  exclamation: true,
}

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
  Actions.run_global_words(ws, zone, word)
  let obj = Actions.get_word(zone, word)

  if (!obj) {
    return
  }

  Actions.run(obj, ws, zone, word)
}

Actions.check_code = (ws, zone, code) => {
  Actions.run_global_codes(ws, zone, code)
  let obj = Actions.get_code(zone, code)

  if (!obj) {
    return
  }

  Actions.run(obj, ws, zone, code)
}

Actions.run_global_words = (ws, zone, word) => {
  for (let obj of Actions.global_word_map) {
    Actions.run(obj, ws, zone, word)
  }
}

Actions.run_global_codes = (ws, zone, word) => {
  for (let obj of Actions.global_code_map) {
    Actions.run(obj, ws, zone, word)
  }
}

Actions.get_check = (base, word) => {
  if (!base || !word) {
    return
  }

  let obj = base[word]

  if (obj) {
    return obj
  }

  if (word.endsWith(`!`)) {
    word = word.replace(/!+$/, ``)
    obj = base[word]

    if (obj && obj.exclamation) {
      return obj
    }
  }
}

Actions.get = (items, zone, word) => {
  zone = zone.toUpperCase()
  word = word.toUpperCase()

  let base = items[zone]
  let obj = Actions.get_check(base, word)

  if (obj) {
    return obj
  }

  base = items.ANY
  obj = Actions.get_check(base, word)

  if (obj) {
    return obj
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
    exclamation: false,
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
    exclamation: args.exclamation,
  }

  items[zone][word] = obj
}

Actions.register_word = (zone, word, action, args) => {
  Actions.register(Actions.word_map, zone, word, action, args)
}

Actions.register_code = (zone, word, action, args) => {
  Actions.register(Actions.code_map, zone, word, action, args)
}

Actions.register_global = (items, action, args) => {
  let def_args = {
    lock: Actions.lock_delay,
  }

  Shared.def_args(def_args, args)
  items.push({action, lock: args.lock})
}

Actions.register_global_word = (action, args) => {
  Actions.register_global(Actions.global_word_map, action, args)
}

Actions.register_global_code = (action, args) => {
  Actions.register_global(Actions.global_code_map, action, args)
}

Actions.register_all = () => {
  let file_path = path.join(__dirname, `action_funcs.js`)

  if (!fs.existsSync(file_path)) {
    return
  }

  try {
    let code = fs.readFileSync(file_path, `utf-8`)
    eval(code) // eslint-disable-line no-eval
  }
  catch (error) {
    console.error(`Error evaluating action_funcs.js:`, error)
  }
}

Actions.do_post = (ws, zone, value) => {
  Actions.execute_command(`notify-send "${value}"`)
}

Actions.setup_post = () => {
  let file_path = path.join(__dirname, `post_words.txt`)

  if (!fs.existsSync(file_path)) {
    return
  }

  let words = fs.readFileSync(file_path, `utf8`)
  Actions.post_words = words.split(`\n`).filter(word => word)

  for (let word of Actions.post_words) {
    Actions.register_word(`any`, word, (ws, zone, value) => {
      Actions.do_post(ws, zone, value)
    }, post_args)
  }
}

Actions.setup_post()
Actions.register_all()
module.exports = Actions