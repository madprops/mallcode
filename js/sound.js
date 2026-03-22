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

App.play_beep = (seed = `normal`) => {
  App.init_audio()

  if (App.volume_level === 0) {
    return
  }

  let hash = Shared.get_string_hash(seed)
  let rng = Shared.create_seeded_random(hash)
  let start_time = App.audio_ctx.currentTime
  let osc = App.audio_ctx.createOscillator()
  App.gain_node = App.audio_ctx.createGain()
  let filter = App.audio_ctx.createBiquadFilter()
  filter.type = `lowpass`
  let instrument_type = Math.floor(rng() * 4)
  let duration
  let attack
  let start_freq = 200 + rng() * 600

  if (instrument_type === 0) {
    osc.type = `sine`
    duration = 0.2 + rng() * 0.15
    attack = 0.01
    filter.frequency.value = start_freq * 2
    osc.frequency.setValueAtTime(start_freq, start_time)
  }
  else if (instrument_type === 1) {
    osc.type = `triangle`
    duration = 0.1 + rng() * 0.1
    attack = 0.005
    filter.frequency.value = start_freq * 1.5
    osc.frequency.setValueAtTime(start_freq, start_time)
  }
  else if (instrument_type === 2) {
    osc.type = `sine`
    duration = 0.25 + rng() * 0.1
    attack = 0.03
    filter.frequency.value = start_freq
    osc.frequency.setValueAtTime(start_freq, start_time)
    osc.frequency.linearRampToValueAtTime(start_freq * 1.02, start_time + duration / 2)
    osc.frequency.linearRampToValueAtTime(start_freq, start_time + duration)
  }
  else {
    osc.type = `triangle`
    duration = 0.15 + rng() * 0.1
    attack = 0.01
    filter.frequency.value = start_freq * 3
    filter.frequency.exponentialRampToValueAtTime(start_freq, start_time + 0.1)
    osc.frequency.setValueAtTime(start_freq, start_time)
  }

  let release = 0.04
  App.gain_node.gain.setValueAtTime(0, start_time)
  App.gain_node.gain.linearRampToValueAtTime(App.volume_level, start_time + attack)
  App.gain_node.gain.setTargetAtTime(0, start_time + duration, release / 3)
  osc.connect(filter)
  filter.connect(App.gain_node)
  App.gain_node.connect(App.audio_ctx.destination)
  osc.start(start_time)
  osc.stop(start_time + duration + release * 3)
}