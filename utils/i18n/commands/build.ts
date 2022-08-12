
import { readLocales } from '../reader'
import { writeToDisk } from '../built-writer'
import clui from 'clui'
const { Spinner } = clui

void (async () => {
  const work = new Spinner('reading locales...')
  const data = await readLocales()
  work.message('transforming to python-i18n format...')
  await writeToDisk(data)
  work.stop()
  console.log('transformed to python-i18n format')
})()
