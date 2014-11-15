var mongoose = require('mongoose')
	, User = mongoose.model('User')
	, Event = mongoose.model('Event')
	, Document = mongoose.model('Document')
	, Contact = mongoose.model('Contact')
	, News = mongoose.model('News')
	, Mail = mongoose.model('Mail')

	, inbox = require("inbox")

  	, request = require('request')
  	, googleapis = require('googleapis')
  	, OAuth2 = googleapis.auth.OAuth2
    , config = require('../../config/config')
    , moment = require('moment')
    , async = require('async')
  	, _ = require('underscore');



exports.top = function(req, res){
	if (req.user){
		var oauth2Client = new OAuth2(config.clientID, config.clientSecret, config.clientURI);
        User
        .find({"_id" : req.user.id})
        .populate('events')
        .exec( function (err, user) {
            user = user[0];
  
        



			var client = inbox.createConnection(false, "imap.gmail.com", {
				    secureConnection: true,
				    auth:{
				        XOAuth2:{
				            user: req.user.email,
				            clientId: config.clientID,
				            clientSecret: config.clientSecret,
				            refreshToken: req.user.refreshToken,
				            accessToken: req.user.accessToken,
				            timeout: 3600
				        }
				    }
			});
			client.connect();
			client.on("connect", function(){
			    console.log("Successfully connected to server");
			    client.openMailbox("INBOX", function(err, info){
			    	console.log("Message count in INBOX: " + info.count);
			    	client.listMessages(-10, function(err, messages){
					    messages.forEach(function(message){
					        console.log(message.UID + ": " + message.title);
					    });
					});


				});




					
			});
		});
	}
};
