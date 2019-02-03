'use strict'

const UserValidator = {
      $jsonSchema: {
            bsonType: 'object',
            required: [ 'name', 'surname', 'email', 'password', 'company', 'language', 'role', 'status', 'image', 'createdAt', 'modifiedAt' ],
            properties: {
                  name: {
                        bsonType: 'string',
                        minLength: 2,
                        maxLength: 20
                  },
                  surname: {
                        bsonType: 'string',
                        minLength: 2,
                        maxLength: 40
                  },
                  email: {
                        bsonType: 'string',
                        minLength: 4   
                  },
                  password: {
                        bsonType: 'string'
                  },
                  company: {
                        bsonType: 'string'
                  },
                  language: {
                        enum: [ 'english', 'spanish' ]
                  },
                  role: {
                        enum: [ 'ROLE_USER', 'ROLE_TASK_ADMIN', 'ROLE_PROJECT_ADMIN', 'ROLE_ADMIN' ]
                  },
                  status: {
                        enum: [ 'pending', 'in progress', 'complete', 'overdue' ]
                  },
                  image: {
                        bsonType: 'string'
                  },
                  createdAt : {
                        bsonType: 'date'
                  },
                  modifiedAt : {
                        bsonType: 'date'
                  }
            }
      }
}

const User = {
      name: String,
      surname: String,
      email: String,
      password: String,
      company: String,
      language: 'english',
      role: 'ROLE_USER',
      status: 'pending',
      image: 'null',
      createdAt: Date,
      modifiedAt: Date
}

module.exports = { UserValidator, User }