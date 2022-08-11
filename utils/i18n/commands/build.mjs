
import { readLocales } from '../reader.mjs'
import { writeToDisk } from '../built-writer.mjs'
import clui from 'clui'
const { Spinner } = clui

const work = new Spinner('reading locales...')
const data = await readLocales()
work.message('transforming to python-i18n format...')
await writeToDisk(data)
work.stop()
console.log('transformed to python-i18n format')