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

// Dynamic route to serve dummy files for any zone/asset combination
app.get(`/assets/zone/:z/file/:u`, (req, res) => {
  res.send(`<html><body style="font-family: sans-serif; text-align: center; margin-top: 20%;">
    <h1>Zone ${req.params.z}</h1>
    <h2>Asset u${req.params.u}</h2>
  </body></html>`)
})

app.get(`/help`, (req, res) => {
  res.send(`<html><body style="font-family: sans-serif; margin-top: 10%; display: flex; flex-direction: column; align-items: center;">
    <h1>Information</h1>

    <div style="max-width: 600px; text-align: left; line-height: 1.6;">
      <h2>Zone Navigation</h2>
      <p>You can move between different zones. The available zones are <strong>G</strong>, <strong>M</strong>, <strong>X</strong>, <strong>E</strong>, and <strong>A</strong>.</p>
      <p>To navigate to a zone, input the letter followed by a speed number from 1 to 9 (e.g., <strong>E4</strong>, <strong>G1</strong>, <strong>X9</strong>).</p>
      <h2>Opening Files</h2>
      <p>Within any zone, you can open asset files by inputting <strong>U</strong> followed by a file number from 1 to 9 (e.g., <strong>U1</strong>, <strong>U5</strong>).</p>
    </div>

  </body></html>`)
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
      client.send(`USERS:${count}`)
    }
  })
}

function broadcast_zone_words(zone, client = null) {
  let words = zone_data[zone] ? zone_data[zone].words : []
  let msg = `WORDS:${JSON.stringify(words)}`

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
      ws.send(`LINK:/help`)
    }
    else if (current_word.length === 2) {
      let cmd = current_word[0]
      let arg = parseInt(current_word[1])
      let allowed_zones = [`G`, `M`, `X`, `E`, `A`]

      if (allowed_zones.includes(cmd) && !isNaN(arg) && arg >= 1 && arg <= 9) {
        let old_zone = ws.zone
        ws.zone = cmd + arg
        current_settings = Shared.zone_settings[arg]
        unit_duration = current_settings.unit_duration
        ws.send(`ZONE:${ws.zone}`)

        if (old_zone !== ws.zone) {
          broadcast_zone_count(old_zone)
          broadcast_zone_count(ws.zone)
          broadcast_zone_words(ws.zone, ws)
        }
      }
      else if (cmd === `U` && !isNaN(arg) && arg >= 1 && arg <= 9) {
        ws.send(`LINK:/assets/zone/${ws.zone}/file/${arg}`)
      }
    }

    if ((current_word.length >= 3) && nouns.has(current_word.toLowerCase())) {
      if (!zone_data[ws.zone]) {
        zone_data[ws.zone] = {words: []}
      }

      zone_data[ws.zone].words.push(current_word)

      if (zone_data[ws.zone].words.length > 10) {
        zone_data[ws.zone].words.shift()
      }

      save_zone_data()
      broadcast_zone_words(ws.zone)
    }

    current_word = ``
  }

  // When a user transmits a morse code signal
  ws.on(`message`, (message) => {
    let signal = message.toString()

    if (signal === `DOWN` || signal === `UP`) {
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
        client.send(signal)
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