var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = 'prod';

var config = {
  dev: {
    root: rootPath,
    app: {
      name: 'Done'
    },
    port: 5000,
    db: 'mongodb://127.0.0.1/done',
    clientID: "1069981559961-ltvhjr59207g5j3pi30nr9pvu7smk3hk.apps.googleusercontent.com",
    clientSecret: "cP-9DTfMpkAnT8Gnuq2GxE_H",

    clientURI: "http://localhost:5000/auth/google/callback",
  },
  prod: {
    root: rootPath,
    app: {
      name: 'Done'
    },
    port: 5000,
    db: 'mongodb://darshan:doneappdoe@ds053370.mongolab.com:53370/heroku_app31624026',
    clientID: "1069981559961-ltvhjr59207g5j3pi30nr9pvu7smk3hk.apps.googleusercontent.com",
    clientSecret: "cP-9DTfMpkAnT8Gnuq2GxE_H",
    clientURI: "http://done.herokuapp.com/auth/google/callback",

  }
};

module.exports = config[env];
