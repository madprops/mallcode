const Shared = {}

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
  "--..--":     `,`,
  ".-.-.-":     `.`,
  "-.-.--":     `!`,
  "..--..":     `?`,
  ".----.":     `'`,
  "-....-":     `-`,
  "...-..-":    `$`,
  ".--.-.":     `@`,
  "---...":     `:`,
  "-.--.":      `(`,
  "-.--.-":     `)`,
  "-...-":      `=`,
  ".-...":      `&`,
  "..--.-":     `_`,
  "-..-.":      `/`,
  "-.-.-.":     `;`,
  ".-.-.":      `+`,
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
  9: {unit_duration: 80, letter_mult: 3.0, word_mult: 7, max_press: 500, throttle: 10, forgiving: false},
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

Shared.random_word = (parts = 3, seed = null, capitalize = false) => {
  let cons = `bcdfghjklmnpqrstvwxyz`
  let vowels = `aeiou`
  let rng = seed ? Shared.create_seeded_random(Shared.get_string_hash(seed.toString())) : Math.random
  let cons_next = Math.floor(rng() * 2) === 0
  let word = ``

  for (let i = 0; i < parts * 2; i++) {
    if (!cons_next) {
      let index = Math.floor(rng() * cons.length)
      word += cons[index]
    }
    else {
      let index = Math.floor(rng() * vowels.length)
      word += vowels[index]
    }

    cons_next = !cons_next
  }

  if (capitalize) {
    word = word.charAt(0).toUpperCase() + word.slice(1)
  }

  return word
}

Shared.create_debouncer = (func, delay) => {
  if (typeof func !== `function`) {
    console.error(`Invalid debouncer function`)
    return
  }

  if ((typeof delay !== `number`) || (delay < 1)) {
    console.error(`Invalid debouncer delay`)
    return
  }

  let timer
  let obj = {}

  function clear() {
    clearTimeout(timer)
    timer = undefined
  }

  function run(...args) {
    func(...args)
  }

  obj.call = (...args) => {
    clear()

    timer = setTimeout(() => {
      run(...args)
    }, delay)
  }

  obj.call_2 = (...args) => {
    if (timer) {
      return
    }

    obj.call(args)
  }

  obj.now = (...args) => {
    clear()
    run(...args)
  }

  obj.cancel = () => {
    clear()
  }

  return obj
}

Shared.random_int = (args = {}) => {
  let def_args = {
    exclude: [],
  }

  Shared.def_args(def_args, args)

  if (args.exclude.length > 0) {
    let available = []

    for (let i = args.min; i <= args.max; i++) {
      if (!args.exclude.includes(i)) {
        available.push(i)
      }
    }

    if (!available.length) {
      return
    }

    let random_index

    if (args.rand) {
      random_index = Math.floor(args.rand() * available.length)
    }
    else {
      random_index = Math.floor(Math.random() * available.length)
    }

    return available[random_index]
  }

  if (args.rand) {
    return Math.floor(args.rand() * (args.max - args.min + 1) + args.min)
  }

  return Math.floor(Math.random() * (args.max - args.min + 1) + args.min)
}

Shared.def_args = (def, args) => {
  for (let key in def) {
    if ((args[key] === undefined) && (def[key] !== undefined)) {
      args[key] = def[key]
    }
  }
}

if ((typeof module !== `undefined`) && module.exports) {
  module.exports = Shared
}
else {
  window.Shared = Shared
}