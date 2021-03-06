module.exports = function(app){
var users = require('../app/controllers/users')
	, events = require('../app/controllers/events')
	, contacts = require('../app/controllers/contacts')
	, mails = require('../app/controllers/mails');

    app.get('/', users.index);
    app.get('/login', users.login);
    app.get('/logout', users.logout);

    app.get('/users/', users.index);
    app.get('/users/me', users.me);

    app.get('/create', users.createMeeting);
    app.get('/respond', users.respondToEmail);
    app.get('/respond/success/', users.respondSuccess);


    app.post('/users/saveRefreshToken/', users.saveRefreshToken);


    app.get('/events/upcoming/', events.upcoming);
    app.get('/events/test/', events.test);
    app.get('/event/schedule/', events.findMeetingTime);
    app.get('/event/invite', events.googleEvent);


    // app.get('/contacts/update/', contacts.update);
    app.get('/contacts/search/', contacts.search);

    app.get('/mail/top/', mails.top);






};
