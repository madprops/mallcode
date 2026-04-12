App.load_storage = async () => {
  return new Promise((resolve) => {
    let request = window.indexedDB.open(App.ls_storage, 1)

    request.onupgradeneeded = (e) => {
      let db = e.target.result

      if (!db.objectStoreNames.contains(`store`)) {
        db.createObjectStore(`store`)
      }
    }

    request.onsuccess = (e) => {
      App.db = e.target.result
      let tx = App.db.transaction(`store`, `readonly`)
      let store = tx.objectStore(`store`)
      let get_req = store.get(`data`)

      get_req.onsuccess = () => {
        App.storage = get_req.result || {}

        if (App.storage.volume !== undefined) {
          App.volume = App.storage.volume

          if (!App.get_options(`volume`).includes(App.volume)) {
            App.volume = `max`
          }
        }

        if (App.storage.animation !== undefined) {
          App.animation = Boolean(App.storage.animation)
        }

        if (App.storage.sequence !== undefined) {
          App.sequence = App.storage.sequence

          if (!App.get_options(`sequence`).includes(App.sequence)) {
            App.sequence = `above`
          }
        }

        if (App.storage.script !== undefined) {
          App.script = App.storage.script

          if (!Object.keys(App.scripts).includes(App.script)) {
            App.script = Shared.default_script
          }
        }

        if (App.storage.iambic_mode !== undefined) {
          App.iambic_mode = App.storage.iambic_mode

          if (!Object.keys(App.iambic_modes).includes(App.iambic_mode)) {
            App.iambic_mode = Shared.default_iambic
          }
        }

        App.join_sound = Boolean(App.storage.join_sound)
        App.leave_sound = Boolean(App.storage.leave_sound)

        if (App.storage.max_unfocused_beeps !== undefined) {
          App.max_unfocused_beeps = App.storage.max_unfocused_beeps
        }

        if (App.storage.background !== undefined) {
          App.background = App.storage.background
        }

        resolve()
      }

      get_req.onerror = () => {
        App.storage = {}
        resolve()
      }
    }

    request.onerror = () => {
      console.error(`Error loading IndexedDB`)
      App.storage = {}
      resolve()
    }
  })
}

App.save_storage = () => {
  if (!App.db || !App.storage) {
    return
  }

  App.storage.volume = App.volume
  App.storage.animation = App.animation
  App.storage.sequence = App.sequence
  App.storage.max_unfocused_beeps = App.max_unfocused_beeps
  App.storage.join_sound = App.join_sound
  App.storage.leave_sound = App.leave_sound
  App.storage.background = App.background

  let tx = App.db.transaction(`store`, `readwrite`)
  let store = tx.objectStore(`store`)
  store.put(App.storage, `data`)
}