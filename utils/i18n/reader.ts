// @ts-check
import glob from 'glob'
import path, { resolve } from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import { mergeWith, merge, reject } from 'lodash-es'

import { compiledFileSchema, paths as translationPaths, contextFromFileName, createConfilitKeyHandler } from './config.js'

// context
// {
//     namespace: namespaces.join('.'),
//     namespaces,
//     locale: locale.replace('_', '-'),
//     extension
// }
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
        const toMerge = locale.map(_parse)
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

// file
// {
//     namespace: namespaces.join('.'),
//     namespaces,
//     locale: locale.replace('_', '-'),
//     extension
// }
const mixinLocale = ({ merging, joinedLocales, mixingWith: { parsedLocale, context } }) => {
    if (!joinedLocales[context.locale]) joinedLocales[context.locale] = {}
    joinedLocales[context.locale] = mergeWith(
        joinedLocales[context.locale],
        parsedLocale[context.locale],
        (objValue, srcValue, key, object, source, stack) => {
            if (!objValue) {
                return srcValue
            }
            for (const k in srcValue) {
                if (objValue[k] && objValue[k] !== srcValue[k]) {
                    if (!merging) console.warn(`[Warning] Merging into initilazed value:
${key}.${k}:
[${typeof srcValue[k]}${typeof srcValue[k] === 'string' && ' `' + srcValue[k] + '`' || ''}] merging into [${typeof objValue[k]}${typeof objValue[k] === 'string' && ' `' + objValue[k] + '`' || ''}].`)
                    objValue = createConfilitKeyHandler(merging)(objValue, srcValue, k)
                    if (!merging) console.log('')
                } else {
                    objValue[k] = srcValue[k]
                }
            }
            return objValue
            // return merge(objValue, srcValue)
        }
    )
}

const createReducer = ({ translationPath, merging }) => async (acc, match) => {
    console.log('parsing', match, '...\n')
    try {
        acc = await acc
        const relative = path.relative(translationPath, match)
        const context = contextFromFileName(relative)
        const data = await parseLocale(match, context)
        mixinLocale({
            merging,
            joinedLocales: acc,
            mixingWith: {
                parsedLocale: data,
                context
            }
        })
        return acc
    } catch (error) {
        console.error(error)
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
* allow customization if {lang}.custom.(yml|yaml) is provided.
*/
const asyncGlob = (path) => new Promise((resolve, reject) => {
    glob(path, (err, matches) => {
        if (err) reject(err)
        else resolve(matches)
    })
})
export const readLocales = async () => {
    let locales = {}
    for (const [index, conf] of translationPaths.entries()) {
        const { path: translationPath, filter } = conf
        const matches = (await asyncGlob(path.join(translationPath, '**/*.yml')))
        .filter(filter)
        const reducer = createReducer({ translationPath, merging: index > 0 })
        locales = await matches.reduce(reducer, locales)
    }

    return locales
}
