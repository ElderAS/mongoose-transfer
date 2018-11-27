const mongoose = require('mongoose')
const Plugin = require('../src')
let UserModel, BookModel, ArticleModel

beforeAll(() => {
  const UserSchema = new mongoose.Schema({
    name: String,
  })
  UserSchema.plugin(Plugin, {
    relations: [
      {
        model: 'Book',
        key: ['author', 'likes', 'createdBy'],
      },
      {
        model: 'Article',
        key: ['author', 'likes', 'createdBy'],
      },
    ],
  })

  const BookSchema = new mongoose.Schema({
    name: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  })

  const ArticleSchema = new mongoose.Schema({
    name: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  })

  UserModel = mongoose.model('User', UserSchema)
  BookModel = mongoose.model('Book', BookSchema)
  ArticleModel = mongoose.model('Article', ArticleSchema)
})

beforeEach(() => {
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
  let articles = [
    new ArticleModel({
      name: 'How to test',
      author: john_draft._id,
      likes: [john_draft._id, jane_draft._id],
      createdBy: john_draft._id,
    }),
  ]
  let allEntries = [...users, ...books, ...articles]
  return Promise.all(allEntries.map(e => e.save()))
})

describe('Transfer (options)', () => {
  test('All references via options are transfered', async () => {
    let john = await UserModel.findOne({ name: 'John Doe' })
    let jane = await UserModel.findOne({ name: 'Jane Doe' })

    await john.transfer(jane._id, {
      relations: [
        {
          model: 'Book',
          key: ['author'],
        },
      ],
    })

    let books = await BookModel.find()
    let hp1 = books.find(b => b.name === 'Harry Potter 1')
    let hp2 = books.find(b => b.name === 'Harry Potter 2')

    let article = await ArticleModel.findOne()

    expect(hp1.author.toString()).toBe(jane._id.toString())
    expect(hp1.createdBy.toString()).toBe(john._id.toString())
    expect(hp1.likes).toHaveLength(2)

    expect(hp2.author.toString()).toBe(jane._id.toString())
    expect(hp2.createdBy.toString()).toBe(jane._id.toString())
    expect(hp2.likes).toHaveLength(2)

    expect(article.author.toString()).toBe(john._id.toString())
    expect(article.createdBy.toString()).toBe(john._id.toString())
    expect(article.likes).toHaveLength(2)
  })

  test('Key should be configurable via options (remove)', async () => {
    let john = await UserModel.findOne({ name: 'John Doe' })
    let jane = await UserModel.findOne({ name: 'Jane Doe' })

    await john.transfer(jane._id, {
      relations: [
        {
          model: 'Book',
          key: ['author', { key: 'createdBy', options: { remove: true } }],
        },
      ],
    })

    let books = await BookModel.find()
    let hp1 = books.find(b => b.name === 'Harry Potter 1')
    let hp2 = books.find(b => b.name === 'Harry Potter 2')
    let article = await ArticleModel.findOne()

    expect(hp1.author.toString()).toBe(jane._id.toString())
    expect(hp2.author.toString()).toBe(jane._id.toString())
    expect(hp1.createdBy).toBeFalsy()
    expect(hp2.createdBy.toString()).toBe(jane._id.toString())

    expect(article.author.toString()).toBe(john._id.toString())
    expect(article.createdBy.toString()).toBe(john._id.toString())

    expect(hp1.likes).toHaveLength(2)
    expect(article.likes).toHaveLength(2)
    expect(hp2.likes).toHaveLength(2)
  })
})
