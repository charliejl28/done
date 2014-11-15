var express = require('express')
    , mongoStore = require('connect-mongo')(express)
    , pkg = require('../package');


module.exports = function(app, config, passport) {
  app.configure(function () {

    app.use(express.compress());

    app.set('port', config.port);
    app.set('views', config.root + '/app/views');
    app.set('view engine', 'jade')

    app.use(express.static(config.root + '/public'));

    app.configure(function () {
    // bodyParser should be above methodOverride
        app.use(express.bodyParser())
        app.use(express.methodOverride())

        // cookieParser should be above session
        app.use(express.cookieParser())
        app.use(express.session({
          secret: pkg.name,
          store: new mongoStore({
            url: config.db,
            collection : 'sessions'
          })
        }))



        app.use(express.favicon(config.root + '/public/img/favicon.ico'));
        app.use(express.logger('dev'));
            // Passport session
        app.use(passport.initialize());

        app.use(passport.session());

        app.use(app.router);
        app.use(function(req, res) {
          res.status(404).render('404', { title: '404' });
        });
    })
  });
};
