'use strict'

const UserController = require('../controllers/user');
const BoardController = require('../controllers/board');
const MessageController = require('../controllers/message');

//TODO: Add JSON support
module.exports = function(sockets){
      sockets.on('connection', function(socket){
            console.log('User Socket: ' + socket.id);
            socket.on('join', function(boardId) {  
                  const roomKey = Object.keys(socket.rooms).find(m => m.startsWith('board-'));
                  if (roomKey !== undefined) {
                        socket.leave(roomKey)
                        console.log(socket.id + ' has leaved ' + roomKey)
                  }
                  socket.join('board-' + boardId);
                  console.log(socket.id + ' has joined board-' + boardId)
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
            socket.on('[Board] Add Board Member', function(params){
                  BoardController.addMemberToBoard(socket, params)
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
            socket.on('[Board] Delete Board Member', function(params){
                  BoardController.deleteMemberToBoard(socket, params)
            }),


            socket.on('[Board] Get Card Lists', function(params){
                  BoardController.getCardLists(socket, params)
            }),
            socket.on('[Board] Add Card List', function(params){
                  console.log(socket.rooms)
                  BoardController.addCardList(sockets.in(Object.keys(socket.rooms).find(m => m.startsWith('board-'))), params)
            }),
            socket.on('[Board] Add Card Item Member', function(params){
                  BoardController.addMemberToCard(socket, params)
            }),
            socket.on('[Board] Update Card List Position', function(params){
                  BoardController.updateCardListPosition(socket, params)
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
            socket.on('[Board] Get Card Item', function(params){
                  BoardController.getCardItem(socket, params)
            }),
            socket.on('[Board] Add Card Item', function(params){
                  BoardController.addCardItem(socket, params)
            }),
            socket.on('[Board] Update Card Item Position', function(params){
                  BoardController.updateCardItemPosition(socket, params)
            }),
            socket.on('[Board] Update Card Item Properties', function(params){
                  BoardController.updateCardItemProperties(socket, params)
            }),
            socket.on('[Board] Update Card Item Due Date', function(params){
                  BoardController.updateDueDate(socket, params)
            }),
            socket.on('[Board] Update Card Item Priority', function(params){
                  BoardController.updateCardItemPriority(socket, params)
            }),
            socket.on('[Board] Delete Card Item', function(params){
                  BoardController.deleteCardItem(socket, params)
            }),
            socket.on('[Board] Delete Card Item Member', function(params){
                  BoardController.deleteMemberToCard(socket, params)
            }),
            socket.on('[Board] Delete Card Item Due Date', function(params){
                  BoardController.deleteDueDate(socket, params)
            }),

            
            socket.on('[Board] Add Card Item Attachment', function(params){
                  BoardController.addAttachment(socket, params)
            }),
            socket.on('[Board] Update Card Item Attachment', function(params){
                  BoardController.updateAttachment(socket, params)
            }),
            socket.on('[Board] Delete Card Item Attachment', function(params){
                  BoardController.deleteAttachment(socket, params)
            }),


            socket.on('[Board] Add Card Item Checklist', function(params){
                  BoardController.addChecklist(socket, params)
            }),
            socket.on('[Board] Add Card Item Checklist Item', function(params){
                  BoardController.addChecklistItem(socket, params)
            }),
            socket.on('[Board] Update Card Item Checklist', function(params){
                  BoardController.updateChecklist(socket, params)
            }),
            socket.on('[Board] Update Card Item Checklist Item', function(params){
                  BoardController.updateChecklistItem(socket, params)
            }),
            socket.on('[Board] Delete Card Item Checklist', function(params){
                  BoardController.deleteChecklist(socket, params)
            }),
            socket.on('[Board] Delete Card Item Checklist Item', function(params){
                  BoardController.deleteChecklistItem(socket, params)
            }),


            socket.on('[Message] Get Message', function(params){
                  MessageController.getMessage(socket, params)
            }),
            socket.on('[Message] Get Messages', function(params){
                  MessageController.getMessages(socket, params)
            }),
            socket.on('[Message] Add Message', function(params){
                  MessageController.addMessage(socket, params)
            }),
            socket.on('[Message] Update Message', function(params){
                  MessageController.updateMessage(socket, params)
            }),
            socket.on('[Message] Delete Message', function(params){
                  MessageController.deleteMessage(socket, params)
            }),
            

            socket.on('[User] Get Current User', function(){
                  UserController.getCurrentUser(socket)
            }),
            socket.on('[User] Get Users', function(params){
                  UserController.getUsers(socket, params)
            }),
            socket.on('[User] Get Users By Board', function(params){
                  UserController.getUsersByBoardId(socket, params)
            })

            socket.on('[User] Update User Board Permission', function(params){
                  UserController.updateUserBoardPermission(socket, params)
            })
      })

      
      
};