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
      db.collection('boards').find({}, { projection: { _id: 1, name: 1 } }).toArray(function(err, result) {
            if(err) console.log(err)
            else {
                  socket.emit('[Board] Get Boards Success', result);
            }
      });
}

function getBoard(socket, id){
      if(id == 'NaN'){
            db.collection('boards').findOne({}, (err, result) => {
                  if(err) console.log(err)
                  else {
                        socket.emit('[Board] Get Board Success', result);
                  }
            });
      }
      else{
            db.collection('boards').findOne({_id: ObjectId(id)}, (err, result) => {
                  if(err) console.log(err)
                  else {
                        socket.emit('[Board] Get Board Success', result);
                  }
            });
      }
}

function addBoard(socket, parameters){
      
      let params = sanitize(parameters);

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
                  db.collection('users').find
            }
      })
}

function addCardList(socket, parameters){

      let params = sanitize(parameters);

      let list = new modelBoard.CardList();
      list.na

}
    
    



module.exports = {
      joinBoard,
      getBoards,
      getBoard,
      addBoard,
      addCardList
};