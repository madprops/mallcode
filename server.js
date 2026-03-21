const express = require(`express`)
const http = require(`http`)
const WebSocket = require(`ws`)
const path = require(`path`)
const fs = require(`fs`)
const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server})
const Shared = require(`./shared.js`)

let zone_locks = {}
let next_client_id = 1
let nouns = new Set()

try {
  let nouns_data = fs.readFileSync(path.join(__dirname, `nouns.txt`), `utf8`)

  nouns_data.split(`\n`).forEach(line => {
    const word = line.trim()
    if (word) nouns.add(word)
  })
}
catch (err) {
  console.error(`Error loading nouns.txt:`, err)
}

let zone_data = {}
let data_file = path.join(__dirname, `data.json`)

try {
  if (fs.existsSync(data_file)) {
    zone_data = JSON.parse(fs.readFileSync(data_file, `utf8`))
  }
}
catch (err) {
  console.error(`Error loading data.json:`, err)
}

function save_zone_data() {
  fs.writeFileSync(data_file, JSON.stringify(zone_data, null, 2), `utf8`)
}

// Serve static files (like script.js and style.css) from the current directory
app.use(express.static(__dirname))

// Serve the HTML file directly
app.get(`/`, (req, res) => {
  res.sendFile(path.join(__dirname, `index.html`))
})

function broadcast_zone_count(zone) {
  let count = 0

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.zone === zone) {
      count++
    }
  })

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.zone === zone) {
      client.send(JSON.stringify({type: `USERS`, count}))
    }
  })
}

function broadcast_zone_words(zone, client = null) {
  let words = zone_data[zone] ? zone_data[zone].words : []
  let msg = JSON.stringify({type: `WORDS`, words})

  if (client) {
    client.send(msg)
  }
  else {
    wss.clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN && c.zone === zone) {
        c.send(msg)
      }
    })
  }
}

wss.on(`connection`, (ws) => {
  ws.id = next_client_id++
  ws.zone = Shared.default_zone
  let is_pressed = false
  let press_start_time = 0
  let current_sequence = ``
  let current_word = ``
  let current_settings = Shared.zone_settings[1]
  let unit_duration = current_settings.unit_duration
  let letter_timeout = null
  let word_timeout = null

  function resolve_letter() {
    if (!current_sequence) {
      return
    }

    let letter = Shared.morse_code[current_sequence]

    if (letter) {
      current_word += letter
    }

    current_sequence = ``
    word_timeout = setTimeout(resolve_word, unit_duration * current_settings.word_mult)
  }

  function resolve_word() {
    if (!current_word) {
      return
    }

    if (current_word === `HELP`) {
      ws.send(JSON.stringify({
        type: `MODAL`,
        text: `Zones can be any letter A-Z followed by a number from 1-9.\n\nThe higher the number the higher the speed.\n\nFor example: E4, G1, X9.\n\n`
      }))
    }
    else if (current_word.length === 2) {
      let cmd = current_word[0]
      let arg = parseInt(current_word[1])

      if (cmd >= `A` && cmd <= `Z` && !isNaN(arg) && arg >= 1 && arg <= 9) {
        let old_zone = ws.zone
        ws.zone = cmd + arg
        current_settings = Shared.zone_settings[arg]
        unit_duration = current_settings.unit_duration
        ws.send(JSON.stringify({type: `ZONE`, zone: ws.zone}))

        if (old_zone !== ws.zone) {
          broadcast_zone_count(old_zone)
          broadcast_zone_count(ws.zone)
          broadcast_zone_words(ws.zone, ws)
        }
      }
    }

    if ((current_word.length >= 3) && nouns.has(current_word.toLowerCase())) {
      if (!zone_data[ws.zone]) {
        zone_data[ws.zone] = {words: []}
      }

      zone_data[ws.zone].words = zone_data[ws.zone].words.filter(w => w !== current_word)
      zone_data[ws.zone].words.unshift(current_word)

      if (zone_data[ws.zone].words.length > 10) {
        zone_data[ws.zone].words.pop()
      }

      save_zone_data()
      broadcast_zone_words(ws.zone)
    }

    current_word = ``
  }

  // When a user transmits a morse code signal
  ws.on(`message`, (message) => {
    let data

    try {
      data = JSON.parse(message.toString())
    }
    catch (err) {
      return
    }

    let signal = data.type

    if ((signal === `DOWN`) || (signal === `UP`)) {
      let lock = zone_locks[ws.zone]
      let now = Date.now()

      if (lock && (lock.owner !== ws.id) && (lock.expires > now)) {
        return
      }

      zone_locks[ws.zone] = {owner: ws.id, expires: now + Shared.lock_time}
    }

    // Decode morse per connection for server-side validation
    if (signal === `DOWN`) {
      is_pressed = true
      press_start_time = Date.now()
      clearTimeout(letter_timeout)
      clearTimeout(word_timeout)
    }
    else if (signal === `UP`) {
      if (is_pressed) {
        let now = Date.now()
        is_pressed = false
        let duration = now - press_start_time

        if (duration < (unit_duration * 1.5)) {
          current_sequence += `.`
          let estimated_unit = duration
          unit_duration = (unit_duration * 0.7) + (estimated_unit * 0.3)
        }
        else {
          current_sequence += `-`
          let estimated_unit = duration / 3
          unit_duration = (unit_duration * 0.7) + (estimated_unit * 0.3)
        }

        let min_u = current_settings.forgiving ? 150 : current_settings.unit_duration * 0.8
        let max_u = current_settings.forgiving ? 500 : current_settings.unit_duration * 1.2
        unit_duration = Math.max(min_u, Math.min(max_u, unit_duration))
        letter_timeout = setTimeout(resolve_letter, unit_duration * current_settings.letter_mult)
      }
    }

    // Broadcast the signal to all OTHER connected clients (no identifiers)
    wss.clients.forEach((client) => {
      if ((client !== ws) && (client.readyState === WebSocket.OPEN) && (client.zone === ws.zone)) {
        client.send(JSON.stringify({type: signal}))
      }
    })
  })

  ws.on(`close`, () => {
    broadcast_zone_count(ws.zone)
  })

  broadcast_zone_count(ws.zone)
  broadcast_zone_words(ws.zone, ws)
})

let port = process.env.PORT || 3773

server.listen(port, () => {
  console.log(`Morse multiplayer server running on http://localhost:${port}`)
})