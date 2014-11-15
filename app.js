var express = require('express')
    , mongoose = require('mongoose')
    , fs = require('fs')
    , passport = require('passport')
    , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
    , GoogleTokenStrategy = require('passport-google-token').Strategy
    , config = require('./config/config');

mongoose.connect(config.db);
var db = mongoose.connection;

 db.on('connecting', function() {
    console.log('connecting to MongoDB...');
  });

  db.on('error', function(error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
  });
  db.on('connected', function() {
    console.log('MongoDB connected!');
  });
  db.once('open', function() {
    console.log('MongoDB connection opened!');
  });
  db.on('reconnected', function () {
    console.log('MongoDB reconnected!');
  });
  db.on('disconnected', function() {
    console.log('MongoDB disconnected!');
    mongoose.connect(config.db, {server:{auto_reconnect:true}});
  });
  mongoose.connect(config.db, {server:{auto_reconnect:true}});



var modelsPath = __dirname + '/app/models';
fs.readdirSync(modelsPath).forEach(function (file) {
  if (file.indexOf('.js') >= 0) {
    require(modelsPath + '/' + file);
  }
});

var User = mongoose.model('User');

var users = require('./app/controllers/users');


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findOne({ _id: id }, function (err, user) {
        done(err, user);
    })
});
    
    
passport.use(new GoogleTokenStrategy({
        clientID: config.clientID,
        clientSecret: config.clientSecret,
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            console.log("GoogleTokenStrategy");
            console.log(profile);
            User.findOne({ _id: profile.id }, function(err, user) {
                if (!err){
                    if (!user){
                      console.log("REFRESH TOKEN");
                      console.log(refreshToken);
                      var newUser = new User({
                          _id: profile.id, 
                          name: profile.displayName,
                          firstName: profile.name.givenName,
                          lastName: profile.name.familyName,
                          email: profile.emails[0].value,
                          refreshToken: refreshToken,
                          accessToken: accessToken,
                      });
                      newUser.save(function (err) {
                          if (err) console.log(err);
                          else return done(err, newUser);
                      });                         
                    }
                    else {
                        return done(err, user);
                    }
                }
                else 
                    console.log("err" + err)
            });
        });
    }
));

passport.use(new GoogleStrategy({
    clientID: config.clientID,
    clientSecret: config.clientID,
    callbackURL: config.clientURI
  },
  function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
                  User.findOne({ _id: profile.id }, function(err, user) {
                if (!err){
                    if (!user){
                      console.log("REFRESH TOKEN");
                      console.log(refreshToken);
                      var newUser = new User({
                          _id: profile.id, 
                          name: profile.displayName,
                          firstName: profile.name.givenName,
                          lastName: profile.name.familyName,
                          email: profile.emails[0].value,
                          refreshToken: refreshToken,
                          accessToken: accessToken,
                      });
                      newUser.save(function (err) {
                          if (err) console.log(err);
                          else return done(err, newUser);
                      });                         
                    }
                    else {
                        return done(err, user);
                    }
                }
                else 
                    console.log("err" + err)
            });
    })
    })

);





var app = express();

require('./config/express')(app, config, passport);
require('./config/routes')(app);

app.get('/auth/google', passport.authenticate('google', { scope: 
                                            ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email', 
                                            'https://www.googleapis.com/auth/calendar'],
                                            accessType: 'offline'
                                        }));




app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  req.session.access_token = req.user.accessToken;
  res.redirect('/');
});

app.get('/auth/google-iOS', passport.authenticate('google-token', 


{ scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email', 
                                            'https://www.googleapis.com/auth/calendar',
                                            ], accessType: 'offline', failureRedirect: '/login' }),
  function(req, res) {
    if (req.isAuthenticated()){
    console.log("im authenticated");

        if (req.user && req.user.isNewUser === true){
            res.json({
                "userID" : req.user.id,
                "userDisplayName" : req.user.name,
                "newUser" : true,
                "error": false
            }); 

        }
        else if (req.user){
            res.json({
                "userID" : req.user.id,
                "userDisplayName" : req.user.name,
                "newUser" : false,
                "error": false
            }); 
        }
    }
    else {
    console.log("im not authenticated");

        res.json({
            "error": false
        }); 
    }


  });

var port = process.env.PORT || config.port;

app.listen(port);
module.exports = app

