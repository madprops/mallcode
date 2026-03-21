const Shared = {
  morse_code: {
    ".-":         `A`,
    "-...":       `B`,
    "-.-.":       `C`,
    "-..":        `D`,
    ".":          `E`,
    "..-.":       `F`,
    "--.":        `G`,
    "....":       `H`,
    "..":         `I`,
    ".---":       `J`,
    "-.-":        `K`,
    ".-..":       `L`,
    "--":         `M`,
    "-.":         `N`,
    "---":        `O`,
    ".--.":       `P`,
    "--.-":       `Q`,
    ".-.":        `R`,
    "...":        `S`,
    "-":          `T`,
    "..-":        `U`,
    "...-":       `V`,
    ".--":        `W`,
    "-..-":       `X`,
    "-.--":       `Y`,
    "--..":       `Z`,
    ".----":      `1`,
    "..---":      `2`,
    "...--":      `3`,
    "....-":      `4`,
    ".....":      `5`,
    "-....":      `6`,
    "--...":      `7`,
    "---..":      `8`,
    "----.":      `9`,
    "-----":      `0`,
  },
  zone_settings: {
    1: { unit_duration: 350, letter_mult: 5.0, word_mult: 10, max_press: 2000, throttle: 60, forgiving: true }, // Slow/Forgiving
    2: { unit_duration: 300, letter_mult: 4.5, word_mult: 9, max_press: 1800, throttle: 50, forgiving: true },
    3: { unit_duration: 250, letter_mult: 4.0, word_mult: 8, max_press: 1500, throttle: 40, forgiving: true }, // Default
    4: { unit_duration: 200, letter_mult: 4.0, word_mult: 8, max_press: 1200, throttle: 35, forgiving: false },
    5: { unit_duration: 180, letter_mult: 3.5, word_mult: 7, max_press: 1000, throttle: 30, forgiving: false },
    6: { unit_duration: 150, letter_mult: 3.5, word_mult: 7, max_press: 800, throttle: 25, forgiving: false },
    7: { unit_duration: 120, letter_mult: 3.0, word_mult: 7, max_press: 700, throttle: 20, forgiving: false },
    8: { unit_duration: 100, letter_mult: 3.0, word_mult: 7, max_press: 600, throttle: 15, forgiving: false },
    9: { unit_duration: 80,  letter_mult: 3.0, word_mult: 7, max_press: 500, throttle: 10, forgiving: false }, // Pro/Realistic
  },
  default_zone: `G5`,
  lock_time: 3000,
}

if ((typeof module !== `undefined`) && module.exports) {
  module.exports = Shared
}
else {
  window.Shared = Shared
}