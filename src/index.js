const { name } = require('../package.json')
const chalk = require('chalk')

function log(msg) {
  console.log(chalk`{yellow [${name}]} ${msg}`)
}

module.exports = function transferPlugin(schema, options) {
  if (!options || !options.relations) return log(chalk`{bold.red Error at init:} options.relations is required`)
  const { relations } = options

  if (!relations.length) return

  schema.methods.transfer = function(transferID, transferOptions = {}) {
    if (this._id.equals(transferID)) return Promise.reject(new Error('Cannot transfer to self'))

    return Promise.all(
      relations.map(relation => {
        let { model, key } = relation
        let condition = transferOptions.condition || relation.condition
        let query = {}
        key = key instanceof Array ? key : [key]
        query.$or = key.map(value => ({ [value]: this._id }))
        if (condition && typeof condition !== 'function') Object.assign(query, condition)

        return this.model(model)
          .find(query)
          .then(items => {
            if (!condition || typeof condition !== 'function') return items

            return Promise.all(
              items.map(
                item =>
                  new Promise((resolve, reject) => {
                    Promise.resolve(condition(item, model))
                      .then(result => (result ? resolve(item) : resolve(null)))
                      .catch(reject)
                  }),
              ),
            ).then(res => res.filter(Boolean))
          })
          .then(items =>
            Promise.all(
              items.map(
                item =>
                  new Promise((resolve, reject) => {
                    key.forEach(value => SetByKey(value.split('.'), item, this._id, transferID))
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

function SetByKey(path, obj, from, to) {
  if (path instanceof Array === false) return console.error('path must be an array')

  let pathClone = path.slice(0)
  let key = pathClone.shift()
  let value = obj[key]
  let isArray = value instanceof Array

  if (pathClone.length) {
    if (isArray) return value.forEach(val => SetByKey(pathClone, val, from, to))
    return SetByKey(pathClone, value, from, to)
  }

  if (isArray) {
    if (value.find(e => e.equals(to))) return (obj[key] = value.filter(entry => !entry.equals(from)))
    return (obj[key] = value.map(entry => (entry.equals(from) ? to : entry)))
  }
  if (value && value.equals && value.equals(from)) return (obj[key] = to)
}
