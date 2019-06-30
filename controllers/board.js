'use strict'

const ObjectId = require('mongodb').ObjectID;
const helper = require('../services/helper.service');
const sanitize = require('mongo-sanitize');
const fs = require('fs');
const async = require('async');

const db = require('../index').db;
const config = require('../config');
const UserController = require('../controllers/user');
const MessageController = require('../controllers/message');
const boardClass = require('../models/board');
const userClass = require('../models/user');
const error = require('../models/error');

function joinBoard(socket){
      socket.join(room);
}

// #region Board

function getBoards(socket){
      db.collection('boards').find({ 'settings.users': ObjectId(socket.id) }, { projection: { _id: 1, name: 1, createdAt: 1, modifiedAt: 1, settings: 1 } }).toArray(function(err, result) {
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
            if (err) {
                  return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
            } else if (resBoard) {

                        //             const index = user.boards.findIndex(m => m._id == params.id);
                        //             if (user.boards[index].settings.admin) {
                        //                   adminUsers.push({_id: user._id})
                        //             } else if (user.boards[index].settings.admin) {
                        //                   projectUsers.push({_id: user._id})
                        //             } else {
                        //                   memberUsers.push({_id: user._id})
                        //             }
                        //             user.boards = user.boards.filter(m => m._id.toString() === params.id);
                        //             users.push(user);
                        //             callback();

                  db.collection('users').findOne({_id: ObjectId(socket.id)}, {projection: { boards: 1 }}, (err,resUser) => {
                        if (err) {
                              return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
                        } else {
                              resBoard.settings['starred'] = resUser.boards.find(m => m._id == params.id).settings.starred;
                              socket.emit('[Board] Get Board Success', resBoard); 
                        }
                  });

                  // UserController.getUsersByBoardId(socket, parameters);

                  db.collection('board-lists').find({_id: {$in: resBoard.lists}}).toArray(function(err, resList) {
                        if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
                        else {
                              socket.emit('[Board] Get Card Lists Success', resList);

                              let cards = [];
                              resList.map(list => list.cards).forEach(list => {
                                    list.forEach(card => {
                                          if(!helper.isEmpty(card))
                                                cards.push(card)    
                                    })
                              })

                              if(cards.length == 0)
                                    return;

                              db.collection('board-cards').find({_id: {$in: cards}}).toArray(function(err, resItems) {
                                    if(err) {
                                          return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.FindingBoard);
                                    } else {
                                          helper.convertToIds(resItems, 'users', false);
                                          resItems.forEach(item => {
                                                if (item.usersWatching.some(m => m.toString() === socket.id)) {
                                                      item.watching = true;
                                                } else {
                                                      item.watching = false;
                                                }
                                                item.usersWatching = undefined;
                                          })
                                          socket.emit('[Board] Get Card Items Success', resItems);
                                    }
                              });
                        }
                  });
            }
      });
}

