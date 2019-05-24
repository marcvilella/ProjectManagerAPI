'use strict'

const UserValidator = {
      $jsonSchema: {
            bsonType: 'object',
            required: [ 'name', 'surname', 'email', 'password', 'company', 'position','language', 'role', 'status', 'image', 'createdAt', 'modifiedAt' ],
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
                  position: {
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

class User {
      constructor() {
            this.name = String;
            this.surname= String;
            this.email = String,
            this.password = String,
            this.company = String,
            this.position = String,
            this.language = 'english',
            this.role = 'ROLE_USER',
            this.status = 'pending',
            this.image = 'null',
            this.boards = [];
            this.createdAt = Date,
            this.modifiedAt = Date
      }
}

module.exports = { UserValidator, User }