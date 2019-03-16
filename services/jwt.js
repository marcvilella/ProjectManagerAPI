'use strict'

const errors = require('restify-errors');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const winston = require('winston');

//Certs for Authenticatiomn Tokens
const auth_cert_priv = fs.readFileSync('PM_API_private_key.pem');
const auth_cert_public = fs.readFileSync('PM_API_public_key.pem');
//Certs for verification email Tokens
const emailVer_cert_priv = fs.readFileSync('PM_API_private_key.pem');
const emailVer_cert_public = fs.readFileSync('PM_API_public_key.pem');

//JSON

function createToken (user){
      return jwt.sign({
            sub: user._id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            role: user.role
      }, auth_cert_priv, { algorithm: 'RS256', expiresIn: '7d' });
};

function ensureAuth (req, res, next){
      console.log(req.headers)
      console.log(req.headers.authorization)
      console.log(req.body)
      if(!req.headers.authorization){
          return next(new errors.NetworkAuthenticationRequiredError('Authentication header needed'));
      }
  
      let token = req.headers.authorization.replace(/['"']+/g, '').replace('Bearer ','');

      jwt.verify(token, auth_cert_public, function(err, decoded) {
            if(err){
                  return next((new errors.InternalError(err)));
            }
            req.user = decoded;
      });

      next();
};

function createVerificationToken (user){
      return jwt.sign({
            name: user.name,
            surname: user.surname,
            email: user.email,
            modifiedAt: user.modifiedAt
      }, emailVer_cert_priv, { algorithm: 'RS256', expiresIn: '1d' });
}

function ensureVerificationToken (token){  

      try{ 
            token = token.replace(/['"']+/g, '');
            return jwt.verify(token, emailVer_cert_public);
      }
      catch{
            return false;
      }
};

//SocketIO

function ensureAuthForConnection (token){
  
      try{
            jwt.verify(token, auth_cert_public);
            return true;
      }
      catch{
            return false;
      }

};

module.exports = {
      createToken,
      ensureAuth,
      createVerificationToken,
      ensureVerificationToken,

      ensureAuthForConnection
}
