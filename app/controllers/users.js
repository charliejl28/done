var mongoose = require('mongoose')
	, User = mongoose.model('User')
    , Event = mongoose.model('Event')
    , moment = require('moment')
    , nodemailer = require('nodemailer')
    , google = require('googleapis')
    , calendar = google.calendar('v3')
    , OAuth2 = google.auth.OAuth2
    , config = require('../../config/config')
    , oauth2Client = new OAuth2(config.clientId, config.clientSecret, config.clientURI)
    , _ = require('underscore')
    , events = require('../../app/controllers/events');

exports.login = function(req, res){
    res.redirect('/auth/google/')
};

exports.logout = function(req, res){
	req.logout();
    res.redirect('/');
};

exports.index = function(req, res){
    res.render('index');
};




function contains(needle, haystack){
    return (needle.trim().toLowerCase() == haystack.trim().toLowerCase());
}



function makeThisYear(date){
    if (date.isBefore(moment(), 'year')){
        return date.year(moment().year());
    }
    return date;
}

var Small = {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90,
};


function text2num(s){
    if (s == undefined) return;

    return Small[s.toLowerCase()];
}
function dateFromNumberOrString(input, now){
    var reg = /^\d+$/;

    var addedDays = undefined;
    if (reg.test(input)){
        addedDays = input;
    }
    else {
        addedDays = text2num(input);
    }
    if (addedDays){
        return moment(now).utc().add('d', addedDays);
    }

}

function parseDateString(date, isNext, now){
    var returnDate = undefined;
    var today = moment(now).utc();
    var tomorrow = moment(now).add('d',1).utc();
    var nextWeek = moment(now).add('w',1).utc();
    var nextMonth = moment(now).add('months',1).utc();

    var otherAbbrs = ["Today", "Tomorrow", "Week", "Month"];
    var otherDates = [today, tomorrow, nextWeek, nextMonth];

    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var weekdaysShort =["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
       // var weekdaysShort =["Sun", "Mon", "Tues", "Weds", "Thus", "Fri", "Sat"];

    var weekDates = [];

    for (var i = 0; i < weekdays.length; i++){
        var dateT = moment(now).utc().day(i);
        if (moment(now).utc().day(i).isBefore(today) || (isNext && today.day() == i) ){
            dateT = moment(now).utc().day(i + 7);
        }
        weekDates.push(dateT);
    }

    // start parsing the date
    for (var i = 0; i <  weekdays.length; i++){
        if (contains(weekdays[i], date)) {
            returnDate = weekDates[i];
            break;
        }
    }
    if (returnDate == null || returnDate == undefined){
        for (var i = 0; i <  weekdaysShort.length; i++){
            if (contains(weekdaysShort[i], date)) {
                returnDate = weekDates[i];
                break;
            }
        } 
        if (returnDate == null || returnDate == undefined){
            for (var i = 0; i < otherAbbrs.length; i++){
                //console.log(otherAbbrs[i]);
                //console.log(date);

                if (contains(otherAbbrs[i], date)) {
                    returnDate = otherDates[i];
                    break;
                }
            } 

        }
    }

    return returnDate;
}

function parseDateOther(date){
    var output = undefined;
    var m = date.match(/(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}/);
    if (m && m[0] && moment(m[0]).isValid()){
        output = makeThisYear(moment(m[0]));
    }
    else {
        var m = date.match(/(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])/);
        if (m && m[0] && moment(m[0]).isValid()){
            output = makeThisYear(moment(m[0]));
        }
    }
    return output;
}

function parseDateMoment(date){
    var inputDate = undefined;
    if (date && moment(date).isValid()){
        inputDate = moment(date);
        if (inputDate.isBefore(moment(), 'year')){
            inputDate.year(moment().year());
        }
    }
    return inputDate;
}


