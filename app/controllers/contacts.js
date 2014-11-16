
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

exports.search = function(req, res){

	var query = req.query.queryString;

	console.log("query: " + query);

	console.log(req);
	console.log(req.user);


	contactsJSON = confirmAndGetContactSuggestions(req.user, query);

	res.json( {'status' : true, 'data': contactsJSON } );
}

function confirmOAuthSession(user){
	if (!user.accessToken){
        console.log(user.refreshToken);
        oauth2Client.setCredentials({
            refresh_token: user.refreshToken
        });

        oauth2Client.refreshAccessToken( function(err, tokens) {
            if (tokens){
                user.accessToken = tokens.access_token;
                user.save();

                getMeetings(res, user);
            }
            else {
                res.send(500, err)
                return;
            }
        });
    }
}

// find contact suggestions
// parameters: user, query string
// action: Google GET request, search for matching contacts
// return: matching user contacts
function confirmAndGetContactSuggestions(user, queryString){
	if (!user.accessToken){
        console.log(user.refreshToken);
        oauth2Client.setCredentials({
            refresh_token: user.refreshToken
        });

        oauth2Client.refreshAccessToken( function(err, tokens) {
            if (tokens){
                user.accessToken = tokens.access_token;
                user.save();

                getContactSugestions(user, queryString);
            }
            else {
                res.send(500, err)
                return;
            }
        });
    }
}

function getContactSuggestions(user, queryString){
	var url = "https://www.google.com/m8/feeds/contacts/default/full?q=" + queryString + "&alt=json&max-results=1000";
	console.log(url);
	request(
		{
			uri: url,
			method: "GET",
		}, 
		function(error, response, body) {
			// success retrieving contacts
			if (!error && response.statusCode == 200) {

				var googleContacts = JSON.parse(body).feed.entry;
				var ourContacts = [];

				for (var i = 0; i < googleContacts.length; i++){

					var googleContact = googleContacts[i];
					var ourContact = {};

					// contact name
					if (googleContact.title && googleContact.title.$t)
						ourContact.name = googleContact.title.$t

					// contact email
					if (googleContact.gd$email && googleContact.gd$email[0])
						ourContact.email = googleContact.gd$email[0].address

					ourContacts.push(contact);
					console.log(contact)

				}

				// create json
				var jsonResult = JSON.stringify(ourContacts);
				return jsonResult;
			}
		}
	);
}


// find available times
// params: invitees, location, duration, due date
// action: retrieve freebusy for invitees, find best mutually free times
// return best even
function confirmAndGetBestMeetingTime(user, invitees, location, duration, startDate, endDate){
	if (!user.accessToken){
        console.log(user.refreshToken);
        oauth2Client.setCredentials({
            refresh_token: user.refreshToken
        });

        oauth2Client.refreshAccessToken( function(err, tokens) {
            if (tokens){
                user.accessToken = tokens.access_token;
                user.save();

                getBestMeetingTIme(user, invitees, location, duration, startDate, endDate);
            }
            else {
                res.send(500, err)
                return;
            }
        });
    }
}

function getBestMeetingTIme(user, invitees, location, duration, startDate, endDate){

}

// schedule meeting with Google
// params: user, event, invitees
// action: POST event to google calendar API (should send invites automatically)
// return: sucess/failure
function createGoogleEvent(user, event, invitees){


}