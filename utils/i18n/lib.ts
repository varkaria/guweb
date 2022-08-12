import glob from 'glob'
export const asyncGlob = async (path: string): Promise<string[]> => await new Promise((resolve, reject) => {
  glob(path, (err, matches) => {
    if (err != null) reject(err)
    else resolve(matches)
  })
})
