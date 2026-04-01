module.exports = (App) => {
  App.setup_bundler = () => {
    let libs_dir = path.join(__dirname, `./js/libs`)
    let js_dir = path.join(__dirname, `./js/main`)

    App.top_libs = []
    App.top_main = [`shared`, `base`]

    App.get_js_files = (dir, top_files = []) => {
      let files = fs.readdirSync(dir)
      let js_files = []
      let top_paths = []

      for (let i = 0; i < top_files.length; i++) {
        let expected_name = top_files[i] + `.js`
        let full_path = path.join(dir, expected_name)

        if (fs.existsSync(full_path)) {
          top_paths.push(full_path)
        }
      }

      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        let full_path = path.join(dir, file)
        let is_file = fs.statSync(full_path).isFile()
        let is_js = file.endsWith(`.js`)
        let is_bundle = file.endsWith(`.bundle.js`)
        let base_name = file.replace(/\.js$/, ``)
        let is_top = top_files.includes(base_name)

        if (is_file && is_js && !is_bundle && !is_top) {
          js_files.push(full_path)
        }
      }

      return top_paths.concat(js_files)
    }

    App.bundle_files = () => {
      try {
        App.libs_files = App.get_js_files(libs_dir, App.top_libs)
        App.main_files = App.get_js_files(js_dir, App.top_main)

        let libs_code = App.libs_files.map(f => fs.readFileSync(f, `utf8`)).join(`\n;\n`)
        fs.writeFileSync(path.join(__dirname, `./js/libs.bundle.js`), libs_code, `utf8`)

        let main_code = App.main_files.map(f => fs.readFileSync(f, `utf8`)).join(`\n;\n`)
        fs.writeFileSync(path.join(__dirname, `./js/main.bundle.js`), main_code, `utf8`)
      }
      catch (err) {
        console.error(`Error bundling files:`, err)
      }
    }

    App.bundle_files()
    let debounce_timer

    let handle_watch = (event, filename) => {
      let is_bundle = filename && filename.endsWith(`.bundle.js`)
      let is_js = filename && filename.endsWith(`.js`)

      if (!filename || (is_js && !is_bundle)) {
        clearTimeout(debounce_timer)

        debounce_timer = setTimeout(() => {
          console.log(`Directory changed, rebundling...`)
          App.bundle_files()
        }, 100)
      }
    }

    fs.watch(libs_dir, handle_watch)
    fs.watch(js_dir, handle_watch)
  }
}