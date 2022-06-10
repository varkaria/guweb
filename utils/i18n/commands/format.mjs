import yaml from 'js-yaml'

import glob from 'glob'
import path from 'path'
import fs from 'fs/promises'


import { compiledFileSchema, path as translationPath, contextFromFileName } from '../config.mjs'

glob(path.join(translationPath, '**/*.yml'), async (err, matches) => {
    if (err) throw err
    const locales = matches.reduce(async (acc, match) => {
        try {
            const data = yaml.load(await fs.readFile(match, {encoding: 'utf8'}))
            const formatted = yaml.dump(data)
            fs.writeFile(match, formatted, 'utf8')
        } catch (error) {
            reject(error)
        }
    }, {})
})