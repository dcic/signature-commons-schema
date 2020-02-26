import * as assert from 'assert'
import debug from '../util/debug'

export default async function test_async_function<T extends {id?: string}>(object: Partial<T>): Promise<T> {
  debug('test_async_function(' + JSON.stringify(object) + ')')
  assert.notStrictEqual(
    object.id,
    undefined
  )

  return object as T
}
