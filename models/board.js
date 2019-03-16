// const BoardSettings = {
//       mode: String,
//       colorLight: String,
//       colorDark: String,
//       users: []
// }

class BoardSettings {
      constructor() {
            this.mode = String;
            this.colorLight = String;
            this.colorDark = String,
            this.users = [];
      }
}

// const Board = {
//       name: String,
//       settings: BoardSettings,
//       createdAt: Date,
//       modifiedAt: Date,
//       version: Number
// }

class Board {
      constructor() {
            this.name = String,
            this.settings = new BoardSettings(),
            this.createdAt = Date,
            this.modifiedAt = Date,
            this.version = Number
      }
}

module.exports = { Board, BoardSettings}