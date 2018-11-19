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

After setting up all relations, you can call `.transfer(NEWID)` on your documents which will transfer all related documents to a new entity.

```js
document.transfer(NEWID)
```

### Options

#### relations

Define all relations this model has to other models.

relations is an `Array` and takes `Objects` like this:

```js
{
  model: 'SomeModel', //Name of the model that has a reference to this model
  key: 'reference' //Name of the key that holds the relation. You can send an array aswell
  //(OPTIONAL)
  condition: { company: '...' } // Object that extends the mongoose query -> same style as query object in mongoose
  //OR
  condition: function(doc) { // Function which takes each document entry as a parameter and returns true or false (Promise is allowed)
    return doc.company === '...'
  }
}
```

```js
YourSchema.plugin(mongooseTransfer, {
  relations: [{ model: 'SomeOtherModel', key: 'author' }, { model: 'RandomModel', key: 'user' }],
})
```

#### debug

You can enable logging of all operations by setting `debug` to true

## License

[The MIT License](http://opensource.org/licenses/MIT)
Copyright (c) Carsten Jacobsen