function addBoard(socket, parameters){

      let params = sanitize(parameters);

      let board = new boardClass.Board();
      board.name = params.name;
      board.settings.mode = params.settings.mode;
      board.settings.colorLight = params.settings.color.colorLight;
      board.settings.colorDark = params.settings.color.colorDark;
      params.settings.users.forEach(entry => board.settings.users.push(ObjectId(entry)));
      board.createdAt = helper.getTimestamp();
      board.modifiedAt = board.createdAt;
      board.version = 1;

      db.collection('boards').insertOne(board, (err, result) => {
            if(err) console.log(err)
            else {
                  const newBoard = {
                        _id: ObjectId(result.ops[0]._id),
                        settings: { 
                              starred: false,
                              role: 'admin'
                        }
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
      if(!helper.isEmpty(params.name))
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
      });
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
                                          if(!helper.isEmpty(card))
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

// #region Card List

function getCardLists(socket, parameters){

      let params = sanitize(parameters);

      db.collection('board-lists').find({boardId: ObjectId(params.id)}).toArray(function(err, resList) {
            if(err) console.log(err) 
            else {
                  socket.emit('[Board] Get Card Lists Success', resList);

                  let cards = [];
                  resList.map(list => list.cards).forEach(list => {
                        list.forEach(card => {
                              if(!helper.isEmpty(card))
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

      let list = new boardClass.CardList();
      list.name = params.name;
      list.position = params.position;
      list.createdAt = helper.getTimestamp();
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

function updateCardListPosition(socket, parameters){

      let params = sanitize(parameters);

      async.each(params.cardLists, function iteratee(cardList, callback) {
            db.collection('board-lists').updateOne( {_id: ObjectId(cardList._id)}, { $set: { 'position': cardList.position }}, (err, result) => {
                  if (err) {
                        callback(err);
                  } else {
                        callback();
                  }
            })}, function(err) {
                  if(err) {
                        error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardListPosition, params.timestamp);
                        return;
                  } else {
                        socket.emit('[Board] Update Card List Position Success', parameters.cardLists); 
                  }
            }
      );
}

function sortCardList(socket, parameters) {

      const params = sanitize(parameters);
      let counter = 0;

      switch (params.mode) {
            // Alphabetically
            case 0:
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {name: 1, position: 1}}).toArray(function(err, resItems) {
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
                              cardItem.position = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'position': cardItem.position}}, (err, result) => {
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
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {createdAt: 1, position: 1}}).toArray(function(err, resItems) {
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
                              cardItem.position = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'position': cardItem.position}}, (err, result) => {
                                    if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                              })
                              counter++;
                        });

                        return socket.emit('[Board] Sort Card List Success', resItems);
                  }
            });
            break;
            case 2:
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {createdAt: 1, position: 1}}).toArray(function(err, resItems) {
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
                              cardItem.position = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'position': cardItem.position}}, (err, result) => {
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
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {modifiedAt: 1, position: 1}}).toArray(function(err, resItems) {
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
                              cardItem.position = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'position': cardItem.position}}, (err, result) => {
                                    if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.SortingCardList);
                              })
                              counter++;
                        });

                        return socket.emit('[Board] Sort Card List Success', resItems);
                  }
            });
            break;
            case 4:
            db.collection('board-cards').find({cardListId: ObjectId(params.id)}, {projection: {modifiedAt: 1, position: 1}}).toArray(function(err, resItems) {
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
                              cardItem.position = counter;
                              db.collection('board-cards').updateOne( {_id: cardItem._id}, { $set: { 'position': cardItem.position}}, (err, result) => {
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

      db.collection('board-lists').findOne({_id: ObjectId(params.id)}, {projection: {boardId: 1, cards: 1}}, (err, resList) => {
            if(err) { 
                  return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardList, params.timestamp);
            } else if (!resList) {
                  error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                  return;
            } else {
                  if(resList.cards.length != 0){
                        db.collection('board-cards').deleteMany({_id: {$in: resList.cards}}).catch((err) => {
                              return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardList, params.timestamp);
                        });
                  }

                  db.collection('boards').updateOne({_id: resList.boardId}, {$pull: {lists: resList._id}}, (err, resBoard) => {
                        if(err) { 
                              return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardList, params.timestamp);
                        } else {
                              db.collection('board-lists').deleteOne({_id: resList._id}, function (err, resDelList){
                                    if (err) {
                                          return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardList, params.timestamp);
                                    }
                                    socket.emit('[Board] Delete Card List Success', params.id);
                              });
                        }
                  });
            }
      });
}

//#endregion

// #region Card Item

function getCardItems(socket, parameters){

      const params = sanitize(parameters);

      db.collection('board-cards').find({cardListId: ObjectId(params.id)}).toArray(function(err, resItems) {
            if(err) console.log(err) 
            else {
                  socket.emit('[Board] Get Card Items Success', resItems);
            }
      });
}

