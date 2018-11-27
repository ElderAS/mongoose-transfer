const mongoose = require('mongoose')
const Mockgoose = require('mockgoose').Mockgoose
const mockgoose = new Mockgoose(mongoose)

beforeAll(() => {
  return mockgoose.prepareStorage().then(() => {
    return new Promise((resolve, reject) => {
      mongoose.connect(
        'mongodb://localhost:27017/mongoose-transfer-test',
        { useNewUrlParser: true },
        err => (err ? reject(err) : resolve()),
      )
    })
  })
})

afterEach(() => {
  return mockgoose.helper.reset()
})

afterAll(async () => {
  try {
    const { connections } = mongoose
    const { childProcess } = mockgoose.mongodHelper.mongoBin
    childProcess.kill()
    await Promise.all(connections.map(c => c.close()))
    await mongoose.disconnect()
  } catch (err) {
    console.log('Error in afterAll : ', err)
  }
})
