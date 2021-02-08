const Path = require('path')
const fs = require('fs')
const zip = require('bestzip')

const manifest = require('../src/manifest.json')
const target = Path.resolve(__dirname, '../../releases')
const file = `${manifest.name} ${manifest.version}.zip`

if (!fs.existsSync(target)) {
  fs.mkdirSync(target)
}

zip({
  cwd: 'src',
  source: '*',
  destination: `${target}/${file}`,
}).then(function () {
  console.log(`Created: ${file}\n`)
}).catch(function (err) {
  console.error(err.stack)
  process.exit(1)
})
