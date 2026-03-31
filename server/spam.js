module.exports = (App) => {
  // The bigger the number the more the anti-spam system tolerates
  App.anti_spam_max_limit = 100

  // How much time in minutes a user is banned from the system after being detected
  // as a spammer by the automatic spam detection system
  App.anti_spam_ban_duration = 60

  // Checks connections every x ms to unban and reduce levels
  App.anti_spam_check_delay = 1200

  App.start_anti_spam = () => {
    App.anti_spam_users = {}
    App.anti_spam_timeout()
  }

  // Starts a timeout to check spam on sockets
  App.anti_spam_timeout = () => {
    setTimeout(() => {
      App.anti_spam_timeout_action()
    }, App.anti_spam_check_delay)
  }

  // What to do on each anti spam iteration
  App.anti_spam_timeout_action = () => {
    for (let key in App.anti_spam_users) {
      let user = App.anti_spam_users[key]

      if (user.banned) {
        if (Date.now() > user.banned_until) {
          user.banned = false
          user.banned_until = 0
          user.level = 0
        }
      }
      else if (user.level > 0) {
        user.level -= 1
      }
    }

    App.anti_spam_timeout()
  }

  // Add spam points and check if user is banned
  App.add_spam = (ws, amount = 1) => {
    if (!App.anti_spam_users[ws.ip]) {
      App.anti_spam_users[ws.ip] = {
        level: 0,
        banned: false,
        banned_until: 0,
      }
    }

    let user = App.anti_spam_users[ws.ip]

    if (user.banned) {
      App.anti_spam_kick(ws)
      return `already_banned`
    }

    user.level += amount

    if (user.level >= App.anti_spam_max_limit) {
      App.anti_spam_ban(ws)
      return `already_banned`
    }

    return `ok`
  }

  // Kick a user
  App.anti_spam_kick = (ws) => {
    App.force_release(ws, ws.zone)
    App.block_message(ws, App.anti_spam_ban_duration * 60)
    ws.close(1008, `Spam detected`)
  }

  // Ban a user from connecting
  App.anti_spam_ban = (ws, minutes = App.anti_spam_ban_duration) => {
    let user = App.anti_spam_users[ws.ip]

    if (!user) {
      return
    }

    user.banned = true
    user.banned_until = Date.now() + (minutes * 1000 * 60)
    App.blocked_ips[ws.ip] = user.banned_until
    console.log(`IP banned for spam: ${ws.ip}`)
    App.anti_spam_kick(ws)
  }

  // Get anti spam level
  App.get_spam_level = (ws) => {
    let user = App.anti_spam_users[ws.ip]

    if (user) {
      return user.level
    }

    return 0
  }
}