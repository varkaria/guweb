import glob from 'glob'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import { merge }from 'lodash-es'

import { compiledFileSchema, path as translationPath, contextFromFileName } from './config.mjs'


const parseLocale = (file, context) => {
    const locale = yaml.load(fs.readFileSync(file, 'utf8'))
    const _parse = (locale) => {
        if (!context.namespaces) return {
            [context.locale]: {
                [context.namespace]: locale
            }
        }
        const rtn = {}
        let inner = rtn
        context.namespaces.forEach((ns, index) => {
            if (index === context.namespaces.length - 1) {
                return inner[ns] = locale
            }
            rtn[ns] = {}
            inner = rtn[ns]
        })
        return {
            [context.locale]: rtn
        }
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
        return rtn
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

                const relative = path.relative(translationPath, match)
                const context = contextFromFileName(relative)
                const data = await parseLocale(match, context)
                if (!acc[context.locale]) acc[context.locale] = {}
                acc[context.locale] = merge(acc[context.locale], data[context.locale])
                return acc
            } catch (error) {
                reject(error)
            }
        }, {})

        resolve(locales)
    })
})
