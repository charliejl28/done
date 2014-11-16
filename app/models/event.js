
var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, Document = mongoose.model('Document');

var EventSchema = new Schema({
	name: String,
	calendar: String,
	attendees: [],
	responses: [{
		email: String,
		//free: 

	}],
	timeMin: Date,
	timeMax: Date,
	duration: Number,
});


module.exports = mongoose.model('Event', EventSchema);