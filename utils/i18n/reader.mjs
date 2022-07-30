// @ts-check
import glob from 'glob'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import { mergeWith, merge } from 'lodash-es'

import { compiledFileSchema, path as translationPath, contextFromFileName, createConfilitKeyHandler } from './config.mjs'


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
export const readLocales = () => new Promise((resolve, reject) => {
    glob(path.join(translationPath, '**/*.yml'), async (err, matches) => {
        if (err) throw err
        const { normal, custom } = matches.reduce((acc, cur) => {
            if (!cur.includes('.custom')) {
                acc.normal.push(cur)
            }
            else {
                acc.custom.push(cur)
            }
            return acc
        }, { normal: [], custom: [] })
        const reducer = (customMerge) => async (acc, match) => {
            console.log('parsing', match, '...\n')
            try {
                acc = await acc
                const relative = path.relative(translationPath, match)
                const removeOverwrite = relative.replace('.custom', '')
                const context = contextFromFileName(removeOverwrite)
                const data = await parseLocale(match, context)
                if (!acc[context.locale]) acc[context.locale] = {}
                acc[context.locale] = mergeWith(
                    acc[context.locale],
                    data[context.locale],
                    (objValue, srcValue, key, object, source, stack) => {
                        if (!objValue) {
                            return srcValue
                        }
                        for (const k in srcValue) {
                            if (objValue[k] && objValue[k] !== srcValue[k]) {
                                if (!customMerge) console.warn(`[Warning] Merging into initilazed value:
  ${key}.${k}:
    [${typeof srcValue[k]}${typeof srcValue[k] === 'string' && ' `' + srcValue[k] + '`' || ''}] merging into [${typeof objValue[k]}${typeof objValue[k] === 'string' && ' `' + objValue[k] + '`' || ''}].`)
                                objValue = createConfilitKeyHandler(customMerge)(objValue, srcValue, k)
                                if (!customMerge) console.log('')
                            } else {
                                objValue[k] = srcValue[k]
                            }
                        }
                        return objValue
                        // return merge(objValue, srcValue)
                    }
                )
                return acc
            } catch (error) {
                reject(error)
            }
        }
        let locales = await normal.reduce(reducer(false), {})
        locales = await custom.reduce(reducer(true), locales)
        // console.log(locales)
        resolve(locales)
    })
})
