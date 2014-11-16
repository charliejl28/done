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
  	, calendar = googleapis.calendar('v3')
  	, OAuth2 = googleapis.auth.OAuth2
    , config = require('../../config/config')
    , moment = require('moment')
    , async = require('async')
  	, _ = require('underscore');



exports.test = function(req, res){
	if (req.user){
		var oauth2Client = new OAuth2(config.clientID, config.clientSecret, config.clientURI);
        User
        .find({"_id" : "113870310705846615265"})
        .populate('events')
        .populate('contacts')
        .exec( function (err, user) {
        	Event.find({}, function(err, events) {
        		res.json({events: events, contacts: user[0].contacts} );

			});

        });
    }
}

// NEED: invitee email, accessToken, eventID
// retrieves freeBusy for given invitee
// saves to event 
// calls findMeetingTime if all freeBusy's received
exports.getFreeBusy = function(req, res){



}



// public method for /event/schedule/
// search through all invitees freeBusies
// finds mutually free time long enough for meeting occurring within meeting scheduling window 
// calls createGoogleEvent
exports.findMeetingTime = function(req, res){

	// test data
	var yoBusyString = '[{ "start": "2014-11-17T09:00:00-05:00", "end": "2014-11-17T12:20:00-05:00"},{ "start": "2014-11-17T14:00:00-05:00", "end": "2014-11-17T16:00:00-05:00"},{ "start": "2014-11-17T19:30:00-05:00", "end": "2014-11-17T21:50:00-05:00"},{ "start": "2014-11-18T13:30:00-05:00", "end": "2014-11-18T14:50:00-05:00"},{ "start": "2014-11-19T11:00:00-05:00", "end": "2014-11-19T12:20:00-05:00"},{ "start": "2014-11-20T13:30:00-05:00", "end": "2014-11-20T14:50:00-05:00"}]';

	var cjBusyString = '[{ "start": "2014-11-17T00:00:00-05:00", "end": "2014-11-17T10:00:00-05:00"},{ "start": "2014-11-17T11:30:00-05:00", "end": "2014-11-17T12:30:00-05:00"},{ "start": "2014-11-17T13:00:00-05:00", "end": "2014-11-17T14:00:00-05:00"},{ "start": "2014-11-17T16:00:00-05:00", "end": "2014-11-17T17:00:00-05:00"},{ "start": "2014-11-17T18:00:00-05:00", "end": "2014-11-18T00:00:00-05:00"},{ "start": "2014-11-20T19:30:00-05:00", "end": "2014-11-20T21:30:00-05:00"}]';

	cjBusy = JSON.parse(cjBusyString);
	yoBusy = JSON.parse(yoBusyString);

	var allBusyIntervals = [cjBusy, yoBusy];
	var numInvites = allBusyIntervals.length;
	var scheduleMin = moment("2014-11-17T00:00:00-05:00");
	var duration = 30;
	var interval = 15;
	var scheduleMax = moment("2014-11-18T00:00:00-05:00").subtract(interval, 'm');

	data = findTimeAndSchedule(allBusyIntervals, scheduleMin, scheduleMax, duration);

	res.json({'success': true, 'data': data});
}

// local method to be called from users (or other modules)
exports.scheduleEvent = function(event){

	var allBusyTimes = _.flatten(event.responses);
	var timeMin = event.timeMin;
	var timeMax = event.timeMax;
	var duration = event.duration;

	data = findTimeAndSchedule(allBusyIntervals, timeMin, timeMax, duration);
	event.startTime = data.start;
	event.endTime = data.end;
	event.save();
}

