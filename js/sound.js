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