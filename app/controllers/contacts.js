var mongoose = require('mongoose')
	, User = mongoose.model('User')
	, Event = mongoose.model('Event')
	, Contact = mongoose.model('Contact')
  	, request = require('request')
  	, googleapis = require('googleapis')
  	, OAuth2 = googleapis.auth.OAuth2
    , config = require('../../config/config')
    , http = require('http')

  	, _ = require('underscore');


exports.update = function(req, res){
	if (req.user){
		var oauth2Client = new OAuth2(config.clientID, config.clientSecret, config.clientURI);
        User
        .find({"_id" : req.user.id})
        .populate('contacts')
        .exec( function (err, user) {
            user = user[0];
            
           	if (user.contacts.length){
                for (var r = 0; r < user.contacts.length; r++)
                    user.contacts[r].remove();
                user.contacts = [];
                user.save();
            }

 			request({
	            uri: "https://accounts.google.com/o/oauth2/token",
	            method: "POST",
	            form: {
	                refresh_token:req.user.refreshToken, 
	                client_id:config.clientID, 
	                client_secret:config.clientSecret, 
	                grant_type:"refresh_token"  
	            }
            }, function(error, response, body) {
            	console.log(response);
                if (!error && response.statusCode == 200) {
                    //console.log(body);
                    //console.log(" At the top");
                    var access_token = JSON.parse(body).access_token;



				    var url = "https://www.google.com/m8/feeds/contacts/" + user.email + "/full?access_token=" + access_token + "&alt=json&max-results=1000";
		   			console.log(url);
		   			request({
			            uri: url,
			            method: "GET",
		            }, function(error, response, body) {
		                if (!error && response.statusCode == 200) {
		                	var contactsAll = [];
		                	var contacts = JSON.parse(body).feed.entry;
		                	for (var i = 0; i < contacts.length; i++){
		                		var contactG = contacts[i];
		                		var contact = {};

		                		contact.googleId = contactG.id.$t;

		                		if (contactG.title && contactG.title.$t)
		                			contact.name = contactG.title.$t

		                		if (contactG.gd$email && contactG.gd$email[0])
		                			contact.email = contactG.gd$email[0].address

		                		if (contactG.link && contactG.link[0] && contactG.link[0].type == 'image/*' )
		                			contact.photoURL = contactG.link[0].href;

		                		if (contactG.gd$phoneNumber && contactG.gd$phoneNumber.$t)
		                			contact.phone = contactG.gd$phoneNumber.$t;

		                		contactsAll.push(contact);
		                		console.log(contact)

		                	}
		                	if (contactsAll.length){
								Contact.create(contactsAll, function(err){
									if (!err){
								       	createdMeetings = _.toArray(arguments).slice(1);
                                        for (var x = 0; x < createdMeetings.length; x++)
                                            user.contacts.push(createdMeetings[x]._id);
                                        
                                        user.save(function(err) {
                                            if(err) console.log(err);
                                            else console.log("good");
                                        });
									}
								});
							}

		                }
		                else {
		               		console.log("error")
		               		console.log(error)
		               	}
		            });





              	}
           	});
            			
		});
	}
};
