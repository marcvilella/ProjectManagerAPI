
class BoardSettings {
      constructor() {
            this.mode = String;
            this.colorLight = String;
            this.colorDark = String;
            this.starred = Boolean;
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
            this.createdAt = Date;
            this.modifiedAt = Date;
      }
}

class Card {
      constructor() {
            this.name = String;
            this.createdAt = Date;
            this.modifiedAt = Date;
      }
}

module.exports = { Board, BoardSettings, CardList, Card }