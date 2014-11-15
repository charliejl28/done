var mongoose = require('mongoose')
	, User = mongoose.model('User');



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