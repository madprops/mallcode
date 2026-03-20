const express = require(`express`)
const http = require(`http`)
const WebSocket = require(`ws`)
const path = require(`path`)
const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server})

const MORSE_CODE = {
  [`.-`]: `A`, [`-...`]: `B`, [`-.-.`]: `C`, [`-..`]: `D`, [`.`]: `E`,
  [`..-.`]: `F`, [`--.`]: `G`, [`....`]: `H`, [`..`]: `I`, [`.---`]: `J`,
  [`-.-`]: `K`, [`.-..`]: `L`, [`--`]: `M`, [`-.`]: `N`, [`---`]: `O`,
  [`.--.`]: `P`, [`--.-`]: `Q`, [`.-.`]: `R`, [`...`]: `S`, [`-`]: `T`,
  [`..-`]: `U`, [`...-`]: `V`, [`.--`]: `W`, [`-..-`]: `X`, [`-.--`]: `Y`,
  [`--..`]: `Z`, [`.----`]: `1`, [`..---`]: `2`, [`...--`]: `3`,
  [`....-`]: `4`, [`.....`]: `5`, [`-....`]: `6`, [`--...`]: `7`,
  [`---..`]: `8`, [`----.`]: `9`, [`-----`]: `0`
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

wss.on(`connection`, (ws) => {
  let is_pressed = false
  let press_start_time = 0
  let current_sequence = ``
  let current_word = ``
  let unit_duration = 250
  let letter_timeout = null
  let word_timeout = null
  ws.zone = 1 // default zone

  function resolve_letter() {
    if (!current_sequence) return
    let letter = MORSE_CODE[current_sequence]

    if (letter) {
      current_word += letter
    }

    current_sequence = ``
    word_timeout = setTimeout(resolve_word, unit_duration * 8)
  }

  function resolve_word() {
    if (!current_word) return

    if (current_word.length === 2) {
      let cmd = current_word[0]
      let arg = parseInt(current_word[1])

      if (cmd === `G` && !isNaN(arg) && arg >= 1 && arg <= 9) {
        ws.zone = arg
        ws.send(`ZONE:${arg}`)
      } else if (cmd === `U` && !isNaN(arg) && arg >= 1 && arg <= 9) {
        ws.send(`LINK:/assets/zone/${ws.zone}/file/${arg}`)
      }
    }

    current_word = ``
  }

  // When a user transmits a morse code signal
  ws.on(`message`, (message) => {
    const signal = message.toString()

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

        unit_duration = Math.max(150, Math.min(500, unit_duration))
        letter_timeout = setTimeout(resolve_letter, unit_duration * 4)
      }
    }

    // Broadcast the signal to all OTHER connected clients (no identifiers)
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(signal)
      }
    })
  })
})

const PORT = process.env.PORT || 3773

server.listen(PORT, () => {
  console.log(`Morse multiplayer server running on http://localhost:${PORT}`)
})