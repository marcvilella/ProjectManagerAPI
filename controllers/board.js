'use strict'

const db = require('../index');
const ObjectId = require('mongodb').ObjectID;
const dbhelper = require('../services/db.helper');
const sanitize = require('mongo-sanitize');

const modelBoard = require('../models/board');

function sleep(milliseconds) {
      var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
                  break;
            }
      }
}

function joinBoard(socket){
      socket.join(room);
}

function getBoards(socket){
      socket.emit('test', 'Prueba')
      db.collection('boards').find({}, { projection: { _id: 1, name: 1 } }).toArray(function(err,result) {
            if(err) console.log(err)
            else {
                  socket.emit('[Board] Get Boards Success', result);
            }
      });
}

function addBoard(socket, parameters){
      
      let params = sanitize(parameters);

      // db.collection('users').findOne({}, { projection: { _id: 1 } }).then(function(result) {
      //       console.log(result._id)
      //       let board2 = new modelBoard.Board();
      //       board2.settings.users.push(result._id)
      //       console.log(board2)
      // });

      let board = new modelBoard.Board();
      board.name = params.name;
      board.settings.mode = params.settings.mode;
      board.settings.colorLight = params.settings.color.colorLight;
      board.settings.colorDark = params.settings.color.colorDark;
      params.settings.users.forEach(entry => board.settings.users.push(ObjectId(entry)));
      board.createdAt = dbhelper.Timestamp();
      board.modifiedAt = board.createdAt;
      board.version = 1;
      
      db.collection('boards').insertOne(board, {}, (err, result) => {
            if(err) console.log(err) 
            else {
                  socket.emit('[Board] Add Board Success', result.ops[0]);
            }
      })
}
    
    



module.exports = {
      joinBoard,
      getBoards,
      addBoard
};