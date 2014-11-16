
var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, Document = mongoose.model('Document');

var EventSchema = new Schema({
	name: String,
	calendar: String,
	attendees: [],
	responses: [{
		busy: [],
	}],
	timeMin: Date,
	timeMax: Date,
	duration: Number,

	startTime: Date,
	endTime: Date,
});


module.exports = mongoose.model('Event', EventSchema);