// helper function to find time and schedule
function findTimeAndSchedule(allBusyIntervals, scheduleMin, scheduleMax, duration){
	var interval = 15;
	var numInvites = allBusyIntervals.length;
	scheduleMax.subtract(interval, 'm');

	var meetingStart = scheduleMin;
	// console.log("start: " + meetingStart.format());
	var meetingEnd = moment(meetingStart);
	meetingEnd.add(duration, 'm');
	// console.log("end: " + meetingEnd.format());
	
	// go through each possible meeting, on each interval
	for (;meetingEnd.isBefore(scheduleMax);){

		meetingStart.add(interval, 'm');
		// console.log("___________0");
		// console.log("start: " + meetingStart.format());
		meetingEnd = moment(meetingStart);
		meetingEnd.add(duration, 'm');
		// console.log("end: " + meetingEnd.format());


		// console.log("Trying meeting (" + meetingStart.format() + " | " + meetingEnd.format() + ")");

		nextMeetingCheck:
		// go through each person
		for (var iPerson = 0; iPerson < numInvites; iPerson++){

			// console.log("checking with person " + iPerson);

			var theseBusyIntervals = allBusyIntervals[iPerson];
			var numIntervals = theseBusyIntervals.length;

			// go through their day
			for (var iBusy = 0; iBusy < numIntervals - 1; iBusy++){

				// console.log("   checking interval " + iBusy);

				var thisInterval = theseBusyIntervals[iBusy];
				var thisStart = moment(thisInterval.start);
				var thisEnd = moment(thisInterval.end);
				var nextInterval = theseBusyIntervals[iBusy + 1];
				var nextStart = moment(nextInterval.start);
				var nextEnd = moment(nextInterval.end);

				// meeting starts too soon
				if (meetingStart.isBefore(thisEnd)){
					// console.log("meeting starts too soon");
					while (meetingStart.isBefore(thisEnd)){
						meetingStart = meetingStart.add(interval, 'm');
					}
					// console.log("___________1");
					// console.log("start: " + meetingStart.format());
					meetingEnd = moment(meetingStart);
					meetingEnd.add(duration, 'm');
					// console.log("end: " + meetingEnd.format());
					break nextMeetingCheck;
				}

				// meeting goes into next busy time
				if (meetingStart.isBefore(nextStart) && nextStart.isBefore(meetingEnd)){
					// console.log("meeting runs too long");
					while (meetingStart.isBefore(nextEnd)){
						meetingStart = meetingStart.add(interval, 'm');
						meetingEnd = moment(meetingStart);
						meetingEnd.add(duration, 'm');
						// console.log("start: " + meetingStart.format());
						// console.log("end: " + meetingEnd.format());
					}
					// console.log("___________2");
					// console.log("start: " + meetingStart.format());
					// console.log("end: " + meetingEnd.format());
					break nextMeetingCheck;
				}

				// works for this person
				if (thisEnd.isBefore(meetingStart) && meetingEnd.isBefore(nextStart)){
					// console.log("works for person " + iPerson);	
					break;
				}
			}
		}

		// works for everyone
		if (iPerson == numInvites){
			break;
		}
	}

	console.log("FOUND A MEETING TIME FOR EVERYONE");
	console.log(meetingStart.format());
	console.log(meetingEnd.format());

	data = {'start': meetingStart, 'end': meetingEnd};

	return data;
}

exports.googleEvent = function(req, res){
	createGoogleEvent(req.user, res, 'Meeting for coffee', '2014-11-17T23:15:00.000Z', '2014-11-17T23:45:00.000Z', [{'name': 'Charlie (school)', 'email':'cmj3@princeton.edu'}, {'name': 'Darshan', 'email':'darshan.desai17@gmail.com'}]);
}

// NEED: event name, start, end, invitees
// creates Google Event for meeting (should send out invites)
function createGoogleEvent(user, res, name, startDateTime, endDateTime, invitees){
	var oauth2Client = new OAuth2(config.clientID, config.clientSecret, config.clientURI);
	oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
    });

	var attendees = [];
	for (var i = 0; i < invitees.length; i++){
		var attendee = {};
		attendee['email'] = invitees[i].email;
		attendee['displayName'] = invitees[i].name;
		attendees.push(attendee);
	}

	calendar.events.insert(
		{ 
			auth:oauth2Client, 
			calendarId: user.primaryCalendar, 
			sendNotifications: true,
			resource: {
				'end': {
					'dateTime': endDateTime
				},
				'start': {
					'dateTime': startDateTime
				},
				"summary": name,
				"attendees": attendees
			}
		}, 
		function(err, item){
			console.log(err);
			if(err) return res.send(500, err);
			console.log(item);
			res.json(item);
        }
    );
}

