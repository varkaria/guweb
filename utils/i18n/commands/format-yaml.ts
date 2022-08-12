// import { parseDocument } from 'yaml'

// import glob from 'glob'
// import path from 'path'
// import fs from 'fs/promises'
// import clui from 'clui'

// import { path as translationPath } from '../config'

// const parallel = (process.env.PARALLEL != null) || false
// const { Spinner } = clui

// const doWork = async (match: string): Promise<void> => {
//   try {
//     const data = parseDocument(await fs.readFile(match, { encoding: 'utf8' }))
//     const formatted = data.toString({
//       blockQuote: 'literal',
//       defaultStringType: 'BLOCK_FOLDED'
//     })
//     await fs.writeFile(match, formatted, 'utf8')
//   } catch (error) {
//     console.error(error)
//   }
// }

// glob(path.join(translationPath, '**/*.yml'), async (err, matches) => {
//   if (err != null) throw err
//   const work = new Spinner('formatting locales...')
//   work.start()
//   if (parallel) {
//     await Promise.all(matches.map(async (match) => {
//       const work = new Spinner(`formatting locale: ${match}`)
//       work.start()
//       await doWork(match)
//       work.stop()
//     }))
//   } else {
//     for (const match of matches) {
//       work.message(`formatting locale: ${match}`)
//       await doWork(match)
//     }
//   }
//   work.stop()
//   console.log('formatting locales...  done')
// })
