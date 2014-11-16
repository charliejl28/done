
var mongoose = require('mongoose')
	, Schema = mongoose.Schema

var UserSchema = new Schema({
	_id: String,
	email: String,
	name: String,
	firstName: String,
	lastName: String,
	
	phoneNumber: String,

	refreshToken: String,
	accessToken: String,
	primaryCalendar: String,
	primaryCalendarColor: String,
	primaryCalendarSummary: String,
	events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
	contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
	mails: [{ type: Schema.Types.ObjectId, ref: 'Mail' }],
	documents: [{ type: Schema.Types.ObjectId, ref: 'Document' }],


	primaryCalendar: String,
	primaryCalendarColor: String,

	createdAt: {type: Date, default: Date.now}
});


module.exports = mongoose.model('User', UserSchema);