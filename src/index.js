const { name } = require('../package.json')
const chalk = require('chalk')

function log(msg) {
  console.log(chalk`{yellow [${name}]} ${msg}`)
}

module.exports = function transferPlugin(schema, options) {
  if (!options || !options.relations) return log(chalk`{bold.red Error at init:} options.relations is required`)
  const { relations } = options

  if (!relations.length) return

  schema.methods.transfer = function(transferID) {
    return Promise.all(
      relations.map(({ model, key }) => {
        let query = {}
        key = key instanceof Array ? key : [key]
        key.forEach(value => (query[value] = this._id))

        return this.model(model)
          .find(query)
          .then(items =>
            Promise.all(
              items.map(
                item =>
                  new Promise((resolve, reject) => {
                    key.forEach(value => SetByKey(value.split('.'), item, transferID, val => val.equals(this._id)))
                    item.save(err => {
                      if (err) {
                        if (options.debug) log(chalk`{bold.red Error at transfer:} ${model} ${item.id}`)
                        return reject(err)
                      }

                      if (options.debug) log(chalk`{bold.green Transfered:} ${model} ${item.id}`)
                      return resolve(item)
                    })
                  }),
              ),
            ),
          )
      }),
    )
  }
}

function SetByKey(path, obj, result, condition) {
  if (path instanceof Array === false) return console.error('path must be an array')
  let pathClone = path.slice(0)
  let cPath = pathClone.shift()
  if (pathClone.length) {
    let value = obj[cPath]
    if (value instanceof Array) value.forEach(val => SetByKey(pathClone, val, result, condition))
    else SetByKey(pathClone, value, result, condition)
  } else {
    let execute = true
    if (condition) execute = condition(obj[cPath])
    if (execute) obj[cPath] = result
  }
}
