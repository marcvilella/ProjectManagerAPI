'use strict'

const db = require('../index');
const ObjectId = require('mongodb').ObjectID;

const emailPattern = /^[a-z0-9](\.?[a-z0-9_-]){0,}@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[_!@#\$%\^&\*])(?=.{8,20})/;

function getTimestamp(){
      return new Date(Math.floor(new Date().getTime()/1000)*1000);
}

function isEmpty(obj) {
      for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                  return false;
      }
  
      return true;
}

function convertToIds(array, property, isRoot) {
      
      if (isRoot) {
            let ids = [];

            array[property].forEach(id => {
                  ids.push({_id: id});
            })
            array[property] = ids;
            
      } else {
            array.forEach((item) => {
                  let ids = [];

                  item[property].forEach(id => {
                        ids.push({_id: id});
                  })
                  item[property] = ids;
            });
      }
}

async function checkBoardPermissions(id, boardId, level) {
      let result;
      await db.collection('users').findOne({_id: ObjectId(id)}, {projection: {boards: 1}}).then(user => {
            if (!user) {
                  console.log('Error Checking Permissions: ' + err);
                  result = false;
            } else if (level === 1 && !user.boards.some(m => m._id.toString() === boardId.toString() && m.settings.role !== 'member')) {
                  console.log('Socket user does not have permissions enought for board: ' + boardId);
                  result = false;
            } else if (level === 2 && !user.boards.some(m => m._id.toString() === boardId.toString() && m.settings.role === 'manager')) {
                  console.log('Socket user does not have permissions Manager for board: ' + boardId);
                  result = false;
            } else {
                  result = user;
            }
      })
      return result;
}

module.exports = {
      emailPattern,
      passwordPattern,
      getTimestamp,
      isEmpty,
      convertToIds,
      checkBoardPermissions
}