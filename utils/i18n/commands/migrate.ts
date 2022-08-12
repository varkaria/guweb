
import { readLocales } from '../built-reader.ts/index.js'
import { writeToDisk } from '../writer'

readLocales().then(locales => writeToDisk(locales))