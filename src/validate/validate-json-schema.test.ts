import * as assert from 'assert'
import { init_ajv } from '.'
import * as glob from 'glob'
import * as path from 'path'

describe('util', () => {
  describe('validate', () => {
    describe('schemas validate', () => {
      for(const schema_file of glob.sync(
        path.join(
          __dirname,
          '../../**/*.json',
        ),
        {
          ignore: [
            '**/node_modules/**',
            '**/src/**',
            '**/*.test.json',
            '**/package.json',
            '**/package-lock.json',
          ],
        }
      )) {
        describe(schema_file, () => {
          const ajv = init_ajv()
          
          it('validates', async () => {
            assert.equal(
              ajv.validateSchema(
                require(schema_file)
              ),
              true
            )
          })
        })
      }
    })
  })
})
