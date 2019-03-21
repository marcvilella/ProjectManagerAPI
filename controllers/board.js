'use strict'

const db = require('../index');
const ObjectId = require('mongodb').ObjectID;
const dbhelper = require('../services/db.helper');
const sanitize = require('mongo-sanitize');

const modelBoard = require('../models/board');

function joinBoard(socket){
      socket.join(room);
}

function getBoards(socket){
      db.collection('boards').find({ 'settings.users': ObjectId(socket.id) }, { projection: { _id: 1, name: 1, modifiedAt: 1, settings: 1 } }).toArray(function(err, result) {
            if(err) console.log(err)
            else {
                  db.collection('users').findOne({_id: ObjectId(socket.id)}, {projection: { boards: 1 }}, (err,res) => {
                        if(err) console.log(err)
                        else {
                              result.forEach(board => {
                                    board.settings['starred'] = res.boards.find(m => m._id == board._id.toString()).settings.starred
                              })

                              socket.emit('[Board] Get Boards Success', result);
                        }
                  });
            }
      });
}

function getBoard(socket, id){
      db.collection('boards').findOne({_id: ObjectId(id)}, (err, result) => {
            if(err) console.log(err)
            else {
                  db.collection('users').findOne({_id: ObjectId(socket.id)}, {projection: { boards: 1 }}, (err,res) => {
                        if(err) console.log(err)
                        else {
                              result.settings['starred'] = res.boards.find(m => m._id == id).settings.starred
                              socket.emit('[Board] Get Board Success', result);
                        }
                  });
            }
      });
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

      db.collection('boards').insertOne(board, (err, result) => {
            if(err) console.log(err)
            else {
                  let newBoard = {
                        _id: ObjectId(result.ops[0]._id),
                        settings: { starred: false }
                  }

                  db.collection('users').updateMany({_id: {$in: result.ops[0].settings.users}}, {$push: {boards: newBoard}}, (err, res) =>{
                        if(err) console.log(err)
                        else {
                              socket.emit('[Board] Add Board Success', result.ops[0]);
                        }
                  });
            }
      })
}

function updateBoard(socket, parameters){

      let params = sanitize(parameters);

      let updateQuery = {};
      if(!isEmpty(params.name))
            {updateQuery['name'] = params.name}

      db.collection('boards').updateOne( { _id: ObjectId(params._id) }, 
      { $inc: {version: 1}, $currentDate: { modifiedAt: true }, $set: updateQuery}, (err, result) => {
            if(err) console.log(err)
            else {
                  if(result.matchedCount == 0)
                        console.log('No matches when updating Board: '+ params._id);
              
                  if(result.modifiedCount != 0)
                  {
                        db.collection('boards').findOne({_id: ObjectId(params._id)}, {projection: { name: 1, settings: 1, modifiedAt: 1 }}, (err, result) => {
                              if(err) console.log(err)
                              else {
                                    socket.emit('[Board] Update Board Success', result);
                              }
                        });
                  }
            }
      })
}

function updateBoardStarred(socket, parameters){

      let params = sanitize(parameters);

      db.collection('users').updateOne( {_id: ObjectId(socket.id), 'boards._id': ObjectId(params._id)}, { $set: { 'boards.$.settings.starred': params.starred }}, (err, result) => {
            if(err) console.log(err)
            else {
                  socket.emit('[Board] Update Board Starred Success', {_id: ObjectId(parameters._id), settings: {starred: params.starred}});
            }

      })
}

function addCardList(socket, parameters){

      let params = sanitize(parameters);

      let list = new modelBoard.CardList();
      

}





function isEmpty(obj) {
      for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                  return false;
      }
  
      return true;
}

function sleep(milliseconds) {
      var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
                  break;
            }
      }
}

module.exports = {
      joinBoard,
      getBoards,
      getBoard,
      addBoard,
      updateBoard,
      updateBoardStarred,
      addCardList
};