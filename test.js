;(async function() {
  const mongoose = require('mongoose')
  const Plugin = require('./src')

  /* Connect to DB */
  mongoose.connect(
    'mongodb://localhost:27017/mongoose-transfer-test',
    err => {
      err ? console.error(`${err.name}: ${err.message}`) : console.log('Database connected - √')
    },
  )

  /* Setup sample schemas */
  const UserSchema = new mongoose.Schema({
    name: String,
  })
  UserSchema.plugin(Plugin, {
    relations: [
      {
        model: 'Book',
        key: ['author', 'likes', 'createdBy'],
        condition: doc => doc.name === 'Harry Potter 1',
      },
    ],
    debug: true,
  })

  const BookSchema = new mongoose.Schema({
    name: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  })

  const UserModel = mongoose.model('User', UserSchema)
  const BookModel = mongoose.model('Book', BookSchema)

  /* Cleanup DB */
  await UserModel.deleteMany({})
  await BookModel.deleteMany({})

  /* Insert examples */
  let users = [new UserModel({ name: 'John Doe' }), new UserModel({ name: 'Jane Doe' })]
  let [john_draft, jane_draft] = users
  let books = [
    new BookModel({
      name: 'Harry Potter 1',
      author: john_draft._id,
      likes: [john_draft._id, jane_draft._id],
      createdBy: john_draft._id,
    }),
    new BookModel({
      name: 'Harry Potter 2',
      author: jane_draft._id,
      likes: [john_draft._id, jane_draft._id],
      createdBy: jane_draft._id,
    }),
  ]
  let allEntries = [...users, ...books]
  let [john, jane, hp1, hp2] = await Promise.all(allEntries.map(e => e.save()))

  /* Execute tests */
  await john.transfer(jane._id)

  /* Exit */
  console.log('Everything has run!')
  process.exit(0)
})()
