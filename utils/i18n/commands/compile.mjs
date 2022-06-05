
import { readLocales } from '../reader.mjs'
import { writeToDisk } from '../original-writer.mjs'

readLocales().then(locales => writeToDisk(locales))