function getCardItem(socket, parameters){

      let params = sanitize(parameters);

      db.collection('board-cards').findOne({_id: ObjectId(params.id)}, (err, result) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.GetCardItem);
                  return;
            } else {
                  helper.convertToIds(result, 'users', true);

                  if (result.usersWatching.some(m => m.toString() === socket.id)) {
                        result.watching = true;
                  } else {
                        result.watching = false;
                  }
                  result.usersWatching = undefined;

                  socket.emit('[Board] Get Card Item Success', result);
                  MessageController.getMessages(socket, result.messages)
            }
      });
}

function addCardItem(socket, parameters){

      const params = sanitize(parameters);

      let card = new boardClass.CardItem();
      card.name = params.name;
      card.position = params.position;
      card.createdAt = helper.getTimestamp();
      card.modifiedAt = card.createdAt;
      card.version = 1;
      card.cardListId = ObjectId(params.id);
      card.priority = 0;
      
      db.collection('board-cards').insertOne(card, (err, result) => {
            if(err) console.log(err)
            else {
                  db.collection('board-lists').updateOne({_id: card.cardListId}, {$push: {cards: ObjectId(result.ops[0]._id)}}, (err, res) => {
                        if(err) console.log(err)
                        else {
                              socket.emit('[Board] Add Card Item Success', result.ops[0]);
                        }
                  });
            }
      });
}

function updateCardItemPosition(socket, parameters){

      const params = sanitize(parameters);
      const cardListId = ObjectId(params.to.id);
      
      params.to.carditems.forEach(cardItem => {
            db.collection('board-cards').updateOne( {_id: ObjectId(cardItem.id)}, { $set: { 'position': cardItem.position, 'cardListId': cardListId}}, (err, result) => {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPosition, params.timestamp);
            })
      })

      if(!helper.isEmpty(params.changedId)) {
            db.collection('board-lists').updateOne( {_id: cardListId}, { $push: { 'cards': ObjectId(params.changedId) }}, (err, result) => {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPosition, params.timestamp);
            });
            
            db.collection('board-lists').updateOne( {_id: ObjectId(params.from.id)}, { $pull: { 'cards': ObjectId(params.changedId) }}, (err, result) => {
                  if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPosition, params.timestamp);
            });

            params.from.carditems.forEach(cardItem => {
                  db.collection('board-cards').updateOne( {_id: ObjectId(cardItem.id)}, { $set: { 'position': cardItem.position }}, (err, result) => {
                        if(err) return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPosition, params.timestamp);
                  })
            });
      }
      
      socket.emit('[Board] Update Card Item Position Success', 0);
}

function updateCardItemProperties(socket, parameters) {
      const params = sanitize(parameters);

      console.log(params);

      let query = {$set: {}}
      if (params.name !== undefined) {
            query.$set['name'] = params.name;
      }
      if (params.description !== undefined) {
            query.$set['description'] = params.description;
      }

      db.collection('board-cards').updateOne({_id: ObjectId(params.id)}, query, (err, res) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemProperties);
                  return;
            } else if (res.matchedCount === 0) {
                  error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                  return;
            } else {
                  return socket.emit('[Board] Update Card Item Properties Success', {id: ObjectId(params.id), name: params.name, description: params.description});
            }
      });
}

function updateCardItemPriority(socket, parameters) {
      const params = sanitize(parameters);

      if (params.priority === undefined || params.priority === null) {
            error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPriority);
            return;
      }

      db.collection('board-cards').updateOne({_id: ObjectId(params.id)}, {$set: {'priority': params.priority}}, (err, res) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingCardItemPriority);
                  return;
            } else if (res.matchedCount === 0) {
                  error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                  return;
            } else {
                  return socket.emit('[Board] Update Card Item Priority Success', {id: ObjectId(params.id), priority: params.priority});
            }
      });
}

