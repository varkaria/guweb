// @ts-check
// @ts-ignore
import path, { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { every, merge } from 'lodash-es'

import { using } from '../../config.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url));

export const compiledFileNameSchema = ['namespace', 'locale', 'extension']
export const compiledFileSchema = ['locale', 'entries']
export const compiled = join(__dirname, '../../.locales')
export const paths = using.map(p => {
    if (typeof p === "string") {
        return {
            path: join(__dirname, '../../', p),
            filter: () => true
        }
    } else if (Array.isArray(p)) {
        if (p.length < 1) return
        const path = p[0]
        const returnValue = {
            path: join(__dirname, '../../', path),
            filter: () => true
        }
        if (p.length < 2) return returnValue

        const conf = p[1]
        if (conf.filter) {
            returnValue.filter = conf.filter
            return returnValue
        } else {
            if (typeof conf.only === "string") {
                conf.only = [conf.only]
                conf.only = conf.only.map((path) => join(returnValue.path, path))
                console.log(conf.only)
                returnValue.filter = (path) => conf.only.some(only => path.startsWith(only))
                return returnValue
            }
            if (typeof conf.except === "string") {
                conf.except = [conf.except]
                conf.except = conf.except.map((path) => join(returnValue.path, path))
                returnValue.filter = (path) => conf.except.every(except => !path.startsWith(except))
                return returnValue
            }
            throw new Error('config invalid:' + p)
        }
    }
}).filter(Boolean)
export const divider = '.'

export function contextToFileName(context) {
    return `${context.namespace}/${context.locale}.${context.extension || 'yml'}`
}
export function contextFromFileName(fileName) {
    const split = fileName.split('/').join(divider).split(divider)
    const namespaces = split.slice(0, split.length - 2)
    const [locale, extension] = split.slice(-2)
    return {
        namespace: namespaces.join('.'),
        namespaces,
        locale: locale.replace('_', '-'),
        extension
    }
}
export const createConfilitKeyHandler = (mergeMode) => function onConflictingKey(oldVal, newVal, key) {
    if (typeof newVal[key] !== 'object' && typeof oldVal[key] !== 'object') {
        console.log(typeof newVal[key], oldVal[key], newVal[key])
        return {
            ...oldVal,
            ...newVal
        }
    }
    if (typeof newVal[key] === 'object' && typeof oldVal[key] === 'object') {
        if (!mergeMode) console.info('merged object', oldVal, newVal)
        return merge(oldVal, newVal)
    }
    if (typeof newVal[key] === 'string') {
        console.info(`[info] ${key} renamed into ${key}._string.`)
        return {
            ...oldVal,
            ...newVal,
            [key]: {
                ...oldVal[key],
                _string: newVal[key]
            }
        }
    }
    else if (typeof oldVal[key] === 'string') {
        console.info(`[info] ${key} renamed into ${key}._string.`)
        return {
            ...oldVal,
            ...newVal,
            [key]: {
                ...newVal[key],
                _string: oldVal[key]
            }
        }
    }
}