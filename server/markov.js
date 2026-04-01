let fs = require(`fs`)
let path = require(`path`)
let Markov = require(`markov-strings`).default

function build_corpus(file_name) {
  let input_path = path.join(__dirname, file_name)
  let output_path = path.join(__dirname, `corpus.json`)
  let text = fs.readFileSync(input_path, `utf-8`)
  let sentences = text.split(`. `)
  let chain = new Markov({stateSize: 2})
  chain.addData(sentences)
  fs.writeFileSync(output_path, JSON.stringify(chain.export()))
}

build_corpus(`corpus.txt`)