[![](https://img.shields.io/npm/v/@maayanlab/signature-commons-schema.svg)](https://www.npmjs.com/package/@maayanlab/signature-commons-schema) [![](https://img.shields.io/npm/l/@maayanlab/signature-commons-schema.svg)](https://www.apache.org/licenses/LICENSE-2.0)

# Signature Commons Schema

JSON-Schema validators for signature commons entities. Designed to allow one to flexibly validate arbitrary metadata in the signature commons database.

## Installation
```bash
npm install --save @maayanlab/signature-commons-schema
```

### Usage
```ts
import { validate } from '@maayanlab/signature-commons-schema'
validate({your_object})
```

### CLI
```bash
(
  # Parse and put json on single line
  jq -c '.' << EOF
{
  "your": "json"
}
EOF
  # Run it through the validator (with verbose debugging; otherwise omit DEBUG)
) | DEBUG=signature-commons-schema signature-commons-schema your_validator
# stdout    -- the valid json(s)
# stderr    -- any errors
# exit code -- the number of errors
```
s
## Project Layout
- `core/`: Fundamental schemas which define how the schemas should even be used
  - `meta.json`: JSON-LD style constraints
  - `library.json`, `signature.json`, `entity.json`: Primary signature common primitives, they expose `meta` as an instance of `meta.json`
  - `examples.json`: Schema example tests structure
- `meta/`: Meta schemas designed for the respective primary signature common primitive meta fields.
- `src`: Validator built with https://github.com/epoberezkin/ajv

## Discussion
At the most basic level, a given instance should reference the validation context which it implements.

Given an abstract concept, we can write a validator for it:
```json
{
  "$id": "myimportantconcept.json",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "description": "My important concept",
  "allOf": [
    {
      "$ref": "core/meta.json"
    },
    {
      "type": "object",
      "properties": {
        "my_important_field": {
          "type": "string",
          "description": "My important description"
        }
      },
      "required": [
        "my_important_field"
      ]
    }
  ]
}
```

Meta here enforces the constraint of the `$validator` definition, which references the abstract validation. Now we can write any number of instances for our concept.
```json
{
  "$validator": "myimportantconcept.json",
  "my_important_field": "my_important_value"
}
```

We can validate that this is true by grabbing the `$validator` file and validating the json itself.
```ts
import {validate} from '@maayanlab/signature-commons-schema/validate'
validate(data)
```

The `$validator` here is therefore doubling as semantic meaning, as described in the descriptions, and computational validation. Better yet, this allows us to support self-described objects, which is how we can deal with arbitrary metadata.

```json
{
  "$validator": "core/signature.json",
  "meta": {
    "$validator": "meta/signature/gene.json",
    ...all the gene signature relevant metadata
  },
  "values": {
    "entity": "id",
    "value": "val"
  }
}
```

`meta/signature/gene.json` then is capable of defining the specifics of the metadata implementation, potentially as a subset of other metadata.

```json
{
  "$id": "meta/signature/gene.json",
  "allOf": [
    {
      "$ref": "meta/signature/common.json"
    },
    {
      "type": "object",
      "properties": {
        ...gene specific signature properties
      }
    }
  ]
}
```

This repository has examples and tests which should be re-used to validate that APIs and Databases as part of the signature commons are serving and consuming data which follows this same approach. The actual schemas can be stored and referenced from this repository as they are public, persistent, and versioned.
