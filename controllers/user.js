'use strict'

//#region  Imports

const errors = require('restify-errors');
const winston = require('winston');
const argon2 = require('argon2');
const sanitize = require('mongo-sanitize');
const async = require('async');

const db = require('../index');
const ObjectId = require('mongodb').ObjectID;
const helper = require('../services/helper.service')
const error = require('../models/error');

const md_auth = require('../services/jwt.service')
const emailservice = require('../services/email.service')
const modelUser = require('../models/user');

//#endregion

//#region HTTP

function signUpUser(req, res, next){
      
      let params = sanitize(req.body);

      if(params.name != null && params.surname != null && params.email != null && params.password != null){   
            
            //Check if it a valid email
            if(!helper.emailPattern.test(params.email))
                  return next(new errors.InvalidContentError('1: Email not valid'))
            //Check if it is a valid password
            if(!helper.passwordPattern.test(params.password))
                  return next(new errors.InvalidContentError('2: Password not valid'))

            //Hash password and save data
            argon2.hash(params.password).then(hash => {
                  let user = new modelUser.User();
                  user.email = params.email;
                  user.name = params.name;
                  user.surname = params.surname;
                  user.password = hash;
                  user.company = params.company;
                  user.position = null;
                  user.language = params.language;
                  user.createdAt = helper.getTimestamp();
                  user.modifiedAt = user.createdAt;

                  db.collection('users').insertOne(user, (err, result) => {
                        if(err)
                              return next(new errors.UnauthorizedError(err))
                        if(!result)
                              return next(new errors.ResourceNotFoundError('1: Error whilst saving'));

                        res.send( 200, 'Registration successful');

                        let token = md_auth.createVerificationToken(result.ops[0]);
                        let template = emailservice.Templates.EmailConfirmation[result.ops[0].language];
                        template.content = template.content.replace('#token', token);
                  
                        emailservice.sendEmail(user.email, template);

                        return next();
                  });
            }).catch(err => {
                  return next(new errors.InternalError(err));
            });
      }
      else{
            return next(new errors.MissingParameterError('Insert all parameters'));
      }
}
  
function logInUser(req, res, next){
      
      let params = sanitize(req.body);
      console.log('Log in - User: ' + params.email)

      if(params.email != null && params.password != null){

            //Check if it a valid email
            if(!helper.emailPattern.test(params.email))
                  return next(new errors.InvalidContentError('1: Email not valid'))
            //Check if it is a valid password
            if(!helper.passwordPattern.test(params.password))
                  return next(new errors.InvalidContentError('2: Password not valid'))

            db.collection('users').findOne({email: params.email.toLowerCase()}, (err, user) => {
                  if(err){
                        return next(new errors.InternalError(err))
                  }
                  if(!user){
                        return next(new errors.ResourceNotFoundError('Account doesnt exist'));
                  }
                  if(user.status != 'in progress' && user.status != 'complete'){
                        return next(new errors.NotAuthorizedError('Please confirm your email'));
                  }
                  //Check password
                  argon2.verify(user.password, params.password).then(match => {
                        if(match){
                              //Devolver datos usuario logeado
                              res.send( 200, {user: {name: user.name, surname: user.surname, email: user.email}, token: md_auth.createToken(user) });
                              return next();
                        }
                        else{
                              return next(new errors.InvalidContentError('Wrong password'));
                        }
                  }).catch(err => {
                        return next(new errors.InternalError(err));
                  });
            });
      }
      else{
            return next(new errors.MissingParameterError('Insert all parameters')); 
      }
}

function logOutUser(req, res, next){
      
      console.log(req)
      let params = sanitize(req.body);
  
      //TODO: Crear sesion en log in y borrarla

      res.send(200, 'OK')
      next();
}

function verifyEmail(req, res, next){

      let user = md_auth.ensureVerificationToken(req.query.code);

      if(user != false){
            db.collection('users').findOneAndUpdate({email: user.email, created_at: user.created}, {$set: {status: 'in progress'}}, (err, result) => {
                  if(err){
                        return next(new errors.InternalError(err));
                  }
                  res.send( 200, "Verification successful");
            });
            return next();            
      }
      else
            return next(new errors.InvalidContentError('Wrong token'));

}

function tokenInfo(req, res, next){
      res.send( 200, {user: req.user});
      next();
}

