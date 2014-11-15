
var mongoose = require('mongoose')
	, Schema = mongoose.Schema

var ContactSchema = new Schema({
	name: String,
	googleId: String,
	email: String,
	phone: String,	
	photoURL: String,

});

module.exports = mongoose.model('Contact', ContactSchema);