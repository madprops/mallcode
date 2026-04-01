module.exports = (App) => {
  App.setup_markov = () => {
    let corpus_path = App.i.path.join(__dirname, `corpus.json`)
    let saved_corpus = JSON.parse(App.i.fs.readFileSync(corpus_path, `utf-8`))
    App.text_generator = new Markov()
    App.text_generator.import(saved_corpus)
  }

  App.get_markov_text = () => {
    let target_length = App.max_echo_length
    let generated_text = ``

    while (generated_text.length < target_length) {
      let options = {maxTries: 1000, filter: result => result.refs.length > 1}

      try {
        let result = App.text_generator.generate(options)
        generated_text += result.string + ` `
      }
      catch (e) {
        generated_text += `signal lost... `
        break
      }
    }

    let final_string = generated_text.trim()

    if (final_string.length > target_length) {
      final_string = final_string.substring(0, target_length).trim() + `...`
    }

    return final_string
  }
}