const App = {}
App.i = {}

App.i.path = require(`path`)
App.i.fs = require(`fs`)
App.i.markov = require(`markov-strings`).default
App.dirname = __dirname
App.express = require(`express`)
App.app = App.express()
const http = require(`http`)
const WebSocket = require(`ws`)
App.server = http.createServer(App.app)
App.wss = new WebSocket.Server({server: App.server})
App.shared = require(`./js/main/shared.js`)
App.actions = require(`./actions.js`)
require(`./modules/spam.js`)(App)
require(`./modules/data.js`)(App)
require(`./modules/zones.js`)(App)
require(`./modules/sockets.js`)(App)
require(`./modules/input.js`)(App)
require(`./modules/anomalies.js`)(App)
require(`./modules/markov.js`)(App)
require(`./modules/bundler.js`)(App)

App.zone_states = {}
App.next_client_id = 1
App.words = new Set()
App.sekrits = {}
App.block_seconds = 60
App.spam_limit = 10
App.blocked_ips = {}
App.transmission_limit = 60
App.soft_block_seconds = 10
App.zone_data_changed = false
App.save_data_interval = 2 * 1000
App.max_words = 10
App.enable_zone_words = true
App.user_sekrits = {}
App.max_connections_per_ip = 3
App.max_info_per_minute = 20
App.max_echo_length = 1024

App.messages = [
  {
    words: [`HELP`, `SOS`],
    text: `https://www.youtube.com/watch?v=spdfnqS3bDg`,
    pissed: true,
  },
  {
    words: [`TEST`],
    text: `https://www.newgrounds.com/portal/view/803018`,
    pissed: true,
  },
]

App.word_match = (word) => {
  return App.words.has(word.toLowerCase())
}

App.get_last_username = (zone) => {
  let z_state = App.zone_states[zone]
  return z_state.last_active_ws ? z_state.last_active_ws.username : ``
}

App.setup_server = () => {
  App.app.use((req, res, next) => {
    let cookies = req.headers.cookie || ``

    if (!cookies.includes(`date_join=`)) {
      res.cookie(`date_join`, Date.now().toString(), {maxAge: 10 * 365 * 24 * 60 * 60 * 1000})
    }

    next()
  })

  App.app.use(App.express.static(__dirname))

  App.app.get(`/`, (req, res) => {
    res.sendFile(App.i.path.join(__dirname, `./index.html`))
  })
}

App.start_server = () => {
  let port = process.env.PORT || 3773

  App.server.listen(port, () => {
    console.log(`Mall Code server running on http://localhost:${port}`)
  })

  setInterval(() => {
    let now = Date.now()

    for (let ip in App.blocked_ips) {
      if (now > App.blocked_ips[ip]) {
        delete App.blocked_ips[ip]
      }
    }

    App.check_expired_sekrits()

    App.wss.clients.forEach((ws) => {
      if (!ws.is_alive) {
        return ws.terminate()
      }

      ws.is_alive = false
      ws.ping()
    })
  }, 30 * 1000)

  setInterval(() => {
    if (App.zone_data_changed) {
      App.save_zone_data()
      App.zone_data_changed = false
    }
  }, App.save_data_interval)

  App.i.fs.watch(__dirname, (event, filename) => {
    if (filename === `sekrits.json`) {
      App.get_sekrits()
    }
  })

  App.i.fs.watch(App.i.path.join(__dirname, `..`), (event, filename) => {
    if (filename === `package.json`) {
      App.get_version()
    }
  })
}

App.get_version()
App.get_words()
App.get_sekrits()
App.get_zone_data()
App.setup_sockets()
App.setup_server()
App.start_anti_spam()
App.setup_markov()
App.setup_bundler()
App.start_server()