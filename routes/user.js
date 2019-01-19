'use strict'

const md_auth = require('../services/jwt')
const UserController = require('../controllers/user');

module.exports = function(server){

      //server.get({name: 'User - Test', path: '/api/probando-controlador'}, md_auth.ensureAuth, (req, res, next) => UserController.pruebas(req, res, next)),
      server.post({name: 'User - Sign Up', path: '/api/signup'}, (req, res, next) => UserController.signUpUser(req, res, next)),
      server.post({name: 'User - Log In', path: '/api/login'}, (req, res, next) => UserController.logInUser(req, res, next)),
      server.get({name: 'User - Verify Email', path: '/api/verifyemail'}, (req, res, next) => UserController.verifyEmail(req, res, next)),
      server.get({name: 'User - Return Token Info', path: '/api/tokeninfo'}, md_auth.ensureAuth, (req, res, next) => UserController.tokenInfo(req, res, next))
};