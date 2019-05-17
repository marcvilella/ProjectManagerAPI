
class BoardSettings {
      constructor() {
            this.mode = String;
            this.colorLight = String;
            this.colorDark = String;
            this.starred = Boolean;
            this.archiced = Boolean;
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
            this.name = String;
            this.cards = [];
            this.position = Number;
            this.createdAt = Date;
            this.modifiedAt = Date;
            this.version = Number;
            this.boardId = Number;
      }
}

class CardItem {
      constructor() {
            this.name = String;
            this.position = Number;
            this.createdAt = Date;
            this.modifiedAt = Date;
            this.version = Number;
            this.cardListId = Number;

            this.priority = Number;
      }
}

module.exports = { Board, BoardSettings, CardList, CardItem }