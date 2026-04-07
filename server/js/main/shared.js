let Shared = {}

Shared.letters = [`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`, `V`, `W`, `X`, `Y`, `Z`]
Shared.speeds = [1, 2, 3, 4, 5, 6, 7, 8, 9]
Shared.default_speed = 7
Shared.default_lang = `latin`

Shared.prosigns = {
  "...-.": `SN`,
  "...--.--..-.": `SPGR`,
  "...--.-.-.-.--": `SPCY`,
  "...--.......-...": `SPHB`,
  "...--..-.-.": `SPAR`,
  "...--..--..-.": `SPPR`,
  "...--.-.....-": `SPDV`,
  "...--.-.-.-.": `SPKR`,
  "...--.-....": `SPTH`,
  "...--.-.-.....": `SPCH`,
  "...--.......": `SPES`,
  "-..---": `DO`,
  "...---...": `SOS`,
  "-...-.-": `BK`,
}

Shared.dictionaries = {
  latin: {
    ".-": `A`,
    "-...": `B`,
    "-.-.": `C`,
    "-..": `D`,
    ".": `E`,
    "..-.": `F`,
    "--.": `G`,
    "....": `H`,
    "..": `I`,
    ".---": `J`,
    "-.-": `K`,
    ".-..": `L`,
    "--": `M`,
    "-.": `N`,
    "---": `O`,
    ".--.": `P`,
    "--.-": `Q`,
    ".-.": `R`,
    "...": `S`,
    "-": `T`,
    "..-": `U`,
    "...-": `V`,
    ".--": `W`,
    "-..-": `X`,
    "-.--": `Y`,
    "--..": `Z`,
    ".----": `1`,
    "..---": `2`,
    "...--": `3`,
    "....-": `4`,
    ".....": `5`,
    "-....": `6`,
    "--...": `7`,
    "---..": `8`,
    "----.": `9`,
    "-----": `0`,
    "--..--": `,`,
    ".-.-.-": `.`,
    "-.-.--": `!`,
    "..--..": `?`,
    ".----.": `'`,
    "-....-": `-`,
    "...-..-": `$`,
    ".--.-.": `@`,
    "---...": `:`,
    "-.--.": `(`,
    "-.--.-": `)`,
    "-...-": `=`,
    ".-...": `&`,
    "..--.-": `_`,
    "-..-.": `/`,
    "-.-.-.": `;`,
    ".-.-.": `+`,
    "--.--": `Ñ`,
    ".-.-": `Ä`,
    ".--.-": `Á`,
    "..-..": `É`,
    "---.": `Ö`,
    "..--": `Ü`,
    "----": `CH`,
    "...-.-": `SK`,
    "-.-.-": `CT`,
    ".-..-.": `"`,
    "-.-..": `Ç`,
    ".-..-": `È`,
    "........": `ERROR`,
    ".--..": `Þ`,
    "..--.": `Ð`,
    ".-.-..": `¶`,
    ".---.": `Å`,
    "--.-.": `Ĝ`,
    "...-...": `Ś`,
    "--..-.": `Ź`,
    "--..-": `Ż`,
    "..-.-": `¿`,
    "--...-": `¡`,
  },
  greek: {
    ".-": `Α`,
    "-...": `Β`,
    "--.": `Γ`,
    "-..": `Δ`,
    ".": `Ε`,
    "--..": `Ζ`,
    "....": `Η`,
    "-.-.": `Θ`,
    "..": `Ι`,
    "-.-": `Κ`,
    ".-..": `Λ`,
    "--": `Μ`,
    "-.": `Ν`,
    "-..-": `Ξ`,
    "---": `Ο`,
    ".--.": `Π`,
    ".-.": `Ρ`,
    "...": `Σ`,
    "-": `Τ`,
    "-.--": `Υ`,
    "..-.": `Φ`,
    "----": `Χ`,
    "--.-": `Ψ`,
    ".--": `Ω`,
  },
  cyrillic: {
    ".-": `А`,
    "-...": `Б`,
    ".--": `В`,
    "--.": `Г`,
    "-..": `Д`,
    ".": `Е`,
    "...-": `Ж`,
    "--..": `З`,
    "..": `И`,
    ".---": `Й`,
    "-.-": `К`,
    ".-..": `Л`,
    "--": `М`,
    "-.": `Н`,
    "---": `О`,
    ".--.": `П`,
    ".-.": `Р`,
    "...": `С`,
    "-": `Т`,
    "..-": `У`,
    "..-.": `Ф`,
    "....": `Х`,
    "-.-.": `Ц`,
    "---.": `Ч`,
    "----": `Ш`,
    "--.-": `Щ`,
    "--.--": `Ъ`,
    "-.--": `Ы`,
    "-..-": `Ь`,
    "..-..": `Э`,
    "..--": `Ю`,
    ".-.-": `Я`,
  },
  hebrew: {
    ".-": `א`,
    "-...": `ב`,
    "--.": `ג`,
    "-..": `ד`,
    "---": `ה`,
    ".": `ו`,
    "--..": `ז`,
    "....": `ח`,
    "..-": `ט`,
    "..": `י`,
    "-.-": `כ`,
    ".-..": `ל`,
    "--": `מ`,
    "-.": `נ`,
    "-.-.": `ס`,
    ".---": `ע`,
    ".--.": `פ`,
    ".--": `צ`,
    "--.-": `ק`,
    ".-.": `ר`,
    "...": `ש`,
    "-": `ת`,
  },
  arabic: {
    ".-": `ا`,
    "-...": `ب`,
    "-": `ت`,
    "-.-.": `ث`,
    ".---": `ج`,
    "....": `ح`,
    "---.": `خ`,
    "-..": `د`,
    "--..": `ذ`,
    ".-.": `ر`,
    "---": `ز`,
    "...": `س`,
    "----": `ش`,
    "-..-": `ص`,
    "...-": `ض`,
    "..-.": `ط`,
    "-.--": `ظ`,
    ".-.-": `ع`,
    "--.": `غ`,
    "..-..": `ف`,
    "--.-": `ق`,
    "-.-": `ك`,
    ".-..": `ل`,
    "--": `م`,
    "-.": `ن`,
    "..": `ه`,
    ".--": `و`,
    "..-": `ي`,
  },
  persian: {
    ".-": `ا`,
    "-...": `ب`,
    ".--.": `پ`,
    "-": `ت`,
    "-.-.": `ث`,
    ".---": `ج`,
    "---.": `چ`,
    "....": `ح`,
    "----": `خ`,
    "-..": `د`,
    "--..": `ذ`,
    ".-.": `ر`,
    "---": `ز`,
    "..-..": `ژ`,
    "...": `س`,
    "...-": `ش`,
    "-..-": `ص`,
    "-.--": `ض`,
    "..-.": `ط`,
    ".-.-": `ظ`,
    "--.": `ع`,
    "--.-": `غ`,
    "..-": `ف`,
    "---..": `ق`,
    "-.-": `ك`,
    "--.--": `گ`,
    ".-..": `ل`,
    "--": `م`,
    "-.": `ن`,
    "..": `و`,
    ".--": `ه`,
    ".--.-": `ي`,
  },
  devanagari: {
    ".-": `अ`,
    "-...": `ब`,
    "-.-.": `च`,
    "-..": `द`,
    ".": `ए`,
    "..-.": `फ`,
    "--.": `ग`,
    "....": `ह`,
    "..": `इ`,
    ".---": `ज`,
    "-.-": `क`,
    ".-..": `ल`,
    "--": `म`,
    "-.": `न`,
    "---": `ओ`,
    ".--.": `प`,
    "--.-": `क़`,
    ".-.": `र`,
    "...": `स`,
    "-": `त`,
    "..-": `उ`,
    "...-": `व`,
    ".--": `व`,
    "-..-": `क्ष`,
    "-.--": `य`,
    "--..": `ज़`,
  },
  korean: {
    ".-..": `ㄱ`,
    "..-.": `ㄴ`,
    "-...": `ㄷ`,
    "...-": `ㄹ`,
    "--": `ㅁ`,
    ".--.": `ㅂ`,
    "--.": `ㅅ`,
    "-.-": `ㅇ`,
    ".--": `ㅈ`,
    "-.-.": `ㅊ`,
    "-..-": `ㅋ`,
    "--..": `ㅌ`,
    "---": `ㅍ`,
    ".---": `ㅎ`,
    ".": `ㅏ`,
    "..": `ㅑ`,
    "-": `ㅓ`,
    "...": `ㅕ`,
    ".-": `ㅗ`,
    "-.": `ㅛ`,
    "....": `ㅜ`,
    ".-.": `ㅠ`,
    "-..": `ㅡ`,
    "..-": `ㅣ`,
    "..--": `ㅐ`,
    "--.-": `ㅔ`,
  },
  thai: {
    ".-": `ก`,
    "-...": `ข`,
    "-.-.": `ค`,
    "-..": `ง`,
    ".": `จ`,
    "..-.": `ฉ`,
    "--.": `ช`,
    "....": `ซ`,
    "..": `ญ`,
    ".---": `ด`,
    "-.-": `ต`,
    ".-..": `ถ`,
    "--": `ท`,
    "-.": `น`,
    "---": `บ`,
    ".--.": `ป`,
    "--.-": `ผ`,
    ".-.": `ฝ`,
    "...": `พ`,
    "-": `ฟ`,
    "..-": `ม`,
    "...-": `ย`,
    ".--": `ร`,
    "-..-": `ล`,
    "-.--": `ว`,
    "--..": `ส`,
    "..--": `ห`,
    ".-.-": `อ`,
    "---.": `ฮ`,
    ".--.-": `ะ`,
    ".-.-.": `า`,
    ".----": `ิ`,
    "..---": `ี`,
    "...--": `ึ`,
    "....-": `ื`,
    ".....": `ุ`,
    "-....": `ู`,
    "--...": `เ`,
    "---..": `แ`,
    "----.": `โ`,
    "-----": `ใ`,
    "--..--": `ไ`,
    ".-.-.-": `ำ`,
    "-.-.--": `่`,
    "..--..": `้`,
    ".----.": `๊`,
    "-....-": `๋`,
    "...-..-": `์`,
  },
  wabun: {
    ".-": `イ`,
    ".-.-": `ロ`,
    "-...": `ハ`,
    ".-..": `ニ`,
    "-..": `ホ`,
    ".": `ヘ`,
    "..-..": `ト`,
    "..-.": `チ`,
    "--.-": `リ`,
    ".-.-.": `ヌ`,
    "-.--": `ル`,
    "---": `ヲ`,
    "-.-": `ワ`,
    ".---": `カ`,
    ".-.": `ヨ`,
    "-..-": `タ`,
    ".-...": `レ`,
    "---.": `ソ`,
    ".--.": `ツ`,
    "--..": `ネ`,
    "--": `ナ`,
    "...": `ラ`,
    "---.-": `ム`,
    "..-": `ウ`,
    "..-.-": `ヰ`,
    "--.": `ノ`,
    "..--": `オ`,
    ".-..-": `ク`,
    "--...": `ヤ`,
    "...-": `マ`,
    ".-...-": `ケ`,
    "....": `フ`,
    "-....": `コ`,
    ".-..-.": `エ`,
    "--.-.": `テ`,
    "--..-": `ア`,
    "-.-.-": `サ`,
    "-.-..": `キ`,
    "-...-": `ユ`,
    ".-.--": `メ`,
    "..-.-.": `ミ`,
    "--.--": `ヱ`,
    ".--": `ヒ`,
    "----": `モ`,
    "...-.-": `セ`,
    "---.-.": `ス`,
    ".-.-.-": `ン`,
    "..": `゛`,
    "..--.": `゜`,
  },
  esperanto: {
    ".-": `A`,
    "-...": `B`,
    "-.-.": `C`,
    "-.-..": `Ĉ`,
    "-..": `D`,
    ".": `E`,
    "..-.": `F`,
    "--.": `G`,
    "--.-.": `Ĝ`,
    "....": `H`,
    "----": `Ĥ`,
    "..": `I`,
    ".---": `J`,
    ".---.": `Ĵ`,
    "-.-": `K`,
    ".-..": `L`,
    "--": `M`,
    "-.": `N`,
    "---": `O`,
    ".--.": `P`,
    ".-.": `R`,
    "...": `S`,
    "...-.": `Ŝ`,
    "-": `T`,
    "..-": `U`,
    "..--": `Ŭ`,
    "...-": `V`,
    "--..": `Z`,
    ".----": `1`,
    "..---": `2`,
    "...--": `3`,
    "....-": `4`,
    ".....": `5`,
    "-....": `6`,
    "--...": `7`,
    "---..": `8`,
    "----.": `9`,
    "-----": `0`,
    "--..--": `,`,
    ".-.-.-": `.`,
    "..--..": `?`,
  },
}

