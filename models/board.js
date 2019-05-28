
class BoardSettings {
      constructor() {
            this.mode = String;
            this.colorLight = String;
            this.colorDark = String;
            this.starred = Boolean;
            this.archived = Boolean;
            this.users = [];
      }
}

class Board {
      constructor() {
            this.id = Number;
            this.name = String;
            this.lists = [];
            this.settings = new BoardSettings();
            this.createdAt = Date;
            this.modifiedAt = Date;
            this.version = Number;
      }
}

class CardList {
      constructor() {
            this.id = Number;
            this.name = String;
            this.cards = [];
            this.position = Number;
            this.createdAt = Date;
            this.modifiedAt = Date;
            this.version = Number;
            this.boardId = Number;
      }
}

class DueDate {
      constructor() {
            this.date = Date;
            this.remindAt = Number;
            this.done = Boolean;
            this.completedAt = Date;
      }
}

class CardItem {
      constructor() {
            this.id = Number;
            this.name = String;
            this.position = Number;
            this.createdAt = Date;
            this.modifiedAt = Date;
            this.version = Number;
            this.cardListId = Number;

            this.description = String;
            this.users = [];
            this.usersWatching = [];
            this.priority = Number;
            this.dueDate = new DueDate();
            this.attachments = [];
            this.checklists = [];
            this.worksegments = [];
            this.messages = [];
      }
}

class Attachment {
      constructor() {
            this._id = Number;
            this.name = String;
            this.dataType = String;
            this.userId = Number;
            this.userName = String;
            this.value = String;
            this.date = Date;
      }
}

class CheckList {
      constructor() {
            this._id = Number;
            this.name = String;
            this.checkitems = [];
            this.hide = Boolean;
      }
}

class CheckItem {
      constructor() {
            this._id = Number;
            this.name = String;
            this.checked = Boolean;
      }
}

class Message {
      constructor() {
            this.id = Number;
            this.userId = Number;
            this.boardId = Number;
            this.userName = String;
            this.cardId = Number;
            this.priority = Number;
            this.date = Date;
            this.text = String;
            this.edited = Boolean;
      }
}

module.exports = { Board, CardList, CardItem, DueDate, Attachment, CheckList, CheckItem, Message }