import glob from 'glob'
export const asyncGlob = async (path: string): Promise<string[]> => await new Promise((resolve, reject) => {
  glob(path, (err, matches) => {
    if (err != null) reject(err)
    else resolve(matches)
  })
})
const mode = process.argv[2]
export const strict = mode?.includes('strict') || false
