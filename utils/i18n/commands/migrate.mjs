
import { readLocales } from '../built-reader.mjs'
import { writeToDisk } from '../writer.mjs'

readLocales().then(locales => writeToDisk(locales))