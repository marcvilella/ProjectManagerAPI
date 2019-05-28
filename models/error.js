
class CustomError extends Error {
      constructor(name, message, timestamp = null) {
            super(message)
            this.name = name
            this.message = message
            this.timestamp = timestamp
      }
      
      toJSON() {

            if (this.timestamp === null){
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
                              timestamp: this.timestamp
                        }
                  }
            }
      }
}

function sendError(socket, action, errorToLog, errorToSend, timestamp = null){
      console.log(errorToLog);
      if(timestamp !== null){
            errorToSend.timestamp = timestamp
            socket.emit(action, (new CustomError(errorToSend.name, errorToSend.message, errorToSend.timestamp).toJSON()));
      }
      else{
            socket.emit(action, (new CustomError(errorToSend.name, errorToSend.message).toJSON()));
      }
}

const typeErrors = Object.freeze({
      'User': '[User] Failure',
      'Board': '[Board] Failure',
      'Message': '[Message] Failure',
      'NotFound': '[Not Found] Failure'
})

const userErrors = Object.freeze({
      'Permission': {'name': 'Not enought permissions', 'message': ''},

      'WrongEmail': {'name': 'Not enought permissions', 'message': ''},
      'UpdateUserBoardPermission': {'name': 'Update', 'message': ''},
})


const boardErrors = Object.freeze({
      'FindingBoard': {'name': 'Find', 'message': 'Board'},
      'DeletingBoard': {'name': 'Delete', 'message': 'Board'},

      'UpdatingCardListPosition': {'name': 'Update', 'message': 'Card List Position', 'timestamp': ''},
      'SortingCardList': {'name': 'Sort', 'message': 'Card List'},
      'DeletingCardList': {'name': 'Delete', 'message': 'Card List', 'timestamp': ''},

      'GetCardItem': {'name': 'Get', 'message': ''},
      'UpdatingCardItemPosition': {'name': 'Update', 'message': 'Card Item Position', 'timestamp': ''},
      'UpdatingCardItemProperties': {'name': 'Update', 'message': ''},
      'UpdatingCardItemPriority': {'name': 'Update', 'message': ''},
      'DeletingCardItem': {'name': 'Delete', 'message': 'Card Item', 'timestamp': ''},

      'AddingMemberToBoard': {'name': 'Add', 'message': ''},
      'AddingMemberToCard': {'name': 'Add', 'message': ''},
      
      'UpdatingDueDateToCard': {'name': 'Update', 'message': ''},
      'DeletingDueDateToCard': {'name': 'Delete', 'message': ''},

      'AddAttachment': {'name': 'Add', 'message': 'Message'},
      'UpdateAttachment': {'name': 'Update', 'message': 'Message'},
      'DeleteAttachment': {'name': 'Delete', 'message': 'Message'},

      'AddChecklist': {'name': 'Add', 'message': 'Checklist'},
      'AddChecklistItem': {'name': 'Add', 'message': 'Checklist'},
      'UpdateChecklist': {'name': 'Update', 'message': 'Checklist'},
      'UpdateChecklistItem': {'name': 'Update', 'message': 'Checklist Item'},
      'DeleteChecklist': {'name': 'Delete', 'message': 'Checklist'},
      'DeleteChecklistItem': {'name': 'Delete', 'message': 'Checklist Item'},
})

const messageErrors = Object.freeze({
      'GetMessage': {'name': 'Get', 'message': 'Message'},
      'GetMessages': {'name': 'Get', 'message': 'Messages'},
      'AddMessage': {'name': 'Add', 'message': 'Message'},
      'UpdateMessage': {'name': 'Update', 'message': 'Message'},
      'DeleteMessage': {'name': 'Delete', 'message': 'Message'}
})

const notFoundErrors = Object.freeze({
      'DataNotFound': { 'name': 'Data not found'}
})

module.exports = { sendError, typeErrors, userErrors, boardErrors, messageErrors, notFoundErrors }