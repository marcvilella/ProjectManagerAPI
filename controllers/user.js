'use strict'

const errors = require('restify-errors');
const winston = require('winston');
const argon2 = require('argon2');
const sanitize = require('mongo-sanitize');

const db = require('../index');
const dbhelper = require('../services/db.helper')

const md_auth = require('../services/jwt')
const emailservice = require('../services/email.service')
const modelUser = require('../models/user');

const emailPattern = /^[a-z0-9](\.?[a-z0-9_-]){0,}@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[_!@#\$%\^&\*])(?=.{8,20})/;

function signUpUser(req, res, next){
      
      let params = sanitize(req.body);

      console.log(req.headers['x-forwarded-for'] || req.connection.remoteAddress)
      if(params.name != null && params.surname != null && params.email != null && params.password){   
            
            //Check if it a valid email
            if(!emailPattern.test(params.email))
                  return next(new errors.InvalidContentError('1: Email not valid'))
            //Check if it is a valid password
            if(!passwordPattern.test(params.password))
                  return next(new errors.InvalidContentError('2: Password not valid'))

            //Hash password and save data
            argon2.hash(params.password).then(hash => {
                  let user = modelUser.User
                  user.email = params.email;
                  user.name = params.name;
                  user.surname = params.surname;
                  user.password = hash;
                  user.createdAt = dbhelper.Timestamp();
                  user.modifiedAt = user.createdAt;

                  db.collection('users').insertOne(user, (err, result) => {
                        if(err){
                              return next(new errors.InternalError(err))
                        }
                        if(!result){
                              return next(new errors.NotFoundError('1: Error whilst saving'));
                        }
                        res.send( 200, 'Registration successful');
                        requestEmailVerification(result.ops[0]);
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
      
      //TODO: Check if ip from req = to ip from token

      let params = sanitize(req.body);
  
      if(params.email != null && params.password != null){

            //Check if it a valid email
            if(!emailPattern.test(params.email))
                  return next(new errors.InvalidContentError('1: Email not valid'))
            //Check if it is a valid password
            if(!passwordPattern.test(params.password))
                  return next(new errors.InvalidContentError('2: Password not valid'))

            db.collection('users').findOne({email: params.email.toLowerCase()}, (err, user) => {
                  console.log(user)
                  if(err){
                        return next(new errors.InternalError(err))
                  }
                  if(!user){
                        return next(new errors.NotFoundError('1: Account doesnt exist'));
                  }
                  if(user.status != 'in progress' && user.status != 'complete'){
                        return next(new errors.NotAuthorizedError('Please confirm your email'));
                  }
                  //Check password
                  argon2.verify(user.password, params.password).then(match => {
                        if(match){
                              //Devolver datos usuario logeado
                              res.send( 200, {user: {name: user.name, surname: user.surname, email: user.email}, token: md_auth.createToken(user) });
                        }
                        else{
                              return next(new errors.NotFoundError('2: Wrong password'));
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

function requestEmailVerification(user){

      let token = md_auth.createVerificationToken(user);
      let template = emailservice.Templates.EmailConfirmation;
      template.content = template.content.replace('#token', token)

      emailservice.sendEmail(user.email, template)
            
}

function verifyEmail(req, res, next){
     
      console.log(req.headers['user-agent'])

      let user = md_auth.ensureVerificationToken(req.query.id);

      if(user != false){
            db.collection('users').findOneAndUpdate({email: user.email, created_at: user.created}, {status: 'in progress'}, (err, result) => {
                  if(err){
                        return next(new errors.InternalError(err));
                  }
                  res.send( 200, {result: "Verification successful" });
            });
      }
      return next(new errors.InvalidContentError('Wrong token'));

}

function tokenInfo(req, res, next){
      res.send( 200, {user: req.user});
      next();
}

  module.exports = {
      signUpUser,
      logInUser,
      verifyEmail,
      tokenInfo
  };
