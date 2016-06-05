'use strict'

module.exports = {
  development: {
    client: 'pg',
    connection: 'postgres://node:node@localhost:5432/live',
    pool: {
      min: 0,
      max: 7
    }
  }
 }
