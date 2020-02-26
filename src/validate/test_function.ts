import * as assert from 'assert'
import debug from '../util/debug'

export default function test_function<T extends {id?: string}>(object: Partial<T>): T {
  debug('test_function(' + JSON.stringify(object) + ')')
  assert.notStrictEqual(
    object.id,
    undefined
  )

  return object as T
}
