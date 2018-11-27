const { name } = require('../package.json')
const chalk = require('chalk')

function log(msg) {
  console.log(chalk`{yellow [${name}]} ${msg}`)
}

module.exports = function transferPlugin(schema, options) {
  if (!options || !options.relations) return log(chalk`{bold.red Error at init:} options.relations is required`)

  if (!options.relations.length) return

  schema.methods.transfer = function(transferID, transferOptions = {}) {
    if (this._id.equals(transferID)) return Promise.reject(new Error('Cannot transfer to self'))
    let mergedOptions = Object.assign({}, options, transferOptions)
    let relationSource = transferOptions.relations ? 'transfer' : 'plugin'
    return Promise.all(
      mergedOptions.relations.map(relation => {
        let { model, key } = relation
        let condition

        switch (relationSource) {
          case 'transfer':
            condition = relation.condition || mergedOptions.condition
            break
          case 'plugin':
            condition = transferOptions.condition || relation.condition || mergedOptions.condition
            break
        }

        let query = {}
        key = key instanceof Array ? key : [key]
        key = key.map(item => {
          if (typeof item === 'string') return { key: item, options: {} }
          return item
        })

        query.$or = key.map(value => ({ [value.key]: this._id }))
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
                    key.forEach(value => SetByKey(value.key.split('.'), item, this._id, transferID, value.options))
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

function SetByKey(path, obj, from, to, options = {}) {
  if (path instanceof Array === false) return console.error('path must be an array')

  let pathClone = path.slice(0)
  let key = pathClone.shift()
  let value = obj[key]
  let isArray = value instanceof Array

  if (pathClone.length) {
    if (isArray) return value.forEach(val => SetByKey(pathClone, val, from, to, options))
    return SetByKey(pathClone, value, from, to, options)
  }

  if (isArray) {
    let hasMatchingTo = value.find(e => e.equals(to))
    if (hasMatchingTo) options.remove = true

    if (options.remove) return (obj[key] = value.filter(entry => !entry.equals(from)))
    return (obj[key] = value.map(entry => (entry.equals(from) ? to : entry)))
  }
  if (value && value.equals && value.equals(from)) {
    if (options.remove) return (obj[key] = null)
    else return (obj[key] = to)
  }
}
