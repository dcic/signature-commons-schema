import * as glob from 'glob'
import * as path from 'path'
import * as fs from 'fs'
import * as mkdirp from 'mkdirp'
import { apiVersion } from '../package.json'

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
      '../src/schemas/**/*.json',
    ),
    {
      ignore: [
        '**/bin/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/package-lock.json',
        '**/package.json',
        '**/tsconfig.json',
        '**/tslint.json',
      ],
    }
  )) {
    try {
      const dir = path.relative('src/schemas', path.dirname(schema_file))

      mkdirp.sync(dir)
      fs.writeFileSync(
        path.join(
          dir,
          path.basename(schema_file)
        ),
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
