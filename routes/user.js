'use strict'

const md_auth = require('../services/jwt.service')
const UserController = require('../controllers/user');
const uploadService = require('../services/upload.service');

module.exports = function(server){
      server.post({name: 'User - Sign Up', path: '/api/auth/signup'}, (req, res, next) => UserController.signUpUser(req, res, next)),
      server.post({name: 'User - Log In', path: '/api/auth/login'}, (req, res, next) => UserController.logInUser(req, res, next)),
      server.post({name: 'User - Log Out', path: '/api/auth/logout'}, (req, res, next) =>  md_auth.ensureAuth(req, res, next), (req, res, next) => UserController.logOutUser(req, res, next)),
      server.get({name: 'User - Verify Email', path: '/api/auth/verifyemail'}, (req, res, next) => UserController.verifyEmail(req, res, next)),
      server.get({name: 'User - Return Token Info', path: '/api/auth/tokeninfo'}, md_auth.ensureAuth, (req, res, next) => UserController.tokenInfo(req, res, next)),
      server.post({name: 'User - Password Reset Request', path: '/api/auth/passwordresetrequest'}, (req, res, next) => UserController.requestPasswordReset(req, res, next)),
      server.post({name: 'User - Password Reset', path: '/api/auth/passwordreset'}, (req, res, next) => UserController.passwordReset(req, res, next)),

      server.post({name: 'Upload Attachment', path: '/api/upload'}, (req, res, next) =>  md_auth.ensureAuth(req, res, next), (req, res, next) => uploadService.uploadAttachment(req, res, next))
      server.get({name: 'Download Attachment', path: '/api/download'}, (req, res, next) =>  md_auth.ensureAuth(req, res, next), (req, res, next) => uploadService.downloadAttachment(req, res, next))
};