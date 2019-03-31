'use strict'

const db = require('../index');
const ObjectId = require('mongodb').ObjectID;
const dbhelper = require('../services/db.helper');
const sanitize = require('mongo-sanitize');

const modelBoard = require('../models/board');
const error = require('../models/error');

function joinBoard(socket){
      socket.join(room);
}

//#region Board

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

function getBoard(socket, parameters){

      let params = sanitize(parameters);
      
      db.collection('boards').findOne({_id: ObjectId(params.id)}, (err, resBoard) => {
            if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
            else if(resBoard){
                  db.collection('users').findOne({_id: ObjectId(socket.id)}, {projection: { boards: 1 }}, (err,resUser) => {
                        if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
                        else {
                              resBoard.settings['starred'] = resUser.boards.find(m => m._id == params.id).settings.starred
                              socket.emit('[Board] Get Board Success', resBoard);

                              db.collection('board-lists').find({_id: {$in: resBoard.lists}}).toArray(function(err, resList) {
                                    if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
                                    else {
                                          socket.emit('[Board] Get Card Lists Success', resList);

                                          let cards = [];
                                          resList.map(list => list.cards).forEach(list => {
                                                list.forEach(card => {
                                                      if(!isEmpty(card))
                                                            cards.push(card)    
                                                })
                                          })

                                          if(cards.length == 0)
                                                return;

                                          db.collection('board-cards').find({_id: {$in: cards}}).toArray(function(err, resItems) {
                                                if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
                                                else {
                                                      socket.emit('[Board] Get Card Items Success', resItems);
                                                }
                                          });
                                    }
                              });
                        }
                  });
            }
      });
}

function addBoard(socket, parameters){

      let params = sanitize(parameters);
      console.log(params)

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

      db.collection('boards').updateOne( { _id: ObjectId(params.id) }, 
      { $inc: {version: 1}, $currentDate: { modifiedAt: true }, $set: updateQuery}, (err, result) => {
            if(err) console.log(err)
            else {
                  if(result.matchedCount == 0)
                        console.log('No matches when updating Board: '+ params.id);
              
                  if(result.modifiedCount != 0)
                  {
                        db.collection('boards').findOne({_id: ObjectId(params.id)}, {projection: { name: 1, settings: 1, modifiedAt: 1 }}, (err, result) => {
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

      db.collection('users').updateOne( {_id: ObjectId(socket.id), 'boards._id': ObjectId(params.id)}, { $set: { 'boards.$.settings.starred': params.starred }}, (err, result) => {
            if(err) console.log(err)
            else {
                  socket.emit('[Board] Update Board Starred Success', {_id: ObjectId(params.id), settings: {starred: params.starred}});
            }

      })
}

function deleteBoard(socket, parameters){

      let params = sanitize(parameters);

      db.collection('boards').findOne({_id: ObjectId(params.id)}, {projection: {lists: 1, 'settings.users': 1}}, (err, resBoard) => {
            if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingBoard);
            else {
                  db.collection('users').updateMany( {_id: {$in: resBoard.settings.users}}, { $pull: { 'boards': {_id: ObjectId(params.id)} }}, (err, result) => {
                        if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingBoard);
                  });

                  db.collection('board-lists').find({_id: {$in: resBoard.lists}}, {projection: {cards: 1}}).toArray(function(err, resList) {
                        if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingBoard);
                        else {
                              let cards = [];
                              resList.map(list => list.cards).forEach(list => {
                                    list.forEach(card => {
                                          if(!isEmpty(card))
                                                cards.push(card)    
                                    })
                              })

                              if(cards.length != 0){
                                    db.collection('board-cards').deleteMany({_id: {$in: cards}}).catch((err) => {
                                          return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingBoard);
                                    });
                              }

                              db.collection('board-lists').deleteMany({_id: {$in: resBoard.lists}}).catch((err) => {
                                    return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingBoard);
                              });
                        }
                  });

                  db.collection('boards').deleteOne({_id: resBoard._id}).catch((err) => {
                        return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingBoard);
                  });

                  socket.emit('[Board] Delete Board Success', params.id);
            }
      });
}


//#endregion

//#region Card List

