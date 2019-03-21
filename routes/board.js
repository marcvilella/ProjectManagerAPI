'use strict'

const BoardController = require('../controllers/board');
const UserController = require('../controllers/user');

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
            socket.on('[Board] Get Board', function(id) {  
                  BoardController.getBoard(socket, id)
            }),
            socket.on('[Board] Add Board', function(params){
                  BoardController.addBoard(socket, params)
            }),
            socket.on('[Board] Update Board', function(params){
                  BoardController.updateBoard(socket, params)
            }),
            socket.on('[Board] Update Board Starred', function(params){
                  BoardController.updateBoardStarred(socket, params)
            }),

            socket.on('[User] Get Current User', function(){
                  UserController.getCurrentUser(socket)
            }),
            socket.on('[User] Get Users', function(params){
                  UserController.getUsers(socket, params)
            })
      })

      
      
};