exports.upcoming = function(req, res){
	if (req.user){
		var oauth2Client = new OAuth2(config.clientID, config.clientSecret, config.clientURI);
        User
        .find({"_id" : req.user.id})
        .populate('events')
        .exec( function (err, user) {
            user = user[0];
           	if (user.events.length){
                for (var r = 0; r < user.events.length; r++)
                    user.events[r].remove();
                user.events = [];
                user.save();
            }
           	if (user.documents.length){
                for (var r = 0; r < user.documents.length; r++)
                    user.documents[r].remove();
                user.documents = [];
                user.save();
            }

          	console.log("user");
            

			googleapis
			    .discover('calendar', 'v3')
			    .discover('drive', 'v2')
			    .execute(function(err, client) {
					oauth2Client.credentials = {
					  	access_token: req.user.accessToken,
					  	refresh_token: req.user.refreshToken
					};

					client
					  	.calendar.calendarList.list()
					  	.withAuthClient(oauth2Client)
					  	.execute(function(err, result){
					  		console.log("success to ths point")

					  		if (result.items){

					  			//client = client.newBatchRequest();
					  			//client.withAuthClient(oauth2Client)
					  			var results = [];
					  			var zz = [];
                                async.forEach(result.items, function (calendarList, nextOuter){
                                		var calId = calendarList.id;
					  					client
					  						.calendar.events.list({calendarId: calId, timeMax: moment().add(1, "month").format("YYYY-MM-DDTHH:mm:ssZ"), singleEvents: true , maxResults: 2000, timeMin: moment().subtract(1,'month').startOf('day').format("YYYY-MM-DDTHH:mm:ssZ"), orderBy:'startTime' })
										  	.withAuthClient(oauth2Client)
										  	.execute(function(err, calEvents){

										  		if (!err)
										  		zz.push(calEvents);
										  		if (!err){
										  			for (var i = 0; i < calEvents.length; i++){
														if (calEvents[i]){
															results.push(calEvents[i]);
														}
													}
										  		}
									  			
												nextOuter();

										  		
										});

                                }, function(err){




									//console.log(err)
									//console.log(results)

									var meetings = [];
									var resultsAll = zz;

                                	async.forEach(resultsAll, function (eventLists, next){ 
										if (eventLists.items && eventLists.items.length){

                                			async.forEach(eventLists.items, function (item, nextInner){ 

										
                                            	if ( item.start && ( (item.start.dateTime && moment(item.start.dateTime).isAfter(moment().startOf('day')) ) || (item.start.date && moment(item.start.date).isAfter(moment().startOf('day')) ) )  && item.status == "confirmed" ) {
										  			client
													  	.drive.files.list({q: "title contains '" + item.summary + "' or fullText contains '" + item.summary + "'" })
													  	.withAuthClient(oauth2Client)
													  	.execute(function(err, result){

													  		if (result && result.items){
													  			item.edgyNotes = [];

																Document.create(result.items, function(err){
																	if (!err){
																       	var createdDocuments = _.toArray(arguments).slice(1);
							                                            for (var x = 0; x < createdDocuments.length; x++)
							                                                item.edgyNotes.push(createdDocuments[x]._id);





														  				meetings.push(item);
														  				nextInner();

																	}
																	else 
																		console.log(err);
																});
													  		}
													  		else {
													  			meetings.push(item);
														  		nextInner();
													  		}
													});
                                            	}
		                                    	
		                                    	else if (item.status == "confirmed" ){

		                                    		meetings.push(item);
		                                    		nextInner();	

		                                    	}
		                                    	else {
		                                    		nextInner();	

		                                    	}
											
		                                   	}, function(err) {	
	                                			next();
	                                		});
										}
										else {
											next();

										}


	  								}, function(err) {
	  									console.log(err);
	                                    console.log('iterating done');
		                                    
										if (meetings.length){
											Event.create(meetings, function(err){
												if (!err){
											       	createdMeetings = _.toArray(arguments).slice(1);
		                                            for (var x = 0; x < createdMeetings.length; x++)
		                                                user.events.push(createdMeetings[x]._id);
		                                            
			                                            user.save(function(err) {
			                                                if(err) console.log(err);
			                                                    User
							                                    .find({"_id" : req.user.id})
							                                    .populate("events")
							                                    .populate('contacts')
							                                    .exec( function (err, user) {
							                                        user = user[0];
						                                        	eventsToReturn = [];
																	for (var i = 0; i < user.events.length; i++){
																		var item = user.events[i];
	                                        							if ( item.start && ( (item.start.dateTime && moment(item.start.dateTime).isAfter(moment().startOf('day')) ) || (item.start.date && moment(item.start.date).isAfter(moment().startOf('day')) ) )  ) 
	                                        								eventsToReturn.push(item);
	                                        							
																	}
																	console.log(eventsToReturn.length);
   																	eventsToReturn.sort(function(a, b){ 
	                                        							if ( a.start && a.start.dateTime && b.start && b.start.dateTime){
	                                        								return moment(b.start.dateTime).isBefore(a.start.dateTime) ? 1 : -1
	                                        							} 
	                                        							else if (a.start && a.start.dateTime){

	                                        								return moment(b.start.date).isBefore(moment(a.start.dateTime)) ? 1: -1
	                                        							}
	                                        							else if (b.start && b.start.dateTime){
	                                        								return moment(b.start.dateTime).isBefore(moment(a.start.date)) ? 1: -1
	                                        							}
	                                        							else{
	                                        								return moment(b.start.date).isBefore(moment(a.start.date)) ? 1: -1
	                                        							}

   																	});
							                                    	for (var i = 0; i < eventsToReturn.length; i++){
							                                    		console.log(eventsToReturn[i].start);
																	}
																	var lim = 10;
																	eventsToReturn = eventsToReturn.length > lim ? eventsToReturn.slice(0,lim) : eventsToReturn;

							                                    	for (var i = 0; i < eventsToReturn.length; i++){
							                                    		if (eventsToReturn[i].attendees.length){
							                                    			eventsToReturn[i].edgyContacts = [];
							                                    			for (var j = 0; j < eventsToReturn[i].attendees.length; j++){
							                                    				for (var k = 0; k < user.contacts.length; k++){
							                                    					if (user.contacts[k].email == eventsToReturn[i].attendees[j].email){
							                                    						console.log("MATCH");
							                                    						eventsToReturn[i].edgyContacts.push(user.contacts[k]);
							                                    						break;
							                                    					}
							                                    				}
							                                    			}
							                                    			eventsToReturn[i].save();
							                                    		}
							                                    	}
																	var encodedAPIKey = 'OkU2TE9yV3Roa0ZkZUtRdnk3UW1rTk9PTjNDdHNQdjNIcHpCSDAxeHJvRlk=';

                                									async.forEach(eventsToReturn, function (eventItem, nextArticles){ 
																		eventItem.edgyNews = [];
																		console.log(eventItem.summary);
								                                    	var requestStr = "https://api.datamarket.azure.com/Data.ashx/Bing/Search/v1/News?Query=%27" + encodeURIComponent(eventItem.summary) + "%27&$top=4&$format=json";

															 			request({
																            uri: requestStr,
																            method: "GET",
																            headers: {
																            	'Authorization': "Basic " + encodedAPIKey
																            }
															            }, function(error, response, body) {
															            	//console.log(body);
															            	var body = JSON.parse(body);
															            	var newsItems = body.d.results;
															            	var newsArray = [];
																			for (var ix = 0; ix <newsItems.length; ix++ ){
																				var news = {};
																				news.name = newsItems[ix].Title;
																				news.source = newsItems[ix].Source;
																				news.url = newsItems[ix].Url;
																				news.description = newsItems[ix].Description;
																				news.publishedDate = newsItems[ix].Date;


																				newsArray.push(news);
																			}


																			News.create(newsArray, function(err){
																				if (!err){
																			       	var createdDocuments = _.toArray(arguments).slice(1);
										                                            for (var x = 0; x < createdDocuments.length; x++)
										                                                eventItem.edgyNews.push(createdDocuments[x]._id);
										                                            eventItem.save();
																	  				nextArticles();

																				}
																				else 
																					console.log(err);
																			});

																				


															            });
                                									}, function(err){



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
																		    client.openMailbox("INBOX", function(err, info){
                                												
                                												async.forEach(eventsToReturn, function (eventItem, nextEmailOuter){ 
                                														console.log("eventItem.summary");
                                														
                                														console.log(eventItem.summary);
																						eventItem.edgyEmail = [];

																				    	client.search({header: ["subject", "COS 448"]}, function(err, emails){
																				    		console.log(emails);
																				    		var mailsAll = [];


																							client.listMessages(emails[0], 1, function(error, message){
																								message = message[0];
																							    console.log(message);
																							    console.log(message.UID);

																								var stream = client.createMessageStream(message.UID);
																							    var messageBody;
																								stream.on('data', function(response){
																								    messageBody += response;
																								}); 
																								stream.on('end', function(messageBodyz){
																								    console.log(messageBody);
																								    var mail = {};
																								    mail.name = message.title;
																								    mail.fromName = message.from.name;
																								    mail.fromEmail = message.from.email;
																								    mail.body = messageBody;
																								    mail.sentDate = message.date;

																									Mail.create(mail, function(err, mail){
																										if (!err){
																                                            eventItem.edgyEmail.push(mail._id);
																                                            eventItem.save(function(err){
																                                            	console.log(eventItem)
																                                            nextEmailOuter();

																                                            });
																										}
																										else 
																											console.log(err);
																									});



																								});
																							});

																							console.log("creating mail objects");
																							

																								

			                                											});	
																		    	}, function(err){
																		    		console.log('in the last step')
																					Document.populate(eventsToReturn, { path: 'edgyNotes', model: 'Document' }, function (err, events) {
																                       	Contact.populate(events, { path: 'edgyContacts', model: 'Contact' }, function (err, events) {
																                        	News.populate(events, { path: 'edgyNews', model: 'News' }, function (err, events) {
																                        		Mail.populate(events, { path: 'edgyEmail', model: 'Mail' }, function (err, events) {
																                        			res.json({events:events});
																                    			});
																                    		});
																                    	});
															                    	});
																		    	});




																		    });

																		  

																		   
																		});
                                											


                                									



								                                    	

                                									});


								                                    	
















							                                    });

			                                            });
												}
												else{
													console.log(err);
												}
											});
										}
	                                   


									});


								});
					  		}
					
					});
			});
		});
	}
};
