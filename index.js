'use strict'

/**
  * Module Dependencies
  * */
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware')
const MongoClient = require('mongodb').MongoClient;
const config = require('./config');

/**
 * Logger Creation
 */
const winston = require('winston');
winston.configure({
  format: winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.File({ filename: 'application.log' })
  ]
})

/**
  * Initialize Server
  * */
const server = restify.createServer({
	name: config.development.name,
	version: config.development.version
});

/**
 * Configure HTTP Headers
 */
const cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  // origins: ['http://localhost:4200', 'http://192.168.1.4:4200'],
  origins: ['*'],
  allowHeaders: ['Authorization'],
  exposeHeaders: ['Authorization-Expiry']
})

/**
  * Middleware
  * */
server.pre(cors.preflight)
server.use(cors.actual)
server.use(restify.plugins.jsonBodyParser());
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.fullResponse());

/**
   * Socket.io
   * */
const io  = require('socket.io')(server.server);
io.use((socket, next) => {
  let token = socket.handshake.query.token;
  if (require('./services/jwt').ensureAuthForConnection(token)) {
    return next();
  }
  return next(new Error('authentication error'));
});
io.engine.generateId = (req) => {
  return require('./services/jwt').IdForConnection(req._query.token);
}


 /**
   * Start Server, Connect to DB & Require Routes
   * */
server.listen(config.development.port, () => {

  MongoClient.connect(config.development.db.uri, { useNewUrlParser: true }, function(err, client) {

    if(err) {
      console.error(err);
      winston.error('SERVER INITIALIZATION - FAILED \n' + err);
      process.exit(1);
    }

    //Create BBDDs if they don't exist and creat it
    // let userModel = require('./models/user'); 
    //client.db('ProjectManager').createCollection('users', {validator: userModel.UserValidator}, (err) => { if(err)console.log(err)});
    //client.db('ProjectManager').collection('users').createIndex( { email: 1 }, { unique: true }, (err) => {if(err)console.log(err)} );
    // let us = client.db('ProjectManager').collection('users').findOne({}, { projection: { _id: 1 } }).then(function(result) {
    //   let board = require('./models/board').Board;
    //   board.name = 'Test';
    //   board.users.push(result._id);
    //   client.db('ProjectManager').collection('boards').insertOne(board).then(function(resStore){
    //     let boardStored = client.db('ProjectManager').collection('boards').findOne({}).then(function(resultBoard){
    //       console.log(resultBoard);
    //     });
    //   });
    // });

    module.exports = client.db('ProjectManager');

    require('./routes/user')(server);
    require('./routes/board')(io.sockets);

    console.log(`Server is listening on port ${config.development.port}`);
    winston.log('info', 'SERVER INITIALIZATION - OK \n\tListening to port ' + config.development.port);
    
  });

});
 