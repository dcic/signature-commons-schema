import {fetch_cached} from '../util/fetch-cached'
import * as Ajv from 'ajv'
import draft4metaSchema from 'ajv/lib/refs/json-schema-draft-04.json'
import {promise_like_to_promise, promise_to_promise_like_boolean, promise_to_promise_like} from '../util/promise_like'
import debug from '../util/debug'

/**
 * Typescript Validator type
 */
export type Validator<T = any> = (data: Partial<T>) => Promise<T>

/**
 * ValidatorFunction module definition
 */
export interface ValidatorFunction<T extends {} = any> {
  /**
   * default export should be a function for validating
   *  the (potentially incomplete) input and returning
   *  it completely valid.
   * 
   * @param obj Potentially incomplete object
   * 
   * @returns The complete, validated object
   * 
   * @throws AssertionError, Ajv.ErrorParameters
   */
  default: Validator<T>
}

/**
 * Initialize an ajv instance
 */
export function init_ajv() {
  // Prepare ajv object with custom params/keywords
  const ajv = new Ajv({
    // Fetch schema from remote if necessary
    loadSchema: fetch_cached,
    // Support $data keyword, enables schema mutatations via instance
    $data: true,
    // Ensure we can pass context variables
    passContext: true,

    allErrors: true,
    // $comment: true,
    jsonPointers: true,
    useDefaults: true,
    verbose: true,
  })
  // Based on draft 4 meta schema
  ajv.addMetaSchema(draft4metaSchema, 'http://json-schema.org/draft-04/schema')

  /**
   * Custom `$validator` keyword, enables us to validate the object in question based on a reference
   *  unlike `$ref`, this supports arbitrary functions and works with $data to enable instance-driven validation.
   */
  ajv.addKeyword('$validator', {
    $data: true,
    async: true,
    errors: true,
    validate: function(validator: any, data: any) {
      const currentNode = JSON.stringify([data, validator])
      if(this.currentNode === currentNode) {
        // $validate should be ignored on the current element as it is currently being handled
        debug('skipped $validator.validate(' + JSON.stringify(validator) + ', ' + JSON.stringify(data) + ')')

        return true
      } else {
        // $validate should trigger another validate to process children
        debug('$validator.validate(' + JSON.stringify(validator) + ', ' + JSON.stringify(data) + ')')

        return promise_to_promise_like_boolean(
          validate.call(this, data, validator)
        )
      }
    }
  })
  return ajv
}

/**
 * Given a validator reference, resolve it into a function capable of doing a validation.
 * 
 * @param validator Function, URL, or Module path to validation function
 * 
 * @throws Ajv.ErrorParameters
 * @returns Validation function
 */
export async function get_validator(validator: string | object | Validator): Promise<Validator> {
  debug('get_validator(' + JSON.stringify(validator) + ')')

  if(Array.isArray(validator)) {
    debug('validator is array, resolving 2nd arg as context')

    this.context = validator[1]
    validator = validator[0]
  }

  if(typeof validator === 'string') {
    debug('validator is a string, resolving as pointer')

    try {
      const ret = this.ajv.getSchema(validator) as object
      if(ret !== undefined)
        validator = ret
    } catch(e) {
      debug(JSON.stringify(e))
    }
  }

  if(typeof validator === 'string') {
    debug('validator is a string, resolving as url')

    try {
      const ret = (await fetch_cached(validator)) as object
      if(ret !== undefined) {
        if(validator.endsWith('.json')) {
          validator = ret
        } else {
          validator = (<ValidatorFunction>ret).default
        }
      }
    } catch(e) {
      debug(JSON.stringify(e))
    }
  }

  if(typeof validator === 'object') {
    debug('validator is a object, converting to function (' + JSON.stringify(validator) + ')')

    validator = (await promise_like_to_promise(
      this.ajv.compileAsync({
        ...validator,
        $async: true
      }) as PromiseLike<any>
    )) as Validator
  }

  if(typeof validator !== 'function') {
    let error = 'Could not resolve validator of type ' + typeof validator
    if (typeof validator === "string"){
      error = 'Could not resolve validator ' + validator
    }
    throw {
      errors: [
        error
      ]
    } as Ajv.ErrorParameters
  }

  return validator.bind(this) as Validator
}

/**
 * Given data validate it.
 * 
 * @param data Object being validated
 * @param validator (optional) validator for which to validate against (schema, function, etc..)
 * 
 * @returns A promise to the complete object
 * @throws Ajv.ErrorParameters
 */
export async function validate<T>(data: Partial<T>, validator: any): Promise<T> {
  debug('validate(' + JSON.stringify(data) + ', ' + JSON.stringify(validator) + ')')
  // Setup context
  if(this.ajv === undefined) {
    this.ajv = init_ajv()
  }
  this.currentNode = JSON.stringify([data, validator])
  
  // Obtain validator function
  const validator_func = await get_validator.call(this,
    validator || draft4metaSchema
  )

  // Throw any errors
  if(this.ajv.errors) throw this.ajv.errors

  // Obtain results
  const result = await validator_func.call(this,
    data
  )
  // Throw any errors
  if(this.ajv.errors) throw this.ajv.errors

  // Return those results
  return result
}
