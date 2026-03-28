function do_post(ws, zone, value) {
  Actions.execute_command(`./post.js "${ws.username}" "${zone}" "${value}"`)
}

let post_lock = 60

Actions.register_word(`any`, `hi`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})

Actions.register_word(`any`, `hello`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})

Actions.register_word(`any`, `help`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})

Actions.register_word(`any`, `sos`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})

Actions.register_word(`any`, `omg`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})

Actions.register_word(`any`, `wtf`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})

Actions.register_word(`any`, `lmao`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})

Actions.register_word(`any`, `rofl`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})

Actions.register_word(`any`, `ping`, (ws, zone, value) => {
  do_post(ws, zone, value)
}, {lock: post_lock})