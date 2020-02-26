import { compileFromFile } from 'json-schema-to-typescript'
import { fetch_cached } from '../src/util/fetch-cached'
import * as glob from 'glob'
import * as path from 'path'
import * as fs from 'fs'
import * as mkdirp from 'mkdirp'

(async () => {
  for(const schema_file of glob.sync(
    path.join(
      __dirname,
      '../**/*.json',
    ),
    {
      ignore: [
        '**/*.test.json',
        '**/bin/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/package-lock.json',
        '**/package.json',
        '**/src/**',
        '**/tsconfig.json',
        '**/tslint.json',
      ],
    }
  )) {
    try {
      const dir = path.join('dist',
        path.relative('.', path.dirname(schema_file))
      )

      mkdirp.sync(dir)
      fs.writeFileSync(
        path.join(
          dir,
          path.basename(schema_file, '.json') + '.d.ts'
        ),

        await compileFromFile(schema_file, {
          $refOptions: {
            resolve: {
              external: true,
              http: {
                read: (file) => fetch_cached(file.url)
              },
              file: {
                read: (file) => fetch_cached(file.url)
              },
            }
          }
        })
      )
    } catch(e) {
      console.error(`[${schema_file}]: ${e}`)
    }
  }
})()
