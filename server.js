const express = require(`express`)
const http = require(`http`)
const WebSocket = require(`ws`)
const path = require(`path`)
const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server})

// Serve static files (like script.js and style.css) from the current directory
app.use(express.static(__dirname))

// Serve the HTML file directly
app.get(`/`, (req, res) => {
  res.sendFile(path.join(__dirname, `index.html`))
})

wss.on(`connection`, (ws) => {
  // When a user transmits a morse code signal
  ws.on(`message`, (message) => {
    const signal = message.toString()

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