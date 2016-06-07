'use strict';

const Hapi = require('hapi')
const Boom = require('boom')
const Joi = require('joi')

const Users = require('./models/users')
const JWT_KEY = 'I am not engenier'
const jwt = require('jsonwebtoken')
const server = new Hapi.Server()

server.connection({ port: 3000 })

server.register(require('hapi-auth-jwt2'), (err) => {
  if(err) throw err

  function validate (jwt, request, cb){
    Users.forge({ id: jwt.id })
    .fetch()
    .then((user) => {
      if(user){
        cb(null, true, user.toJSON())
      } else {
        cb(null, false)
      }
    })
    .catch((err) => cb(err))
  }

  server.auth.strategy('jwt', 'jwt', {
    key: JWT_KEY,
    validateFunc: validate
  })
})

server.route({
  method: 'GET',
  path: '/v1/users',
  handler: (request, reply) => {
    Users.fetchAll()
    .then((user) => reply(user), (err) => reply(err))
  }
})

server.route({
  method: 'GET',
  path: '/v1/users/{id}',
  handler: (request, reply) => {
    Users.where({'id': request.params.id})
    .fetch()
    .then((user) => reply(user), (err) => reply(err))
  }
})



server.route({
  method: 'POST',
  path: '/v1/users',
  handler: (request, reply) => {
    Users.forge(request.payload)
    .save()
    .then((user) => reply(user), (err) => reply(err))
  },
  config: {
    validate: {
      payload: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        fone: Joi.string().required(),
        address: Joi.string()
      })
    }
  }
})

server.route({
  method: 'POST',
  path: '/v1/session',
  handler: (request, reply) => {
    let user

    Users.forge({ email: request.payload.email })
    .fetch({ required: true })
    .then((result) => {
      user = result
      return result.compare(request.payload.password)
    })
    .then((isValid) => {
      if(isValid){
        reply({
          token: jwt.sign({ id: user.id }, JWT_KEY)
        })
      } else {
        reply(Boom.unauthorized())
      }
    })
  },
  config: {
    validate: {
      payload: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      })
    }
  }
})

server.route({
  method: 'GET',
  path: '/v1/session',
  handler: (request, reply) => {
    reply(request.auth.credentials) 
  },
  config: {
    auth: 'jwt'
  }
})

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
