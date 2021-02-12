// core
import Path from 'path'
import Fs from 'fs'
import util from 'util'

// utils
import mergeOptions from 'merge-options'

// plugins
import { string } from 'rollup-plugin-string'
import scss from 'rollup-plugin-scss'
import copy from 'rollup-plugin-copy-watch'
import del from 'rollup-plugin-delete'

// ---------------------------------------------------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
function inspect (value) {
  console.log(util.inspect(value, { colors: true, depth: 10 }))
}

function merge (...args) {
  return mergeOptions.call({ concatArrays: true }, ...args)
}

function checkModule (srcFile, trgFile = srcFile) {
  // values
  const [name] = srcFile.split('.')
  const srcRel = `src/${name}/${srcFile}`
  const trgDir = `dist/${name}`
  const trgRel = `${trgDir}/${trgFile}`
  const srcAbs = Path.resolve(srcRel)

  // config
  const config = {
    name,
    srcAbs,
    srcRel,
    trgRel,
    trgDir,
    trgFile,
  }

  // return if exists
  if (Fs.existsSync(srcAbs)) {
    return config
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------------------------------

function bundle (name, options = {}) {
  // main
  const config = merge({ plugins: [] }, options)

  // html
  const page = checkModule(name + '.html')
  if (page) {
    config.plugins.push(
      copy({
        watch: [
          page.srcAbs,
        ],
        targets: [
          { src: page.srcRel, dest: page.trgDir },
        ],
      }),
    )
  }

  // javascript
  const script = checkModule(name + '.js')
  if (script) {
    config.input = script.srcRel
    config.output = {
      dir: script.trgDir,
      name: script.name,
    }
    config.plugins.push(string({
      include: '**/*.html',
    }))
  }

  // scss
  const styles = checkModule(name + '.scss', name + '.css')
  if (styles) {
    config.plugins.push(
      scss({
        output: styles.trgRel,
      }),
    )
  }

  // return
  return config
}

export default [
  bundle('background', {
    plugins: [
      del({
        targets: 'dist/*',
        runOnce: true,
      }),
      copy({
        watch: 'static',
        targets: [
          { dest: 'dist', src: 'src/assets' },
          { dest: 'dist', src: 'src/manifest.json' },
          { dest: 'dist', src: 'src/rules.json' },
        ],
      }),
    ],
  }),
  bundle('content'),
  bundle('popup'),
]