Shared.deflang = Shared.dictionaries[Shared.default_lang]

Shared.get_letter = (lang, sequence) => {
  let dictionary = Shared.dictionaries[lang || Shared.default_lang] || Shared.deflang
  return dictionary[sequence] || Shared.deflang[sequence] || Shared.prosigns[sequence] || ``
}

Shared.zone_settings = {
  1: {unit_duration: 350, iambic_duration: 240, letter_mult: 5.0, word_mult: 10, max_press: 2000, throttle: 5, forgiving: true},
  2: {unit_duration: 300, iambic_duration: 220, letter_mult: 4.5, word_mult: 9, max_press: 1800, throttle: 5, forgiving: true},
  3: {unit_duration: 250, iambic_duration: 200, letter_mult: 4.0, word_mult: 8, max_press: 1500, throttle: 5, forgiving: true},
  4: {unit_duration: 210, iambic_duration: 180, letter_mult: 3.5, word_mult: 7, max_press: 1200, throttle: 5, forgiving: true},
  5: {unit_duration: 180, iambic_duration: 160, letter_mult: 3.5, word_mult: 7, max_press: 1000, throttle: 5, forgiving: false},
  6: {unit_duration: 150, iambic_duration: 140, letter_mult: 3.0, word_mult: 7, max_press: 800, throttle: 5, forgiving: false},
  7: {unit_duration: 120, iambic_duration: 120, letter_mult: 3.0, word_mult: 7, max_press: 700, throttle: 5, forgiving: false},
  8: {unit_duration: 100, iambic_duration: 100, letter_mult: 3.0, word_mult: 7, max_press: 600, throttle: 5, forgiving: false},
  9: {unit_duration: 80, iambic_duration: 80, letter_mult: 3.0, word_mult: 7, max_press: 500, throttle: 5, forgiving: false},
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

Shared.is_url = (text) => {
  return text.startsWith(`http://`) || text.startsWith(`https://`)
}

Shared.process_gap = (gap, unit_duration, sequence_length, settings) => {
  if ((typeof gap === `number`) && (gap > 0) && (sequence_length > 0)) {
    let max_gap = settings.max_press
    let safe_gap = Math.min(gap, max_gap)

    if (safe_gap < (unit_duration * 2)) {
      let estimated_unit = safe_gap
      unit_duration = unit_duration * 0.8 + estimated_unit * 0.2
      let min_u = settings.forgiving ? 150 : settings.unit_duration * 0.8
      let max_u = settings.forgiving ? 500 : settings.unit_duration * 1.2
      unit_duration = Math.max(min_u, Math.min(max_u, unit_duration))
    }
  }

  return unit_duration
}

Shared.process_duration = (duration, unit_duration, sequence, settings) => {
  let max_allowed = settings.max_press + 500
  let safe_duration = Math.max(10, Math.min(duration, max_allowed))
  let max_seq_length = 15

  if (sequence.length < max_seq_length) {
    if (safe_duration < (unit_duration * 2)) {
      sequence += `.`
      let estimated_unit = safe_duration
      unit_duration = unit_duration * 0.7 + estimated_unit * 0.3
    }
    else {
      sequence += `-`
      let estimated_unit = safe_duration / 3
      unit_duration = unit_duration * 0.7 + estimated_unit * 0.3
    }
  }

  let min_u = settings.forgiving ? 150 : settings.unit_duration * 0.8
  let max_u = settings.forgiving ? 500 : settings.unit_duration * 1.2
  unit_duration = Math.max(min_u, Math.min(max_u, unit_duration))

  return {unit_duration, sequence}
}

Shared.validate_timing = (client_time, server_time, max_latency = 1500) => {
  if ((typeof client_time !== `number`) || (client_time <= 0)) {
    return server_time
  }

  let diff = Math.abs(client_time - server_time)

  if (diff <= max_latency) {
    return client_time
  }

  return server_time
}

Shared.is_public_zone = (zone) => {
  return /^[A-Z][1-9]$/i.test(zone)
}

Shared.capitalize = (s) => {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

Shared.ticker_text = (text, lower = true) => {
  if (lower) {
    text = text.toLowerCase()
  }

  // turn newlines into a stylized separator for the ticker
  text = text.replace(/[\r\n]+/g, ` // `)

  // strip out dialogue hyphens
  text = text.replace(/- /g, ``)

  // remove leading punctuation from segments
  text = text.replace(/(^|\/\/)\s*[,.;:-]+/g, `$1 `)

  // remove trailing punctuation from segments
  text = text.replace(/[,.;:-]+(?=\s*(?:\/\/|$))/g, ``)

  // clean up any accidental double spaces
  text = text.replace(/\s+/g, ` `)

  return text.trim()
}

Shared.random_choice = (array) => {
  return array[Math.floor(Math.random() * array.length)]
}

Shared.random_letter = () => {
  return Shared.random_choice(Shared.letters)
}

Shared.random_speed = () => {
  return Shared.random_choice(Shared.speeds)
}

Shared.singular_or_plural = (num, singular, plural) => {
  let s = num === 1 ? singular : plural
  return `${num} ${s}`
}

if ((typeof module !== `undefined`) && module.exports) {
  module.exports = Shared
}
else {
  window.Shared = Shared
}