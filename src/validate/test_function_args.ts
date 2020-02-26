import * as assert from 'assert'
import debug from '../util/debug'

interface FunctionArgs {
  active: boolean
}

export default function test_function_args<T extends {id?: string}>(object: Partial<T>): T {
  debug('test_function_args(' + JSON.stringify(object) + ', ' + JSON.stringify(this.context) + ')')

  if(this.context.active) {
    assert.notStrictEqual(
      object.id,
      undefined
    )
  }
  return object as T
}
