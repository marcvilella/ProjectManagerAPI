'use strict'

const fs = require("fs");
const nodemailer = require('nodemailer');
const dirTemplates = __dirname.substring(0, __dirname.lastIndexOf('\\')) + '/email-templates';
const url = 'http://localhost:4200/';

/**
 ** Service Creation
 */

const mailer = nodemailer.createTransport({
      service: 'gmail',
      auth: {
            user: 'marcvimu2@gmail.com',
            pass: 'Marc1996'
      }
});

function sendEmail(toEmail, template){

      const email = {
            from: 'marcvimu2@gmail.com',
            to: toEmail,
            subject: template.subject,
            html: template.content,
            attachments: [{
                  filename: 'icon.png',
                  path: 'icon.png',
                  cid: 'unique@icon' 
            }]
      }

      mailer.sendMail(email, function(error, info){
            if (error) {
                  console.log(error);
            } else {
                  console.log('Email sent: ' + info.response);
            }
      }); 
}

/**
 ** Templates
 */



const EmailConfirmation = {
      'en': {
            'subject': 'Confirm your account',
            'content': fs.readFileSync( dirTemplates + '/sign-up/en.html').toString()
      },
      'es': {
            'subject': 'Confirme su cuenta',
            'content': fs.readFileSync( dirTemplates + '/sign-up/es.html').toString()
      }
}

const PasswordResetRequest = {
      'en': {
            'subject': 'Recover your account',
            'content': fs.readFileSync( dirTemplates + '/password-request/en.html').toString()
      },
      'es': {
            'subject': 'Recover your account',
            'content': fs.readFileSync( dirTemplates + '/password-request/es.html').toString()
      }
}

const Templates = Object.freeze({
      'EmailConfirmation': EmailConfirmation,
      'PasswordResetRequest': PasswordResetRequest
});

module.exports = {
      sendEmail,
      Templates
}