function parseDate(date, now, isNext){

    var momentDate = parseDateMoment(date);
    if (momentDate != undefined){
        return momentDate;
    }
    else{
        var otherDate = parseDateOther(date);
        if (otherDate != undefined){
            return otherDate;
        }
        else {
            var stringDate = parseDateString(date, isNext, now);
            if (stringDate != undefined){
                return stringDate;
            }
            else {
                console.log('cant parse date');
                return null;
            }
        }
    }

 }





exports.createMeeting = function(req, res){
    //Emails
    //Text

    var contacts = req.query.emails;

    var name = req.query.text;
    console.log(name);
    //console.log(emails[0])
    var dueTextLength = 5;
    
    var m = name.search(/ by /i);

    var taskName = name;
    var taskDueDate = null;
    var today = moment().utc();

 
    // try to parse date first
    if (m != -1) {
        var restOfName = name.slice(m + dueTextLength, name.length);
        var restArray = restOfName.split(/\s+/);
        if (restArray[0]){
            var nextFound = restOfName.search(/\bnext\b/i);
            var inFound = restOfName.match(/\bin \b\w+\b days?\b/i);
            if ( (nextFound != -1) && restArray[1]) {
                var dueDateText = restArray[0] + " " + restArray[1];
                taskDueDate = parseDate(restArray[1], today,  true);
                if (taskDueDate == null){
                    taskName = name;
                }
                else {
                    taskName = name.slice(0, m) + " " + name.slice(m + dueTextLength + restArray[0].length + restArray[1].length + 1, name.length);
                }
            }
            else if (inFound && inFound[0]){
                var parts = restOfName.slice(inFound, restOfName.length).split(/\s+/);
                if (parts[0] && parts[1] && parts[2]){
                    taskDueDate = dateFromNumberOrString(parts[1], today );
                    if (taskDueDate == null){
                        taskName = name;
                    }
                    else {
                        taskName = name.slice(0, m) +  name.slice(m + dueTextLength + inFound[0].length + 1, name.length);
                    }
                }
            }
            else {
                taskDueDate = parseDate(restArray[0], today, undefined);
                if (taskDueDate == null){
                    taskName = name;
                }
                else {
                    taskName = name.slice(0, m) +  name.slice(m + dueTextLength + restArray[0].length, name.length);
                }
            }
        }  
    }
    var contactEmails = [];
    var contactBoth = [];
    var event = {attendees : []};
    
    for (var i = 0; i < contacts.length; i++){
        var contactName = contacts[i]
        var contactParts = contacts[i].split(' ');
        var email = contactParts.slice(-1).pop()
        contactEmails.push(email);
        contactBoth.push(email);
        taskName = taskName.replace(contactName, '');
        taskName= taskName.replace('with', "");
        taskName = taskName.replace('With', "");

        event.attendees.push(email);


    }

    console.log('task due date ');
    console.log(taskDueDate);
    console.log(contactBoth);


    event.name = taskName;
    //contactBoth.push({name: req.user.name, email:})
    event.attendees.push(req.user.email);



    event.timeMin = moment().toDate();
    event.timeMax = taskDueDate ? taskDueDate : moment().add(2, 'days').toDate();
    event.duration = 30;
    console.log("event");
    console.log(event);
        Event.create(event, function(err, event) {
            console.log(err);
            if (!err){

                User
                .find({"_id" : req.user.id})
                .exec( function (err, user) {
                    if (!err && user && user[0]){
                        var user = user[0];
                        addFreeBusy(req.user, event._id)
                    }
                });

                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'darshandesai216@gmail.com',
                        pass: 'donedonedone'
                    }
                });

                console.log(contactEmails);
                for (var i = 0; i < contactEmails.length; i++){
                    // NB! No need to recreate the transporter object. You can use
                    // the same transporter object for all e-mails
                    // setup e-mail data with unicode symbols
                    var email = contactEmails[i];
                    var link = "http://localhost:5000/respond?emailid=" + email + "&eventid=" + event._id;
                    var mailOptions = {
                        from: 'darshandesai216@gmail.com', // sender address
                        to: email, // list of receivers
                        subject: 'Invitation: ' + event.name + ' from ' + req.user.name + ' (' + req.user.email + ')', // Subject line
                        html: '<body><p style="text-align: center; font-family: \'Avant Garde\', Avantgarde, \'Century Gothic\', CenturyGothic, AppleGothic, sans-serif;">  <span style="font-size: 30px; color:#808080;">' + req.user.name + ' has invited you to "' + event.name + '"</span><br/><br/><a style="font-size:20px;" href="' + link + '">Let me find a good time for both of you.</a></p></body>' // html body
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            console.log(error);
                        } else{
                            console.log('Message sent: ' + info.response);
                        }
                    });
                }
                

            }
        });

    
    //emailandeventid


};



