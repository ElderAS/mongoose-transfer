const mongoose = require('mongoose')
const Mockgoose = require('mockgoose').Mockgoose

const mockgoose = new Mockgoose(mongoose)
const Plugin = require('../src')
let UserModel, BookModel

function connectDB() {
  return mockgoose.prepareStorage().then(() => {
    return new Promise((resolve, reject) => {
      mongoose.connect(
        'mongodb://localhost:27017/mongoose-transfer-test',
        { useNewUrlParser: true },
        err => (err ? reject(err) : resolve()),
      )
    })
  })
}

function setupSchema(condition) {
  const UserSchema = new mongoose.Schema({
    name: String,
  })
  UserSchema.plugin(Plugin, {
    relations: [
      {
        model: 'Book',
        key: ['author', 'likes', 'createdBy'],
        condition,
      },
    ],
  })

  const BookSchema = new mongoose.Schema({
    name: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  })

  UserModel = mongoose.model('User', UserSchema)
  BookModel = mongoose.model('Book', BookSchema)
}

function mockData() {
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
  return Promise.all(allEntries.map(e => e.save()))
}

beforeAll(() => {
  return connectDB()
})

afterEach(() => {
  /* Cleanup DB */
  return Promise.all([UserModel.deleteMany({}), BookModel.deleteMany({})])
})

describe('Plugin', () => {
  test('All references are transfered with condition(query)', async () => {
    setupSchema({ name: 'Harry Potter 2' })
    await mockData()

    let john = await UserModel.findOne({ name: 'John Doe' })
    let jane = await UserModel.findOne({ name: 'Jane Doe' })

    await john.transfer(jane._id)

    let books = await BookModel.find()
    let hp1 = books.find(b => b.name === 'Harry Potter 1')
    let hp2 = books.find(b => b.name === 'Harry Potter 2')

    expect(hp1.author.toString()).toBe(john._id.toString())
    expect(hp1.createdBy.toString()).toBe(john._id.toString())

    expect(hp2.likes[0].toString()).toBe(jane._id.toString())

    expect(hp1.likes).toHaveLength(2)
    expect(hp2.likes).toHaveLength(1)
  })
})
