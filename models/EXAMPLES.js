

module.exports = function(){
      server.post(
            { name: 'User - Sign Up', path: '/api/auth/signup' }, 
            (req, res, next) => UserController.signUpUser(req, res, next)
      ),
      server.post(
            { name: 'User - Log In', path: '/api/auth/login'}, 
            (req, res, next) => UserController.logInUser(req, res, next)
      ),
      server.post(
            { name: 'User - Log Out', path: '/api/auth/logout'}, 
            (req, res, next) =>  md_auth.ensureAuth(req, res, next), 
            (req, res, next) => UserController.logOutUser(req, res, next)
      ),
      server.get(
            { name: 'User - Verify Email', path: '/api/auth/verifyemail'}, 
            (req, res, next) => UserController.verifyEmail(req, res, next)
      ),
      server.get(
            { name: 'User - Return Token Info', path: '/api/auth/tokeninfo'}, 
            md_auth.ensureAuth, 
            (req, res, next) => UserController.tokenInfo(req, res, next)),
      server.post(
            { name: 'User - Password Reset Request', path: '/api/auth/passwordresetrequest'}, 
            (req, res, next) => UserController.requestPasswordReset(req, res, next)
      ),
      server.post(
            { name: 'User - Password Reset', path: '/api/auth/passwordreset'}, 
            (req, res, next) => UserController.passwordReset(req, res, next)
      )
};







module.exports = function(){
      socket.on('[Board] Join', function(boardId) {  
            const roomKey = Object.keys(socket.rooms).find(m => m.startsWith('b-'));
            if (roomKey !== undefined) {
                  socket.leave(roomKey)
            }
            socket.join('b-' + boardId);
      }),
      socket.on('[Board] Get Boards', function() {  
            BoardController.getBoards(socket)
      }),
      socket.on('[Board] Get Board', function(params) {  
            BoardController.getBoard(socket, params)
      }),
      socket.on('[Board] Update Board', function(params){
            BoardController.updateBoard(socket, params)
      }),

      socket.on('[Board] Add Card List', function(params){
            BoardController.addCardList(
                  sockets.in(Object.keys(socket.rooms).find(m => m.startsWith('board-'))), 
                  params
            )
      })
}




function http(req, res, next){
      const params = sanitize(req.body);

      // Access database using params

      res.send(200, response);
      return next();
}




function onlySocket(socket, parameters){
      const params = sanitize(parameters);

      // Access database

      socket.emit('[Board] Delete Board Success', params);
}

function multipleSockets(sockets, parameters){
      const params = sanitize(parameters);

      // Access database

      sockets.emit('[Board] Delete Board Success', params.id);
}






const server = restify.createServer({
	// Options
});

const io  = require('socket.io')(server.server);
io.use((socket, next) => {
      // Check request token
});
io.engine.generateId = (req) => {
      // Set User ID as Socket ID
}

server.listen(config.development.port, () => {
      MongoClient.connect(config.development.db.uri, { useNewUrlParser: true }, function(err, client) {
    
            // Exit if error
      
            // Set routes        
      });
});




argon2.hash(password).then(hash => {
      // Use hashed password
}).catch(err => {
      // Return error
});

argon2.verify(passwordHashed, passwordToCompare).then(match => {
      if (match) {
            //Correct password
      } else {
            // Not valid password
      }
}).catch(err => {
      // Return error
});



const mailer = nodemailer.createTransport({
      pool: true,
      host: "smtp.projectmanager.com",
      port: 465,
      secure: true,
      auth: {
            user: 'admin@projectmanager.com',
            pass: 'XXXXXXXX'
      }
});