function requestPasswordReset(req, res, next){
      
      let params = sanitize(req.body);

      db.collection('users').findOne({email: params.email},{projection: {name: 1, surname: 1, email:1, language: 1, modifiedAt: 1}}, (err, user) => {
            console.log(err)
            console.log(user)
            
            if(err)
                  return next(new errors.InternalError(err))
            if(!user)
                  return next(new errors.ResourceNotFoundError('Account does not exist'));
            
            let fullname = user.name + ' ' + user.surname;
            if(fullname.localeCompare(params.fullname) == 0){
                  let token = md_auth.createVerificationToken(user);
                  let template = emailservice.Templates.PasswordResetRequest[user.language];
                  
                  template.content = template.content.replace('#token', token);
                  emailservice.sendEmail(user.email, template);

                  res.send( 200, 'Password request successful');
                  return next();
            }
            else
                  return next(new errors.InvalidContentError('Data and account does not match'));
      });      
}

function passwordReset(req, res, next){
      
      let params = sanitize(req.body);

      let usertoken = md_auth.ensureVerificationToken(params.token);
      if(usertoken == null)
            return next(new errors.NotAuthorizedError('1: Invalid token'));

      //Check if it is a valid password
      if(!helper.passwordPattern.test(params.password))
            return next(new errors.InvalidContentError('2: Password not valid'))

      //Hash password and update password
      argon2.hash(params.password).then(hash => {
            db.collection('users').findOne({email: usertoken.email},(err, user)=>{
                  if(err)
                        return next(new errors.InternalError(err))
                  if(!user)
                        return next(new errors.ResourceNotFoundError('Account does not exist'));

                  if(user.modifiedAt == usertoken.modifiedAt)
                        db.collection('users').findOneAndUpdate({_id: user._id}, {$set: {password: hash, modifiedAt: helper.getTimestamp()}}, (err, result) => {
                              if(err)
                                    return next(new errors.InternalError(err))
                              if(result.value == null)
                                    return next(new errors.ResourceNotFoundError('Account does not exist'));
                              
                              res.send( 200, 'Password changed successfully');
                              return next();
                        })
                  else
                        return next(new errors.NotAuthorizedError('Invalid token'));
            });
      }).catch(err => {
            return next(new errors.InternalError(err));
      });
}

//#endregion

//#region Socket.Io

function getCurrentUser(socket){
      db.collection('users').findOne({_id: ObjectId(socket.id)}, {projection: {password: 0, status: 0, image: 0, createdAt: 0, modifiedAt: 0}}, (err,result) => {
            if(err) console.log(err)
            else {
                  socket.emit('[User] Get Current User Success', result);
            }
      });
}

function getUsersByBoardId(socket, parameters) {

      const params = sanitize(parameters);

      db.collection('boards').findOne({_id: ObjectId(params.id)}, (err, resBoard) => {
            if (err) {
                  return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
            } else if (resBoard) {

                  const users = [];

                  async.each(resBoard.settings.users, function iteratee(userId, callback) {
                        db.collection('users').findOne({_id: userId}, {projection: { name: 1, surname:1, company: 1, position:1, email: 1, boards: 1 }}, (err, user) => {
                              if (err) {
                                    callback(err);
                              } else {
                                    if (socket.id !== user._id.toString()) {
                                          user.boards = user.boards.filter(m => m._id.toString() === params.id);
                                    }
                                    users.push(user);
                                    callback();
                              }
                        })}, function(err) {
                              if(err) {
                                    error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
                                    return;
                              } else {
                                    socket.emit('[User] Get Users By Board Success', users); 
                              }
                        }
                  );
            }
      });
}

function getUsers(socket, parameters){
      db.collection('users').find({}, { projection: { _id: 1, name: 1 } }).toArray(function(err,result) {
            if(err) console.log(err)
            else {
                  socket.emit('[User] Get Users Success', result);
            }
      });
}

function updateUserBoardPermission(socket, parameters) {
      const params = sanitize(parameters);

      helper.checkBoardPermissions(socket.id, params.id, 1).then(result => {
            if (!result) {
                  error.sendError(socket, error.typeErrors.User, 'Socket user does not have permissions', error.userErrors.Permission);
                  return;
            } else {
                  db.collection('users').updateOne( {_id: ObjectId(params.userId), 'boards._id': ObjectId(params.id)}, { $set: { 'boards.$.settings.role': params.role }}, (err, result) => {
                        if(err) {
                              error.sendError(socket, error.typeErrors.User, err, error.userErrors.UpdateUserBoardPermission);
                              return;
                        } else {
                              socket.emit('[User] Update User Board Permission Success', params);
                        }
                  });
            }
      });
}

//#endregion

module.exports = {
      signUpUser,
      logInUser,
      logOutUser,
      verifyEmail,
      tokenInfo,
      requestPasswordReset,
      passwordReset,

      getCurrentUser,
      getUsersByBoardId,
      getUsers,
      updateUserBoardPermission
};
