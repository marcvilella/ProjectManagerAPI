'use strict'

const fs = require('fs');
const path = require('path');
const sanitize = require('mongo-sanitize');
const IncomingForm = require('formidable').IncomingForm
const errors = require('restify-errors');

const db = require('../index');
const config = require('../config');
const ObjectId = require('mongodb').ObjectID;
const boardClass = require('../models/board');

function uploadAttachment(req, res, next) {
      const params = sanitize(req.query);
      const form = new IncomingForm();

      form.on('file', (field, file) => {
            let attachment = new boardClass.Attachment();
            attachment.userId = ObjectId(req.user.sub);
            attachment.date = new Date();
            attachment._id = ObjectId.createFromTime(attachment.date.valueOf());
            let index = file.name.lastIndexOf('.');
            if (index !==  -1) {
                  attachment.name = file.name.substring(0, index);
                  attachment.dataType = file.name.substring(index + 1);
                  attachment.reqType = file.type;
                  attachment.value = file.path.substring(file.path.lastIndexOf('\\') + 1);
            } else {
                  return next(new errors.InvalidContentError('Invalid data type'));
            }

           fs.renameSync(file.path, config.dir.attachments + attachment.value)

            db.collection('board-cards').updateOne({_id: ObjectId(params.id)}, {$push: {attachments: attachment}}, (err, res) =>{
                  if (err) {
                        return next(new errors.InvalidContentError('Invalid data type'))
                  }
            });
      })
      form.on('end', () => {
            res.json()
      });
      form.parse(req);

      next();
}

function downloadAttachment(req, res, next) {
      console.log('downloading')

      const params = sanitize(req.query);
      let filePath = path.join(config.dir.attachments, params.value);
      let stat = fs.statSync(filePath);

      console.log(params)
  
      res.writeHead(200, {
          'Content-Type': params.type,
          'Content-Length': stat.size,
          'Content-Disposition': 'attachment'
      });
  
      var readStream = fs.createReadStream(filePath);
      // We replaced all the event handlers with a simple call to readStream.pipe()
      readStream.pipe(res);

      next();
}

module.exports = {
      uploadAttachment,
      downloadAttachment
};

