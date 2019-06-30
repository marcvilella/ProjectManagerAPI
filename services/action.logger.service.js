'use strict'

const db = require('../index').db;

function insertLog(id, action, event, parameters, result, addtitional = null) {

      if (parameters.password != undefined) {
            parameters.password = null;
      }

      const log = {
            id: id,
            action: action,
            event: event,
            parameters: parameters,
            date: new Date(),
            result: result,
            data: addtitional
      }

      db.collection('logger').insertOne(log, (err, result) => {});
}

const actions = Object.freeze({
      'Get': 'GET',
      'Insert': 'INSERT',
      'Update': 'UPDATE',
      'Delete': 'DELETE'
})

const results = Object.freeze({
      'Ok': 'OK',
      'Error': 'ERROR'
})

module.exports = {
      insertLog,
      actions,
      results
}