function setoauthCredentials(user){
    console.log(user.refreshToken);
    oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
    });
    console.log(oauth2Client);
}

function addFreeBusy(user, eventId){

    setoauthCredentials(user);

    calendar.calendarList.list({ auth:oauth2Client }, function(err, results){
        console.log(err);
        if (results && results.items){
            var calendarLists = results.items;

            for (var xy = 0; xy < calendarLists.length; xy++){
                if (calendarLists[xy].primary){
                    user.set('primaryCalendar', calendarLists[xy].id);
                    user.set('primaryCalendarSummary', calendarLists[xy].summary);
                    user.set('primaryCalendarColor', calendarLists[xy].backgroundColor);
                }
            }
            if (user.primaryCalendar == undefined){
                user.set('primaryCalendar', calendarLists[0].id);
                user.set('primaryCalendarSummary', calendarLists[0].summary);
                user.set('primaryCalendarColor', calendarLists[0].backgroundColor);
            }
            user.save(function(err){
                console.log(err);
            });
            console.log("calendar lists");

            Event.findById(eventId, function (err, event) {
                var items = [];
                for (var i = 0; i < calendarLists.length; i++){
                    items.push({"id":calendarLists[i].id});
                }
                var timeMin  = moment(event.timeMin).format('YYYY-MM-DDTHH:mm:ssZ')
                // 
                var jsonz = {'auth':oauth2Client, resource:{"timeMin": timeMin, 'timeMax': moment(event.timeMax).format('YYYY-MM-DDTHH:mm:ssZ'), items: items, timeZone: "EST"} };
                console.log( jsonz);
                var busyTimes = [];
                calendar.freebusy.query(jsonz, function(err, results){
                    console.log(results)
                    console.log(results.calendars)
                    for (var i = 0;i < calendarLists.length; i++){
                        var calName = calendarLists[i].id;
                        if (results.calendars[calName] && results.calendars[calName].busy && results.calendars[calName].busy.length > 0){
                            busyTimes.push(results.calendars[calName].busy);
                        }
                    }
                    busyTimes = _.flatten(busyTimes) 
                    var responded = {};
                    responded.busy = busyTimes;
                    console.log(busyTimes);

                    event.responses.push(responded);

                    event.save();

                    if (event.responses.length == event.attendees.length){
                        events.scheduleEvent(user, event);
                    }
                    console.log(event);
                });

            });
        }
    });
}

exports.respondToEmail = function(req, res){
    console.log("made it")
    if (req.user){
        var eventId = req.query.eventid;
        var emailId = req.query.emailid;

        User
        .find({"_id" : req.user.id})
        .exec( function (err, user) {
            if (!err && user && user[0]){
                var user = user[0];
                addFreeBusy(user, eventId)
            }
        });

        console.log(eventId)
        console.log(emailId)
        res.json({email: emailId, event: eventId});
    }
    else {
        res.redirect('login');
    }

};

exports.me = function(req, res){
 	if (req.user) {
 		res.json({user: req.user});
    }
};

exports.saveRefreshToken = function(req, res){
 	if (req.user) {
        User
        .find({"_id" : req.user.id})
        .exec( function (err, user) {
            user = user[0];
        	user.refreshToken = req.body.refresh_token;
        	user.save();
        	res.json({error: 0});
        });

    }
};

