let fs = require(`fs`)
let Markov = require(`markov-strings`).default

function build_corpus(file_path) {
  let text = fs.readFileSync(file_path, `utf-8`)
  let sentences = text.split(`. `)
  let chain = new Markov({stateSize: 2})
  chain.addData(sentences)
  fs.writeFileSync(`corpus.json`, JSON.stringify(chain.export()))
}

build_corpus(`corpus.txt`)