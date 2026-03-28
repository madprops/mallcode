App.audio_context = window.AudioContext || window.webkitAudioContext
App.volume_level = 0.5
App.audio_started = false

App.init_audio = () => {
  if (!App.audio_ctx) {
    App.audio_ctx = new App.audio_context()
  }

  if (App.audio_ctx.state === `suspended`) {
    App.audio_ctx.resume()
  }

  App.audio_started = true
}

App.play_warp_drive = () => {
  if (!App.audio_started) {
    return
  }

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

App.play_zone_enter = () => {
  if (!App.audio_started) {
    return
  }

  let duration = 1.2
  let start_time = App.audio_ctx.currentTime
  let osc_main = App.audio_ctx.createOscillator()
  let osc_sub = App.audio_ctx.createOscillator()
  let main_gain = App.audio_ctx.createGain()
  let filter = App.audio_ctx.createBiquadFilter()

  osc_main.type = `sine`
  // swapped square for triangle to remove the harsh digital edge
  osc_sub.type = `triangle`
  filter.type = `bandpass`

  // sweeping to a lower peak frequency makes it less piercing
  filter.frequency.setValueAtTime(200, start_time)
  filter.frequency.exponentialRampToValueAtTime(1200, start_time + 0.3)

  osc_main.frequency.setValueAtTime(440, start_time)
  osc_main.frequency.setValueAtTime(659.25, start_time + 0.2)

  osc_sub.frequency.setValueAtTime(220, start_time)
  osc_sub.frequency.setValueAtTime(329.63, start_time + 0.2)

  // slower attack and lower peak volume for a gentler swell
  main_gain.gain.setValueAtTime(0, start_time)
  main_gain.gain.linearRampToValueAtTime(0.12, start_time + 0.15)
  main_gain.gain.exponentialRampToValueAtTime(0.01, start_time + duration)

  osc_main.connect(main_gain)
  osc_sub.connect(main_gain)
  main_gain.connect(filter)
  filter.connect(App.audio_ctx.destination)

  osc_main.start(start_time)
  osc_sub.start(start_time)

  osc_main.stop(start_time + duration)
  osc_sub.stop(start_time + duration)
}

App.play_zone_leave = () => {
  if (!App.audio_started) {
    return
  }

  let duration = 1.2
  let start_time = App.audio_ctx.currentTime
  let osc_main = App.audio_ctx.createOscillator()
  let osc_sub = App.audio_ctx.createOscillator()
  let main_gain = App.audio_ctx.createGain()
  let filter = App.audio_ctx.createBiquadFilter()

  osc_main.type = `sine`
  // returning to a triangle wave softens the exit so it feels less abrupt
  osc_sub.type = `triangle`
  filter.type = `lowpass`

  // sweeping the filter down muffles the sound over time, making it feel distant
  filter.frequency.setValueAtTime(2000, start_time)
  filter.frequency.exponentialRampToValueAtTime(100, start_time + duration)

  // a smooth downward frequency slide to simulate powering down or leaving
  osc_main.frequency.setValueAtTime(440, start_time)
  osc_main.frequency.exponentialRampToValueAtTime(55, start_time + duration)

  osc_sub.frequency.setValueAtTime(220, start_time)
  osc_sub.frequency.exponentialRampToValueAtTime(27.5, start_time + duration)

  // quick initial presence, then a long, smooth fade into nothingness
  main_gain.gain.setValueAtTime(0, start_time)
  main_gain.gain.linearRampToValueAtTime(0.15, start_time + 0.1)
  main_gain.gain.exponentialRampToValueAtTime(0.01, start_time + duration)

  osc_main.connect(main_gain)
  osc_sub.connect(main_gain)
  main_gain.connect(filter)
  filter.connect(App.audio_ctx.destination)

  osc_main.start(start_time)
  osc_sub.start(start_time)

  osc_main.stop(start_time + duration)
  osc_sub.stop(start_time + duration)
}

App.sound_enabled = () => {
  return App.volume_level > 0
}

App.refresh_sound_icon = () => {
  if (App.volume_level === 0.5) {
    App.sound_btn.textContent = `🔊`
  }
  else if (App.volume_level === 0.25) {
    App.sound_btn.textContent = `🔉`
  }
  else {
    App.sound_btn.textContent = `🔇`
  }
}

App.setup_sound = () => {
  App.refresh_sound_icon()

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

    if (App.storage) {
      App.storage.volume_level = App.volume_level
      App.save_storage()
    }

    App.refresh_sound_icon()

    if (!App.sound_enabled()) {
      App.stop_beep()
    }

    App.sound_btn.blur()
  })
}

App.play_beep = (seed = `normal`) => {
  if (App.active_osc) {
    App.stop_beep()
  }

  if (!App.audio_started) {
    return
  }

  if (App.volume_level === 0) {
    return
  }

  let hash = Shared.get_string_hash(seed)
  let rng = Shared.create_seeded_random(hash)
  let start_time = App.audio_ctx.currentTime
  App.active_osc = App.audio_ctx.createOscillator()
  App.gain_node = App.audio_ctx.createGain()
  let filter = App.audio_ctx.createBiquadFilter()
  filter.type = `lowpass`
  let instrument_type = Math.floor(rng() * 4)

  // 10ms attack prevents popping but feels instantly responsive
  let attack = 0.01

  let start_freq = 400 + rng() * 400

  if (instrument_type === 0) {
    App.active_osc.type = `sine`
    filter.frequency.value = 20000
  }
  else if (instrument_type === 1) {
    App.active_osc.type = `triangle`
    filter.frequency.value = start_freq * 3
  }
  else if (instrument_type === 2) {
    App.active_osc.type = `square`
    filter.frequency.value = start_freq * 1.5
  }
  else {
    App.active_osc.type = `sawtooth`
    filter.frequency.value = start_freq * 1.2
  }

  App.active_osc.frequency.setValueAtTime(start_freq, start_time)
  App.gain_node.gain.setValueAtTime(0, start_time)
  App.gain_node.gain.linearRampToValueAtTime(App.volume_level, start_time + attack)
  App.active_osc.connect(filter)
  filter.connect(App.gain_node)
  App.gain_node.connect(App.audio_ctx.destination)
  App.active_osc.start(start_time)
  App.stop_beep_debouncer.call()
}

App.stop_beep = () => {
  if (!App.active_osc) {
    return
  }

  let stop_time = App.audio_ctx.currentTime

  // 20ms release cuts off cleanly without a popping artifact
  let release = 0.02

  App.gain_node.gain.cancelScheduledValues(stop_time)
  App.gain_node.gain.setValueAtTime(App.gain_node.gain.value, stop_time)
  App.gain_node.gain.linearRampToValueAtTime(0, stop_time + release)
  App.active_osc.stop(stop_time + release + 0.01)
  App.active_osc = null
  App.gain_node = null
}