
var mongoose = require('mongoose')
	, Schema = mongoose.Schema

var MailSchema = new Schema({
	name: String,
	fromName:String,
	fromEmail:String,
	body:String,
	sentDate: String,
});


module.exports = mongoose.model('Mail', MailSchema);