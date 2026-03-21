const Shared = {}

Shared.default_zone = () => {
  let date = new Date()
  let day = String(date.getDate()).padStart(2, `0`)
  let month = String(date.getMonth() + 1).padStart(2, `0`)
  let year = date.getFullYear()
  let date_str = `${day}/${month}/${year}`
  let hash = Shared.get_string_hash(date_str)
  let rng = Shared.create_seeded_random(hash)
  let letter = String.fromCharCode(65 + Math.floor(rng() * 26)) // A-Z
  let number = 1 + Math.floor(rng() * 9)                        // 1-9
  return `${letter}${number}`
}

Shared.morse_code = {
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
}

Shared.zone_settings = {
  // Slow/Forgiving
  1: {unit_duration: 350, letter_mult: 5.0, word_mult: 10, max_press: 2000, throttle: 60, forgiving: true},
  2: {unit_duration: 300, letter_mult: 4.5, word_mult: 9, max_press: 1800, throttle: 50, forgiving: true},
  3: {unit_duration: 250, letter_mult: 4.0, word_mult: 8, max_press: 1500, throttle: 40, forgiving: true},
  4: {unit_duration: 200, letter_mult: 4.0, word_mult: 8, max_press: 1200, throttle: 35, forgiving: false},
  5: {unit_duration: 180, letter_mult: 3.5, word_mult: 7, max_press: 1000, throttle: 30, forgiving: false},
  6: {unit_duration: 150, letter_mult: 3.5, word_mult: 7, max_press: 800, throttle: 25, forgiving: false},
  7: {unit_duration: 120, letter_mult: 3.0, word_mult: 7, max_press: 700, throttle: 20, forgiving: false},
  8: {unit_duration: 100, letter_mult: 3.0, word_mult: 7, max_press: 600, throttle: 15, forgiving: false},
  9: {unit_duration: 80,  letter_mult: 3.0, word_mult: 7, max_press: 500, throttle: 10, forgiving: false},
  // Pro/Realistic
}

Shared.lock_time = 3000

Shared.get_string_hash = (str) => {
  let hash = 0x811c9dc5

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

Shared.create_seeded_random = (seed) => {
  return function() {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

if ((typeof module !== `undefined`) && module.exports) {
  module.exports = Shared
}
else {
  window.Shared = Shared
}