function deleteCardItem(socket, parameters){

      const params = sanitize(parameters);

      db.collection('board-cards').findOne({_id: ObjectId(params.id)}, {projection: {cardListId: 1}}, (err, resCard) => {
            if(err) {
                  return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardItem);
            } else if (!resCard) {
                  error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                  return;
            } else {
                  db.collection('board-lists').updateOne({_id: resCard.cardListId}, {$pull: {cards: resCard._id}}, (err, resList) => {
                        if(err) { 
                              return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardItem, params.timestamp);
                        } else {
                              db.collection('board-cards').deleteOne({_id: resCard._id}, function (err, resDelCard){
                                    if (err) {
                                          return error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingCardList, params.timestamp);
                                    } else {
                                          socket.emit('[Board] Delete Card Item Success', params.id);
                                    }
                              });
                        }
                  });
            }
      });
}

// #endregion

// #region Due Date

function updateDueDate(socket, parameters) {
      const params = sanitize(parameters);

      let dueDate = new boardClass.DueDate();
      dueDate.date = new Date(params.dueDate.date);
      dueDate.remindAt = params.dueDate.remindAt;
      dueDate.done = params.dueDate.done;
      if (params.dueDate.completedAt) {
            dueDate.completedAt = new Date(params.dueDate.completedAt)
      }

      db.collection('board-cards').updateOne({_id: ObjectId(params.id)}, {$set: {'dueDate': dueDate}}, (err, res) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdatingDueDateToCard);
                  return;
            } else if (res.matchedCount === 0) {
                  error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                  return;
            } else {
                  return socket.emit('[Board] Update Card Item Due Date Success', {id: ObjectId(params.id), dueDate: dueDate});
            }
      });
}

function deleteDueDate(socket, parameters) {
      const params = sanitize(parameters);

      db.collection('board-cards').updateOne({_id: ObjectId(params.id)}, {$unset: {'dueDate': 1}}, (err, res) => {
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeletingDueDateToCard);
                  return;
            } else if (res.matchedCount === 0) {
                  error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                  return;
            } else {
                  return socket.emit('[Board] Delete Card Item Due Date Success', params.id);
            }
      });
}

// #endregion

// #region Members

function addMemberToBoard(socket, parameters) {
      const params = sanitize(parameters);

      if(!helper.emailPattern.test(params.email)) {
            error.sendError(socket, error.typeErrors.User, 'Email does not meet the conditions', error.userErrors.WrongEmail);
            return;
      }

      helper.checkBoardPermissions(socket.id, params.id, 1).then(result => {
            if (!result) {
                  error.sendError(socket, error.typeErrors.User, 'Socket user does not have permissions', error.userErrors.Permission);
                  return;
            } else {
                  db.collection('users').findOne( {email: params.email}, {projection: {name: 1, surname:1, company: 1, position:1, email: 1, boards: 1 }}, (err, result) => {
                        if(err) {
                              error.sendError(socket, error.typeErrors.User, err, error.userErrors.UpdateUserBoardPermission);
                              return;
                        } else {
                              let user;
                              let query;
                              if (!result) {
                                    user = new userClass.User();
                                    user.email = params.email;
                                    user.boards.push({
                                          _id: ObjectId(params.id),
                                          settings: { 
                                                starred: false,
                                                role: 'pending'
                                          }
                                    });
                                    query = {
                                          $set: user
                                    }
                              }
                              else {
                                    if (result.boards.some(m => m._id.toString() === params.id)) {
                                          return;
                                    } else {
                                          result.boards.push({
                                                _id: ObjectId(params.id),
                                                settings: { 
                                                      starred: false,
                                                      role: 'pending'
                                                }
                                          });
                                          user = result;
                                          query = {
                                                $push: { 
                                                      'boards': {
                                                            _id: ObjectId(params.id),
                                                            settings: { 
                                                                  starred: false,
                                                                  role: 'pending'
                                                            }
                                                      }
                                                }
                                          }
                                    }
                              }

                              db.collection('users').updateOne( {email: params.email}, query, {upsert: 1}, (err, newUser) => {
                                    if (err) {
                                          error.sendError(socket, error.typeErrors.User, err, error.boardErrors.AddingMemberToBoard);
                                          return;
                                    } else {
                                          if (user._id === undefined) {
                                                user['_id'] = newUser.upsertedId._id;
                                                user.name = params.email;
                                          }

                                          db.collection('boards').updateOne( {_id: ObjectId(params.id)}, {$push: { 'settings.users': ObjectId(user._id) }}, (err, result) => {
                                                if(err) {
                                                      error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddingMemberToBoard);
                                                      return;
                                                } else {
                                                      socket.emit('[Board] Add Board Member Success', user);
                                                      return;
                                                }
                                    
                                          })
                                    }
                              });
                        }
                  });
            }
      });
}