function getCardLists(socket, parameters){

      let params = sanitize(parameters);

      db.collection('board-lists').find({boardId: ObjectId(params.id)}).toArray(function(err, resList) {
            if(err) console.log(err) 
            else {
                  socket.emit('[Board] Get Card Lists Success', resList);

                  let cards = [];
                  resList.map(list => list.cards).forEach(list => {
                        list.forEach(card => {
                              if(!isEmpty(card))
                                    cards.push(card)    
                        })
                  })

                  if(cards.length == 0)
                        return;

                  db.collection('board-cards').find({_id: {$in: cards}}).toArray(function(err, resItems) {
                        if(err) console.log(err) 
                        else {
                              socket.emit('[Board] Get Card Items Success', resItems);
                        }
                  });
            }
      });
}

function addCardList(socket, parameters){

      let params = sanitize(parameters);

      let list = new modelBoard.CardList();
      list.name = params.name;
      list.priority = params.priority;
      list.createdAt = dbhelper.Timestamp();
      list.modifiedAt = list.createdAt;
      list.version = 1;
      list.boardId = ObjectId(params.id);
      
      db.collection('board-lists').insertOne(list, (err, result) => {
            if(err) console.log(err)
            else {
                  db.collection('boards').updateOne({_id: list.boardId}, {$push: {lists: ObjectId(result.ops[0]._id)}}, (err, res) =>{
                        if(err) console.log(err)
                        else {
                              socket.emit('[Board] Add Card List Success', result.ops[0]);
                        }
                  });
            }
      })

}

function updateCardListPriority(socket, parameters){

      let params = sanitize(parameters);

      params.cardLists.forEach(cardList => {
            db.collection('board-lists').updateOne( {_id: ObjectId(cardList.id)}, { $set: { 'priority': cardList.priority }}, (err, result) => {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardListPriority, params);
            })
      })

      socket.emit('[Board] Update Card List Priority Success', 0);
}

function sortCardList(socket, parameters) {

      const params = sanitize(parameters);
      let counter = 0;

      switch (params.mode) {
            // Alphabetically
            case 0:
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {name: 1, priority: 1}}).toArray(function(err, resItems) {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                  else {
                        resItems = resItems.sort((obj1, obj2) => {
                              if (obj1.name.toLocaleLowerCase() > obj2.name.toLocaleLowerCase()) {
                                    return 1;
                              }
                              if (obj1.name.toLocaleLowerCase() < obj2.name.toLocaleLowerCase()) {
                                    return -1;
                              }
                              return 0;
                        });
                        
                        resItems.forEach(cardItem => {
                              cardItem.priority = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'priority': cardItem.priority}}, (err, result) => {
                                    if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                              })
                              counter++;
                        });

                        return socket.emit('[Board] Sort Card List Success', resItems);
                  }
            });
            break;
            // CreatedAt
            case 1:
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {createdAt: 1, priority: 1}}).toArray(function(err, resItems) {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                  else {
                        resItems = resItems.sort((obj1, obj2) => {
                              if (obj1.createdAt > obj2.createdAt) {
                                    return 1;
                              }
                              if (obj1.createdAt < obj2.createdAt) {
                                    return -1;
                              }
                              return 0;
                        });
      
                        resItems.forEach(cardItem => {
                              cardItem.priority = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'priority': cardItem.priority}}, (err, result) => {
                                    if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                              })
                              counter++;
                        });

                        return socket.emit('[Board] Sort Card List Success', resItems);
                  }
            });
            break;
            case 2:
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {createdAt: 1, priority: 1}}).toArray(function(err, resItems) {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                  else {
                        resItems = resItems.sort((obj1, obj2) => {
                              if (obj1.createdAt < obj2.createdAt) {
                                    return 1;
                              }
                              if (obj1.createdAt > obj2.createdAt) {
                                    return -1;
                              }
                              return 0;
                        });
      
                        resItems.forEach(cardItem => {
                              cardItem.priority = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'priority': cardItem.priority}}, (err, result) => {
                                    if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                              })
                              counter++;
                        });

                        return socket.emit('[Board] Sort Card List Success', resItems);
                  }
            });
            break;
            // UpdatedAt
            case 3:
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {modifiedAt: 1, priority: 1}}).toArray(function(err, resItems) {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                  else {
                        resItems = resItems.sort((obj1, obj2) => {
                              if (obj1.modifiedAt > obj2.modifiedAt) {
                                    return 1;
                              }
                              if (obj1.modifiedAt < obj2.modifiedAt) {
                                    return -1;
                              }
                              return 0;
                        });
      
                        resItems.forEach(cardItem => {
                              cardItem.priority = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'priority': cardItem.priority}}, (err, result) => {
                                    if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                              })
                              counter++;
                        });

                        return socket.emit('[Board] Sort Card List Success', resItems);
                  }
            });
            break;
            case 4:
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {modifiedAt: 1, priority: 1}}).toArray(function(err, resItems) {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                  else {
                        resItems = resItems.sort((obj1, obj2) => {
                              if (obj1.modifiedAt < obj2.modifiedAt) {
                                    return 1;
                              }
                              if (obj1.modifiedAt > obj2.modifiedAt) {
                                    return -1;
                              }
                              return 0;
                        });
      
                        resItems.forEach(cardItem => {
                              cardItem.priority = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'priority': cardItem.priority}}, (err, result) => {
                                    if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                              })
                              counter++;
                        });

                        return socket.emit('[Board] Sort Card List Success', resItems);
                  }
            });
            break;
      }
      
}

