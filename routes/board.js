'use strict'

const BoardController = require('../controllers/board');

//TODO: Add JSON support
module.exports = function(sockets){
      sockets.on('connection', function(socket){
            console.log('new user')
            socket.on('join', function(room) {  
                  socket.join(room);
                  console.log(socket.id + ' has joined ' + room)
            }),
            socket.on('[Board] Get Boards', function() {  
                  BoardController.getBoards(socket)
            }),
            socket.on('[Board] Add Board', function(params){
                  BoardController.addBoard(socket, params)
            })
      })

      
      
};