function deleteMemberToBoard(socket, parameters) {

}

function addMemberToCard(socket, parameters){

      const params = sanitize(parameters);

      db.collection('board-cards').findOne({_id: ObjectId(params.id)}, {projection: { cardListId: 1 }}, (err, carditem) => {
            db.collection('board-lists').findOne({_id: carditem.cardListId}, {projection: { boardId: 1 }}, (err, cardlist) => {

                  // Check if Card already has this member or it belongs to the boards
                  db.collection('users').findOne({_id: ObjectId(params.userId)}, {projection: { boards: 1 }}, (err, newUser) => {
                        if(err) {
                              error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddingMemberToCard);
                              return;
                        } else if (!newUser) {
                              error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                              return;
                        } else if (!newUser.boards.some(m => m._id.toString() === cardlist.boardId.toString())) {
                              error.sendError(socket, error.typeErrors.Board, 'New user does not belong to board', error.boardErrors.AddingMemberToCard);
                              return;
                        } else {
                              // Check if user belongs to the board
                              db.collection('users').findOne({_id: ObjectId(socket.id)}, {projection: { boards: 1 }}, (err, socketUser) => {
                                    if(err) {
                                          error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddingMemberToCard);
                                          return;
                                    } else if (!socketUser) {
                                          error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                                          return;
                                    } else if (!socketUser.boards.some(m => m._id.toString() === cardlist.boardId.toString() && m.settings.role !== 'member')) {
                                          error.sendError(socket, error.typeErrors.Board, 'Socket user does not belong to this board or does not have permissions', error.boardErrors.AddingMemberToCard);
                                          return;
                                    } else {
                                          db.collection('board-cards').updateOne({_id: ObjectId(params.id)}, {$push: { 'users': ObjectId(params.userId) }}, (err, resCard) => {
                                                if(err) {
                                                      error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddingMemberToCard);
                                                      return;
                                                } else {
                                                      return socket.emit('[Board] Add Card Item Member Success', params);
                                                }
                                          });
                                    }
                              });
                        }
                  });
            });
      });

}

