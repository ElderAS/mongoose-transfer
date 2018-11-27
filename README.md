# mongoose-transfer

[![Build Status](https://travis-ci.org/ElderAS/mongoose-transfer.svg?branch=master&style=flat-square)](https://travis-ci.org/ElderAS/mongoose-transfer)
[![npm](https://img.shields.io/npm/dt/mongoose-transfer.svg?style=flat-square)](https://www.npmjs.com/package/mongoose-transfer)
[![npm](https://img.shields.io/npm/v/mongoose-transfer.svg?style=flat-square)](https://www.npmjs.com/package/mongoose-transfer)

[Mongoose](http://mongoosejs.com/) plugin to transfer references to a new document by calling [document].transfer(newID)

### Installation

`npm install --save mongoose-transfer`

### Usage

```js
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseTransfer = require('mongoose-transfer')

let YourSchema = new Schema({
  title: String,
  description: String,
  author: String,
})

YourSchema.plugin(mongooseTransfer, {
  relations: [{ model: 'SomeOtherModel', key: 'author', condition: { company: '...' } }],
  debug: true, // Default: false -> If true operations are logged out in your console
})

let Model = mongoose.model('YourSchema', YourSchema)
```

After setting up all relations, you can call `.transfer(NEWID, OPTIONS)` on your documents which will transfer all related documents to a new entity.

```js
document.transfer(NEWID, OPTIONS)
```

### Methods

#### transfer

This plugin adds a method `.transfer` to the schema. Call `.transfer` to run a reference transfer

This function takes 2 parameters:

| Parameter no. | Type     | Description                                               |
| ------------- | -------- | --------------------------------------------------------- |
| 1             | ObjectId | ObjectId which matching documents should be transfered to |
| 2             | Object   | Options (see info below)                                  |

**Example**

```js
user.transfer('NEWID', {
  condition: { company: '...' },
})
```

### Options

#### condition

Define under which conditions transfer can take place.
Accepts an object (mongoose query) or a function executed on each document

```js
{
  condition: { "name": { $ne: "Mark" } }
}
```

```js
{
  condition: function(doc, model) {
    console.log(model) // -> e.g. "User"
    return doc.name !== 'Mark'
  }
}
```

#### relations

Define all relations this model has to other models.
relations is an `Array` and takes `Objects` like this:

| Prop        | Type                | Description                                                           |
| ----------- | ------------------- | --------------------------------------------------------------------- |
| `model`     | String              | Name of the registered mongoose model                                 |
| `condition` | See condition above | Overrides the condition on document level                             |
| `key`       | String/Object/Array | Define which props that contain references. See `relations.key` below |

**Examples**

```js
{
  model: 'SomeModel',
  key: 'reference',
  condition: { company: '...' }
}
```

```js
{
  model: 'SomeModel',
  key: ['something.nested', { key: 'reference', options: { remove: true } }]
  condition: function(doc, model) {
    return doc.company === '...'
  }
}
```

#### relations.key

Define where the reference is located inside the document. Allows dotnotation ("some.deep.key").

`relations.key` can be an `Array` for multiple references inside one document or `String/Object` for single references inside one document.

Key can be defined in the following ways:

| Type   | Example                                    | Description                              |
| ------ | ------------------------------------------ | ---------------------------------------- |
| String | `some.deep.key`                            | Simpel string selector (dotnotation)     |
| Object | `{ key: "some.deep.key", options: {...} }` | Defining it as objects allow for options |

**Key options**

Keys allow the following options:

| Prop   | Type      | Description                                                           |
| ------ | --------- | --------------------------------------------------------------------- |
| remove | `Boolean` | Set to true if you want to remove the relation instead of transfering |

```js
{
  model: 'SomeModel',
  key: [
    'something.nested',
    { key: 'reference', options: { remove: true } }
  ]
}
```

#### debug

You can enable logging of all operations by setting `debug` to true

## License

[The MIT License](http://opensource.org/licenses/MIT)
Copyright (c) Carsten Jacobsen
