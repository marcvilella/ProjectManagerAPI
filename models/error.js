
class CustomError extends Error {
      constructor(name, message, backupData = null) {
            super(message)
            this.name = name
            this.message = message
            this.backupData = backupData
      }
      
      toJSON() {

            if (this.backupData === null){
                  return {
                        error: {
                              name: this.name,
                              message: this.message
                        }
                  }
            } else {
                  return {
                        error: {
                              name: this.name,
                              message: this.message,
                              backup: this.backupData
                        }
                  }
            }
      }
}

function sendError(socket, action, errorToLog, errorToSend, backupData = null){
      console.log(errorToLog);
      if(backupData !== null){
            errorToSend.backupData.params = backupData
            socket.emit(action, (new CustomError(errorToSend.name, errorToSend.message, errorToSend.backupData).toJSON()));
      }
      else{
            socket.emit(action, (new CustomError(errorToSend.name, errorToSend.message).toJSON()));
      }
}

const typeErrors = Object.freeze({
      'Board': '[Board] Failure'
})

const boardErrors = Object.freeze({
      'FindingBoard': {'name': 'Find', 'message': 'Board'},
      'DeletingBoard': {'name': 'Delete', 'message': 'Board'},

      'UpdatingCardListPosition': {'name': 'Update', 'message': 'Card List Position', 'backupData': {'action': '[Board] Update Card List Position', 'params': ''}},
      'SortingCardList': {'name': 'Sort', 'message': 'Card List'},
      'DeletingCardList': {'name': 'Delete', 'message': 'Card List', 'backupData': {'action': '[Board] Delete Card List', 'params': ''}},

      'UpdatingCardItemPosition': {'name': 'Update', 'message': 'Card Item Position', 'backupData': {'action': '[Board] Update Card Item Position', 'params': ''}},
      'DeletingCardItem': {'name': 'Delete', 'message': 'Card Item', 'backupData': {'action': '[Board] Delete Card Item', 'params': ''}},
})

module.exports = { sendError, typeErrors, boardErrors }