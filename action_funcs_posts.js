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
  `pls`,
  `plz`
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
  `69`,
  `1337`,
  `420`,
  `666`,
  `hot`,
  `cool`,
  `awesome`,
  `amazing`,
  `grats`,
  `congrats`,
  `asl?`,
  `nice`,
  `dope`,
  `greetings`,
  `100%`,
  `ayy`,
  `ayyy`,
  `classic`,
  `whoa`,
  `incredible`,
  `epic`,
  `magic`,
  `shh`,
  `shhh`,
  `blaze`,
  `blazed`,
  `haha`,
  `hehe`,
  `huh`,
  `okay`,
]

for (let word of post_words) {
  Actions.register_word(`any`, word, (ws, zone, value) => {
    do_post(ws, zone, value)
  }, post_args)
}