function deleteMemberToCard(socket, parameters) {
      const params = sanitize(parameters);

      db.collection('board-cards').findOne({_id: ObjectId(params.id)}, {projection: { cardListId: 1 }}, (err, carditem) => {
            db.collection('board-lists').findOne({_id: carditem.cardListId}, {projection: { boardId: 1 }}, (err, cardlist) => {

                  // Check if Card already has this member or it belongs to the boards
                  db.collection('users').findOne({_id: ObjectId(params.userId)}, {projection: { boards: 1 }}, (err, newUser) => {
                        if(err) {
                              error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddingMemberToCard);
                              return;
                        } else if (!newUser) {
                              error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                              return;
                        } else if (!newUser.boards.some(m => m._id.toString() === cardlist.boardId.toString())) {
                              error.sendError(socket, error.typeErrors.Board, 'New user does not belong to board', error.boardErrors.AddingMemberToCard);
                              return;
                        } else {
                              // Check if user belongs to the board
                              db.collection('users').findOne({_id: ObjectId(socket.id)}, {projection: { boards: 1 }}, (err, socketUser) => {
                                    if(err) {
                                          error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddingMemberToCard);
                                          return;
                                    } else if (!socketUser) {
                                          error.sendError(socket, error.typeErrors.NotFound, err, error.notFoundErrors.DataNotFound);
                                          return;
                                    } else if (!socketUser.boards.some(m => m._id.toString() === cardlist.boardId.toString() && m.settings.role !== 'member')) {
                                          error.sendError(socket, error.typeErrors.Board, 'Socket user does not belong to board or have permissions', error.boardErrors.AddingMemberToCard);
                                          return;
                                    } else {
                                          db.collection('board-cards').updateOne({_id: ObjectId(params.id)}, {$pull: { 'users': ObjectId(params.userId) }}, (err, resCard) => {
                                                if(err) {
                                                      error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddingMemberToCard);
                                                      return;
                                                } else {
                                                      return socket.emit('[Board] Delete Card Item Member Success', params);
                                                }
                                          });
                                    }
                              });
                        }
                  });
            });
      });
}

// #endregion

// #region Attachments

function addAttachment(socket, parameters) {
      const params = sanitize(parameters);

      let attachment = new boardClass.Attachment();
      attachment.userId = ObjectId(socket.id);
      attachment.date = new Date();
      attachment._id = ObjectId.createFromTime(attachment.date.valueOf());
      if (params.value.endsWith('//link')) {
            params.value = params.value.substring(0, params.value.length - 6)
            attachment.name = params.value;
            attachment.dataType = 'link';
      } else {
            let index = params.value.lastIndexOf('.');
            attachment.name = params.value.substring(0, index);
            attachment.dataType = params.value.substring(index + 1)
      }
      attachment.value = params.value;

      db.collection('board-cards').updateOne({_id: ObjectId(params.cardId)}, {$push: {attachments: attachment}}, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddAttachment);
                  return;
            } else {
                  socket.emit('[Board] Add Card Item Attachment Success', {cardId: params.cardId, attachment: attachment});
            }
      });
}

function updateAttachment(socket, parameters) {
      const params = sanitize(parameters);

      let query = { $set: {'attachments.$.name': params.name}};
      if (params.value !== undefined) {
            query.$set['attachments.$.value'] = params.value;
      }

      db.collection('board-cards').updateOne({_id: ObjectId(params.cardId), 'attachments._id': ObjectId(params.id)}, query, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdateAttachment);
                  return;
            } else {
                  socket.emit('[Board] Update Card Item Attachment Success', params);
            }
      });
}

function deleteAttachment(socket, parameters) {
      const params = sanitize(parameters);

      db.collection('board-cards').findOneAndUpdate({_id: ObjectId(params.cardId), 'attachments._id': ObjectId(params.id)}, {$pull: {attachments: {_id: ObjectId(params.id)}}}, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeleteAttachment);
                  return;
            } else {
                  const attachment = res.value.attachments.find(m => m._id.toString() === params.id)
                  if(attachment !== undefined && attachment.dataType !== 'link') {
                        fs.unlink(config.dir.attachments + attachment.value, (err) => {})
                  }

                  socket.emit('[Board] Delete Card Item Attachment Success', params);
            }
      });
}

// #endregion

//#region Checklists

function addChecklist(socket, parameters) {
      const params = sanitize(parameters);

      let checklist = new boardClass.CheckList();
      checklist._id = ObjectId.createFromTime(new Date());
      checklist.name = '';
      checklist.hide = false;
      let checkitem = new boardClass.CheckItem();
      checkitem._id = ObjectId.createFromTime(new Date());
      checkitem.name = '';
      checkitem.checked = false;
      checklist.checkitems.push(checkitem);


      db.collection('board-cards').updateOne({_id: ObjectId(params.id)}, {$push: {checklists: checklist}}, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddChecklist);
                  return;
            } else {
                  socket.emit('[Board] Add Card Item Checklist Success', {id: params.id, checklist: checklist});
            }
      });
}

