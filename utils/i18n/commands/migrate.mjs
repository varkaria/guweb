
import { readLocales } from '../original-reader.mjs'
import { writeToDisk } from '../writer.mjs'

readLocales().then(locales => writeToDisk(locales))