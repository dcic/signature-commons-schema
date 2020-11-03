import * as glob from 'glob'
import * as path from 'path'
import * as fs from 'fs'
import * as mkdirp from 'mkdirp'

// const { apiVersion } = require('root-require')('package.json')
const { apiVersion } = require('pjson')

export function makeTemplate(
  templateString: string,
  templateVariables: any
): string {
  const keys = Object.keys(templateVariables).map((key) => key.replace(/ /g, '_'))
  const values = Object.values(templateVariables)
  let templateFunction = new Function(...keys, `return \`${templateString}\`;`)
  try {
    return templateFunction(...values)
  } catch (error) {
    return 'undefined'
  }
}

(async () => {
  for(const schema_file of glob.sync(
    path.join(
      __dirname,
      '../src/**/*.json',
    ),
    {
      ignore: [
        '**/dist/**'
      ],
    }
  )) {
    try {
      const dir = path.join('dist',
        path.relative('.',
          path.dirname(
            schema_file
              .replace('src/schemas', '..')
              .replace('src', '.')
          )
        )
      )
      const filename = path.join(dir, path.basename(schema_file))

      mkdirp.sync(dir)
      fs.writeFileSync(
        filename,
        makeTemplate(
          fs.readFileSync(schema_file).toString(),
          { API_VERSION: apiVersion }
        )
      )
    } catch(e) {
      console.error(`[${schema_file}]: ${e}`)
    }
  }
})()
