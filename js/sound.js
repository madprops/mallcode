App.audio_context = window.AudioContext || window.webkitAudioContext
App.volume_level = 0.5

App.init_audio = () => {
  if (!App.audio_ctx) {
    App.audio_ctx = new App.audio_context()
  }

  if (App.audio_ctx.state === `suspended`) {
    App.audio_ctx.resume()
  }
}

App.play_warp_drive = () => {
  App.init_audio()

  let duration = 1.5
  let start_time = App.audio_ctx.currentTime
  let osc_main = App.audio_ctx.createOscillator()
  let osc_sub = App.audio_ctx.createOscillator()
  let main_gain = App.audio_ctx.createGain()
  let low_pass_filter = App.audio_ctx.createBiquadFilter()

  osc_main.type = `sine`
  // using a triangle wave instead of sawtooth removes the harsh, buzzy edge
  osc_sub.type = `triangle`
  low_pass_filter.type = `lowpass`

  // muffling the high frequencies makes the effect sound deeper and more distant
  low_pass_filter.frequency.setValueAtTime(400, start_time)
  low_pass_filter.frequency.exponentialRampToValueAtTime(50, start_time + duration)

  // a lower, smoother frequency sweep for the main tone
  osc_main.frequency.setValueAtTime(60, start_time)
  osc_main.frequency.exponentialRampToValueAtTime(600, start_time + 1.2)

  osc_sub.frequency.setValueAtTime(80, start_time)
  osc_sub.frequency.exponentialRampToValueAtTime(15, start_time + 1.3)

  // softening the volume envelope so it fades in and out gently
  main_gain.gain.setValueAtTime(0, start_time)
  main_gain.gain.linearRampToValueAtTime(0.15, start_time + 0.3)
  main_gain.gain.exponentialRampToValueAtTime(0.01, start_time + duration)

  osc_main.connect(main_gain)
  osc_sub.connect(main_gain)
  main_gain.connect(low_pass_filter)
  low_pass_filter.connect(App.audio_ctx.destination)

  osc_main.start(start_time)
  osc_sub.start(start_time)

  osc_main.stop(start_time + duration)
  osc_sub.stop(start_time + duration)
}

App.sound_enabled = () => {
  return App.volume_level > 0
}

App.setup_sound = () => {
  App.sound_btn.addEventListener(`click`, () => {
    if (App.volume_level === 0.5) {
      App.volume_level = 0.25
    }
    else if (App.volume_level === 0.25) {
      App.volume_level = 0
    }
    else {
      App.volume_level = 0.5
    }

    if (App.volume_level === 0.5) {
      App.sound_btn.textContent = `🔊`
    }
    else if (App.volume_level === 0.25) {
      App.sound_btn.textContent = `🔉`
    }
    else {
      App.sound_btn.textContent = `🔇`
    }

    if (!App.sound_enabled() && App.gain_node) {
      App.gain_node.gain.setTargetAtTime(0, App.audio_ctx.currentTime, 0.01)
    }

    App.sound_btn.blur()
  })
}

App.mute_beep = () => {
  App.gain_node.gain.setTargetAtTime(0, App.audio_ctx.currentTime, 0.01)
}

App.play_beep = () => {
  App.init_audio()

  if (App.volume_level === 0) {
    return
  }

  let hash = Shared.get_string_hash(App.zone)
  let rng = Shared.create_seeded_random(hash)
  let duration = 0.1 + rng() * 0.3
  let start_time = App.audio_ctx.currentTime
  let osc = App.audio_ctx.createOscillator()
  App.gain_node = App.audio_ctx.createGain()
  let types = [`sine`, `square`, `sawtooth`, `triangle`]
  let type_index = Math.floor(rng() * 4)
  osc.type = types[type_index]
  let start_freq = 300 + rng() * 700
  let end_freq = start_freq + rng() * 400 - 150
  osc.frequency.setValueAtTime(start_freq, start_time)
  osc.frequency.exponentialRampToValueAtTime(end_freq, start_time + duration)
  App.gain_node.gain.setValueAtTime(0, start_time)
  App.gain_node.gain.linearRampToValueAtTime(App.volume_level, start_time + 0.02)
  App.gain_node.gain.exponentialRampToValueAtTime(0.01, start_time + duration)
  osc.connect(App.gain_node)
  App.gain_node.connect(App.audio_ctx.destination)
  osc.start(start_time)
  osc.stop(start_time + duration)
}