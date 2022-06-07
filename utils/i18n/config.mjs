import { join } from 'path'
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const compiledFileNameSchema = ['namespace', 'locale', 'extension']
export const compiledFileSchema = ['locale', 'entries']
export const compiled = join(__dirname, '../../.locales')
export const path = join(__dirname, '../../locales')
export const divider = '.'

export const contextToFileName = function generateFileName(context) {
    return `${context.namespace}/${context.locale}.${context.extension || 'yml'}`
}
export const contextFromFileName = function generateContext(fileName) {
    const split = fileName.split('/')
    const namespace = split[0]
    const [locale, extension] = split[1].split(divider)
    return {
        namespace,
        locale: locale.replace('_', '-'),
        extension
    }
}