function deleteCardList(socket, parameters){

      let params = sanitize(parameters);

      db.collection('board-lists').findOne({_id: ObjectId(params.id)}, {projection: {cards: 1}}, (err, resList) => {
            if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardList, params);
            else {
                  if(resList.cards.length != 0){
                        db.collection('board-cards').deleteMany({_id: {$in: resList.cards}}).catch((err) => {
                              return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardList, params);
                        });
                  }

                  db.collection('board-lists').deleteOne({_id: resList._id}).catch((err) => {
                        return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardList, params);
                  });

                  socket.emit('[Board] Delete Card List Success', params.id);
            }
      });
}

//#endregion

//#region Card Item

function getCardItems(socket, parameters){

      let params = sanitize(parameters);

      db.collection('board-cards').find({cardListId: ObjectId(params.id)}).toArray(function(err, resItems) {
            if(err) console.log(err) 
            else {
                  socket.emit('[Board] Get Card Items Success', resItems);
            }
      });
}

function addCardItem(socket, parameters){

      let params = sanitize(parameters);

      let card = new modelBoard.CardItem();
      card.name = params.name;
      card.priority = params.priority;
      card.createdAt = dbhelper.Timestamp();
      card.modifiedAt = card.createdAt;
      card.version = 1;
      card.cardListId = ObjectId(params.id);
      
      db.collection('board-cards').insertOne(card, (err, result) => {
            if(err) console.log(err)
            else {
                  db.collection('board-lists').updateOne({_id: card.cardListId}, {$push: {cards: ObjectId(result.ops[0]._id)}}, (err, res) =>{
                        if(err) console.log(err)
                        else {
                              socket.emit('[Board] Add Card Item Success', result.ops[0]);
                        }
                  });
            }
      })

}

function updateCardItemPriority(socket, parameters){

      const params = sanitize(parameters);
      const cardListId = ObjectId(params.to.id);
      
      params.to.carditems.forEach(cardItem => {
            db.collection('board-cards').updateOne( {_id: ObjectId(cardItem.id)}, { $set: { 'priority': cardItem.priority, 'cardListId': cardListId}}, (err, result) => {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPriority, params);
            })
      })

      if(!isEmpty(params.changedId)) {
            db.collection('board-lists').updateOne( {_id: cardListId}, { $push: { 'cards': ObjectId(params.changedId) }}, (err, result) => {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPriority, params);
            });
            
            db.collection('board-lists').updateOne( {_id: ObjectId(params.from.id)}, { $pull: { 'cards': ObjectId(params.changedId) }}, (err, result) => {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPriority, params);
            });

            params.from.carditems.forEach(cardItem => {
                  db.collection('board-cards').updateOne( {_id: ObjectId(cardItem.id)}, { $set: { 'priority': cardItem.priority }}, (err, result) => {
                        if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPriority, params);
                  })
            });
      }
      
      socket.emit('[Board] Update Card Item Priority Success', 0);
}

//#endregion

function isEmpty(obj) {
      for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                  return false;
      }
  
      return true;
}

module.exports = {
      joinBoard,
      getBoards,
      getBoard,
      addBoard,
      updateBoard,
      updateBoardStarred,
      deleteBoard,

      getCardLists,
      addCardList,
      updateCardListPriority,
      sortCardList,
      deleteCardList,

      getCardItems,
      addCardItem,
      updateCardItemPriority
};