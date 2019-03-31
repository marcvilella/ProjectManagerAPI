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
            socket.on('[Board] Get Board', function(params) {  
                  BoardController.getBoard(socket, params)
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
            socket.on('[Board] Delete Board', function(params){
                  BoardController.deleteBoard(socket, params)
            }),

            socket.on('[Board] Get Card Lists', function(params){
                  BoardController.getCardLists(socket, params)
            }),
            socket.on('[Board] Add Card List', function(params){
                  BoardController.addCardList(socket, params)
            }),
            socket.on('[Board] Update Card List Priority', function(params){
                  BoardController.updateCardListPriority(socket, params)
            }),
            socket.on('[Board] Sort Card List', function(params){
                  BoardController.sortCardList(socket, params)
            }),
            socket.on('[Board] Delete Card List', function(params){
                  BoardController.deleteCardList(socket, params)
            }),
            

            socket.on('[Board] Get Card Items', function(params){
                  BoardController.getCardItems(socket, params)
            }),
            socket.on('[Board] Add Card Item', function(params){
                  BoardController.addCardItem(socket, params)
            }),
            socket.on('[Board] Update Card Item Priority', function(params){
                  BoardController.updateCardItemPriority(socket, params)
            }),
            

            socket.on('[User] Get Current User', function(){
                  UserController.getCurrentUser(socket)
            }),
            socket.on('[User] Get Users', function(params){
                  UserController.getUsers(socket, params)
            })
      })

      
      
};