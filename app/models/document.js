
var mongoose = require('mongoose')
	, Schema = mongoose.Schema

var DocumentSchema = new Schema({
	kind: String,
	id: String,
	etag: String,
	selfLink: String,
	webContentLink: String,
	webViewLink: String,
	alternateLink: String,
	embedLink: String,
	defaultOpenWithLink: String,
	iconLink: String,
	thumbnailLink: String,
	thumbnail: {
	    image: String,
	    mimeType: String
	},
	title: String,
	mimeType: String,
	description: String,
	labels: {
		starred: Boolean,
		hidden: Boolean,
		trashed: Boolean,
		restricted: Boolean,
		viewed: Boolean
	},
	createdDate: Date,
	modifiedDate: Date,
	modifiedByMeDate: Date,
	lastViewedByMeDate: Date,
	sharedWithMeDate: Date,
	downloadUrl: String,
	indexableText: {
	    text: String
	},
	originalFilename: String,
	fileExtension: String,
	md5Checksum: String,
	fileSize: Number,
	quotaBytesUsed: Number,
	ownerNames: [
	    String
	],
	owners: [
	    {
	      kind: String,
	      displayName: String,
	      picture: {
	        url: String
	      },
	      isAuthenticatedUser: Boolean,
	      permissionId: String,
	      emailAddress: String
	    }
	],
	lastModifyingUserName: String,
	editable: Boolean,
	copyable: Boolean,
	writersCanShare: Boolean,
	shared: Boolean,
	explicitlyTrashed: Boolean,
	appDataContents: Boolean,
	headRevisionId: String,

});


module.exports = mongoose.model('Document', DocumentSchema);