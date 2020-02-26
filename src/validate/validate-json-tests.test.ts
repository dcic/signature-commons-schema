import * as assert from 'assert'
import { validate, init_ajv } from '.'
import * as glob from 'glob'
import * as path from 'path'
import debug from '../util/debug'

describe('util', () => {
  describe('validate', () => {
    describe('examples validate', () => {
      for(const examples_file of glob.sync(
        path.join(
          __dirname,
          '../../**/*.test.json',
        ),
        {
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
          ],
        }
      )) {
        describe(examples_file, () => {
          const ajv = init_ajv()
          const examples = require(examples_file)

          before(async () => {
            for(const def of (examples.definitions || [])) {
              ajv.addSchema({...def, $async: true})
            }
          })

          for(const test of examples.tests) {
            let _it
            if(test.skip === undefined) {
              _it = it
            } else {
              if (typeof test.skip === 'boolean' && test.skip === true) {
                _it = it.skip
              } else if (typeof test.skip === 'string' && eval(test.skip)) {
                _it = it.skip
              } else {
                _it = it
              }
            }
            _it(test.name, async () => {
              let success: boolean
              let error: string
              try {
                const result = await validate.call({ajv}, test.data, test.schema)
                success = true
                error = 'Successfully validated (' + JSON.stringify(result) + ')'
              } catch(e) {
                success = false
                error = JSON.stringify(e)
              }
              debug(error)
              assert.equal(test.valid, success, error)
            })
          }
        })
      }
    })
  })
})
