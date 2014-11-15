
var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, Document = mongoose.model('Document');

var EventSchema = new Schema({
	kind: String,
	etag: String,
	id: String,
	status: String,
	htmlLink: String,
	created: Date,
	updated: Date,
	summary: String,
	description: String,
	location: String,
	colorId: String,
	creator: {
	    id: String,
	    email: String,
	    displayName: String,
	    self: Boolean
	},
	start: {
	    date: Date,
	    dateTime: Date,
	    timeZone: String
	},
	end: {
	    date: Date,
	    dateTime: Date,
	    timeZone: String
	},
	endTimeUnspecified: Boolean,
	transparency: String,
	visibility: String,
	iCalUID: String,
	sequence: Number,
	attendees: [
	    {
	    	id: String,
      		email: String,
      		displayName: String,
      		organizer: Boolean,
      		self: Boolean,
      		resource: Boolean,
      		optional: Boolean,
      		responseStatus: String,
      		comment: String,
      		additionalGuests: Number
	    }
	],
	hangoutLink: String,
	source: {
	    url: String,
	    title: String
	},
	edgyContacts: [{type: Schema.Types.ObjectId, ref: 'Contact'}],
	edgyNotes: [{type: Schema.Types.ObjectId, ref: 'Document'}],
	edgyEmail: [],
	edgyNews: [{type: Schema.Types.ObjectId, ref: 'News'}],
	edgyMeetings: [],

});


module.exports = mongoose.model('Event', EventSchema);