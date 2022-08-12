import glob from 'glob'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

import { compiledFileNameSchema, compiledFileSchema, compiled as translationPath, divider } from './config.js'

const parseFileName = (file) => {
    const fileName = path.relative(translationPath, file)
    const parts = fileName.split(divider)
    return compiledFileNameSchema.reduce((acc, part, index) => {
        acc[part] = parts[index]
        return acc
    }, {})
}

const parseLocale = (file, context) => {
    const locale = yaml.load(fs.readFileSync(file, 'utf8'))
    const _parse = (locale) => {
        const rtn = {
            // [context.namespace]: {
            //     [context.locale]: null,
            // }
            [context.locale]: {
                [context.namespace]: null
            }
        }
        let current = locale
        let currentLocale = undefined
        compiledFileSchema.forEach(part => {
            switch (part) {
                case 'locale': {
                    currentLocale = context.locale
                    current = current[currentLocale]
                    break
                }
                case 'entries': {
                    rtn[currentLocale][context.namespace] = current
                    break
                }
                default: {
                    throw new Error('unknown type of file')
                }
            }
        })
        return rtn
    }
    if (Array.isArray(locale)) {
        const toMerge = locale.forEach(_parse)
        let rtn = {}
        for (const item of toMerge) {
            rtn = {
                ...rtn,
                ...item
            }
        }
    } else {
        return _parse(locale)
    }
}
/* ----------------------------------------------------------------
** return format: {
  [locale]: {
      [namespace]: {
          ...entries
      }
  }    
}
*/
export const readLocales = () => new Promise((resolve, reject) => {
    glob(path.join(translationPath, '**/*.yml'), async (err, matches) => {
        if (err) throw err
        const locales = await matches.reduce(async (acc, match) => {
            try {
                acc = await acc
                const name = parseFileName(match)
                const data = await parseLocale(match, name)
                if (!acc[name.locale]) acc[name.locale] = {}
                acc[name.locale] = {
                    ...acc[name.locale],
                    ...data[name.locale]
                }
                return acc
            } catch (error) {
                reject(error)
            }
        }, {})

        resolve(locales)
    })
})
