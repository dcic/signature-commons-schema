import { strict as assert } from 'assert'
import { ajv, validate } from '.'

const testJSON = {
  "tests": [
    {
      "name": "simple pass",
      "valid": true,
      "schema": "meta",
      "data": {
        "$validator": "test",
        "id": 0,
        "test": "hello"
      }
    },
    {
      "name": "simple fail",
      "valid": false,
      "schema": "meta",
      "data": {
        "$validator": "test",
        "id": 0,
        "test": 5
      }
    },
    {
      "name": "deep pass",
      "valid": true,
      "schema": "meta",
      "data": {
        "$validator": "test",
        "id": 0,
        "test": "hello",
        "testDeep": {
          "$validator": "test",
          "id": 1,
          "test": "goodbye"
        }
      }
    },
    {
      "name": "deep fail",
      "valid": false,
      "schema": "meta",
      "data": {
        "$validator": "test",
        "id": 0,
        "test": "hello",
        "testDeep": {
          "$validator": "test",
          "id": 1,
          "test": 5
        }
      }
    }
  ],
  "definitions": [
    {
      "$id": "meta",
      "type": "object",
      "$validator": {
        "$comment": "Validate based on run-time property of $validator on instance",
        "$data": "0/$validator"
      },
      "properties": {
        "$validator": {
          "type": "string",
          "description": "URI to schema or module for validation of this instance"
        },
        "id": {
          "type": "number"
        }
      },
      "required": [
        "$validator",
        "id"
      ]
    },
    {
      "$id": "test",
      "type": "object",
      "allOf": [
        {
          "type": "object",
          "$validator": {
            "$comment": "Validate based on run-time property of $validator on instance",
            "$data": "0/$validator"
          },
          "properties": {
            "$validator": {
              "type": "string",
              "description": "URI to schema or module for validation of this instance"
            },
            "id": {
              "type": "number"
            }
          },
          "required": [
            "$validator",
            "id"
          ]
        },
        {
          "type": "object",
          "properties": {
            "test": {
              "type": "string"
            },
            "testDeep": {
              "type": "object",
              "$validator": {
                "$comment": "Validate based on run-time property of $validator on instance",
                "$data": "0/$validator"
              },
              "properties": {
                "$validator": {
                  "type": "string",
                  "description": "URI to schema or module for validation of this instance"
                },
                "id": {
                  "type": "number"
                }
              },
              "required": [
                "$validator",
                "id"
              ]
            }
          },
          "required": [
            "test"
          ]
        }
      ]
    }
  ]
}

describe('util', () => {
  describe('validate', () => {
    describe('standalone validation', () => {
      before(async () => {
        for(const def of testJSON.definitions) {
          ajv.addSchema({...def, $async: true})
        }
      })
      for(const test of testJSON.tests) {
        it(test.name, async () => {
          try {
            const result = await validate(<any>test.data)
            assert.equal(test.valid, true, 'Validated successfully')
          } catch(e) {
            assert.equal(test.valid, false, e)
          }
        })
      }
    })
  })
})
