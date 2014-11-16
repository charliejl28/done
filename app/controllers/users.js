var mongoose = require('mongoose')
	, User = mongoose.model('User')
    , nodemailer = require('nodemailer');


exports.login = function(req, res){
	res.json({'notloggedin': 1})
};

exports.logout = function(req, res){
	req.logout();
    res.redirect('/');
};

exports.index = function(req, res){
	User.find({}, function(err, users) {
        res.json(users);
    });
};









exports.createMeeting = function(req, res){
    //Emails
    //Text

    var emails = req.body.emails;

    var name = req.body.text;
    var dueTextLength = 5;
    /*
    var m = name.search(/ by /i);

    var taskName = name;
    var taskDueDate = null;

 
    // try to parse date first
    if (m != -1) {
        var restOfName = name.slice(m + dueTextLength, name.length, reqBody);
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

    */

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'darshandesai216@gmail.com',
            pass: 'donedonedone'
        }
    });

    // NB! No need to recreate the transporter object. You can use
    // the same transporter object for all e-mails

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'darshandesai216@gmail.com', // sender address
        to: 'darshandesai17@gmail.com', // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world ✔', // plaintext body
        html: '<b>Hello world ✔</b>' // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });

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

