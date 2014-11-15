
var mongoose = require('mongoose')
	, Schema = mongoose.Schema

var NewsSchema = new Schema({
	name: String,
	description: String,
	publishedDate: String,
	souce: String,	
	url: String,

});


module.exports = mongoose.model('News', NewsSchema);