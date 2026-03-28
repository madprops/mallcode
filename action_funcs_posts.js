function do_post(ws, zone, value) {
  Actions.execute_command(`./post.js "${ws.username}" "${zone}" "${value}"`)
}

let post_args = {
  lock: 60,
  exclamation: true,
}

let post_words = [
  `hi`,
  `hello`,
  `help`,
  `sos`,
  `omg`,
  `wtf`,
  `lol`,
  `lmao`,
  `rofl`,
  `kek`,
  `ping`,
  `test`,
  `:d`,
  `:3`,
  `xd`,
  `bye`,
  `thanks`,
  `thx`,
  `please`,
  `meow`,
  `woof`,
  `yolo`,
  `xoxo`,
  `welcome`,
  `bruh`,
  `cya`,
  `sup`,
  `rip`,
  `gg`,
  `gm`,
  `oof`,
  `based`,
  `zzz`,
  `o7`,
]

for (let word of post_words) {
  Actions.register_word(`any`, word, (ws, zone, value) => {
    do_post(ws, zone, value)
  }, post_args)
}
