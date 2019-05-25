'use strict'

const db = require('../index');
const ObjectId = require('mongodb').ObjectID;
const sanitize = require('mongo-sanitize');

const boardClass = require('../models/board');
const error = require('../models/error');

function getMessage(socket, parameters) {
      const params = sanitize(parameters);

      db.collection('messages').findOne({_id: ObjectId(params.id)}, (err, result) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Message, err, error.messageErrors.GetMessage);
                  return;
            } else {
                  socket.emit('[Message] Get Message Success', resItems);
            }
      });
}

function getMessages(socket, parameters) {
      const params = sanitize(parameters);
      const ids = params.map(m => ObjectId(m));

      db.collection('messages').find({_id: {$in: ids}}).toArray(function(err, messages) {
            if (err) {
                  error.sendError(socket, error.typeErrors.Message, err, error.messageErrors.GetMessages);
                  return;
            } else {
                  socket.emit('[Message] Get Messages Success', messages);
            }
      });
}

function addMessage(socket, parameters) {
      const params = sanitize(parameters);

      let message = new boardClass.Message();
      message.userId = ObjectId(socket.id);
      message.priority = 0;
      message.date = new Date();
      message.text = params.text;
      message.edited = false;

      if (params.cardId !== undefined) {
            message.cardId = ObjectId(params.cardId);
      }

      db.collection('messages').insertOne(message, (err, result) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Message, err, error.messageErrors.AddMessage);
                  return;
            } else {
                  if (params.cardId !== undefined) {
                        db.collection('board-cards').updateOne({_id: ObjectId(params.cardId)}, {$push: {messages: ObjectId(result.ops[0]._id)}}, (err, res) =>{
                              if (err) {
                                    error.sendError(socket, error.typeErrors.Message, err, error.messageErrors.AddMessage);
                                    return;
                              } else {
                                    socket.emit('[Message] Add Message Success', result.ops[0]);
                              }
                        });
                  }
            }
      });
}

function updateMessage(socket, parameters) {
      const params = sanitize(parameters);

      if (params.text === undefined || params.text === '') {
            error.sendError(socket, error.typeErrors.Message, err, error.messageErrors.UpdateMessage);
            return;
      }

      db.collection('messages').updateOne({_id: ObjectId(params.id), userId: ObjectId(socket.id)}, {$set: {text: params.text, edited: true}}, (err, result) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Message, err, error.messageErrors.UpdateMessage);
                  return;
            } else if (!result) {
                  error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                  return;
            } else {
                  socket.emit('[Message] Update Message Success', params);
            }
      });
}

function deleteMessage(socket, parameters) {
      const params = sanitize(parameters);

      db.collection('messages').findOneAndDelete({_id: ObjectId(params.id), userId: ObjectId(socket.id)}, (err, result) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Message, err, error.messageErrors.DeleteMessage);
                  return;
            } else if (!result.value) {
                  error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                  return;
            } else {
                  if (result.value.cardId !== undefined) {
                        db.collection('board-cards').updateOne({_id: result.value.cardId}, {$pull: {messages: result.value._id}}, (err, res) =>{
                              if (err) {
                                    error.sendError(socket, error.typeErrors.Message, err, error.messageErrors.DeleteMessage);
                                    return;
                              } else {
                                    socket.emit('[Message] Delete Message Success', params);
                              }
                        });
                  }
            }
      });
}

module.exports = {
      getMessage,
      getMessages,
      addMessage,
      updateMessage,
      deleteMessage
};