function updateChecklist(socket, parameters) {
      const params = sanitize(parameters);

      let query = { $set: {'checklists.$.hide': params.hide}};
      if (params.name !== undefined) {
            query.$set['checklists.$.name'] = params.name;
      }

      db.collection('board-cards').updateOne({_id: ObjectId(params.id), 'checklists._id': ObjectId(params.checklistId)}, query, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdateChecklist);
                  return;
            } else {
                  socket.emit('[Board] Update Card Item Checklist Success', params);
            }
      });
}

function deleteChecklist(socket, parameters) {
      const params = sanitize(parameters);

      db.collection('board-cards').updateOne({_id: ObjectId(params.id), 'checklists._id': ObjectId(params.checklistId)}, {$pull: {checklists: {_id: ObjectId(params.checklistId)}}}, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeleteChecklist);
                  return;
            } else {
                  socket.emit('[Board] Delete Card Item Checklist Success', params);
            }
      });
}

function addChecklistItem(socket, parameters) {
      const params = sanitize(parameters);

      let checkitem = new boardClass.CheckItem();
      checkitem._id = ObjectId.createFromTime(new Date());
      checkitem.name = '';
      checkitem.checked = false;

      db.collection('board-cards').updateOne({_id: ObjectId(params.id), 'checklists._id': ObjectId(params.checklistId)}, {$push: {'checklists.$.checkitems': checkitem}}, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.AddChecklistItem);
                  return;
            } else {
                  params.checkitem = checkitem;
                  socket.emit('[Board] Add Card Item Checklist Item Success', params);
            }
      });
}

function updateChecklistItem(socket, parameters) {
      const params = sanitize(parameters);

      const query = { 
            $set: {
                  'checklists.$.checkitems.$[i]': {
                        _id: ObjectId(params.checkitemId), 
                        name: params.name,
                        checked: params.checked
                  }
            }
      };
      const filter = {
            arrayFilters: [ 
                  {
                        'i._id': ObjectId(params.checkitemId)
                  },
            ]
      }

      db.collection('board-cards').updateOne({_id: ObjectId(params.id), 'checklists.checkitems._id': ObjectId(params.checkitemId)}, query, filter, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.UpdateChecklistItem);
                  return;
            } else {
                  socket.emit('[Board] Update Card Item Checklist Item Success', params);
            }
      });
}

function deleteChecklistItem(socket, parameters) {
      const params = sanitize(parameters);

      db.collection('board-cards').updateOne({_id: ObjectId(params.id), 'checklists.checkitems._id': ObjectId(params.checkitemId)}, {$pull: {'checklists.$.checkitems': {_id: ObjectId(params.checkitemId)}}}, (err, res) =>{
            if (err) {
                  error.sendError(socket, error.typeErrors.Board, err, error.boardErrors.DeleteChecklistItem);
                  return;
            } else {
                  socket.emit('[Board] Delete Card Item Checklist Item Success', params);
            }
      });
}

//#endregion

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
      updateCardListPosition,
      sortCardList,
      deleteCardList,

      getCardItems,
      getCardItem,
      addCardItem,
      updateCardItemPosition,
      updateCardItemProperties,

      addMemberToBoard,
      deleteMemberToBoard,
      addMemberToCard,
      deleteMemberToCard,

      updateDueDate,
      updateCardItemPriority,
      deleteCardItem,
      deleteDueDate,

      addAttachment,
      updateAttachment,
      deleteAttachment,

      addChecklist,
      addChecklistItem,
      updateChecklist,
      updateChecklistItem,
      deleteChecklist,
      deleteChecklistItem,
};