'use strict'

const defaultNodes = require('../runtime/config-nodejs.json').Bootstrap
const Multiaddr = require('multiaddr')
const promisify = require('promisify-es6')

const isMultiaddr = (ma) => Multiaddr.isMultiaddr(ma)
module.exports = function bootstrap (self) {
  return {
    list: promisify((callback) => {
      self._repo.config.get((err, config) => {
        if (err) {
          return callback(err)
        }
        callback(null, {Peers: config.Bootstrap})
      })
    }),
    add: promisify((multiaddr, args, callback) => {
      if (typeof args === 'function') {
        callback = args
        args = {default: false}
      }
      if (!isMultiaddr(multiaddr)) {
        return setImmediate(() => callback(new Error(`${multiaddr} is not a valid multiaddr`)))
      }
      self._repo.config.get((err, config) => {
        if (err) {
          return callback(err)
        }
        if (args.default) {
          config.Bootstrap = defaultNodes
        } else if (multiaddr && config.Bootstrap.indexOf(multiaddr) === -1) {
          config.Bootstrap.push(multiaddr)
        }
        self._repo.config.set(config, (err) => {
          if (err) {
            return callback(err)
          }

          callback(null, {
            Peers: args.default ? defaultNodes : [multiaddr]
          })
        })
      })
    }),
    rm: promisify((multiaddr, args, callback) => {
      if (typeof args === 'function') {
        callback = args
        args = {all: false}
      }
      if (!isMultiaddr(multiaddr)) {
        return setImmediate(() => callback(new Error(`${multiaddr} is not a valid multiaddr`)))
      }
      self._repo.config.get((err, config) => {
        if (err) {
          return callback(err)
        }
        if (args.all) {
          config.Bootstrap = []
        } else {
          config.Bootstrap = config.Bootstrap.filter((mh) => mh !== multiaddr)
        }

        self._repo.config.set(config, (err) => {
          if (err) {
            return callback(err)
          }

          const res = []
          if (!args.all && multiaddr) {
            res.push(multiaddr)
          }

          callback(null, {Peers: res})
        })
      })
    })
  }
}
