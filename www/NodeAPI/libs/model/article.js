var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Article
var Images = new Schema({
	kind: {
		type: String,
		enum: ['thumbnail', 'detail'],
		required: true
	},
	url: { type: String, required: true }
});

var Article = new Schema({
	title: { type: String, required: true },
	author: { type: String, required: true },
	description: { type: String, required: true },
    text: { type: String, required: true },
	images: [Images],
	modified: { type: Date, default: Date.now },
	position: {type: Number, required: true, default: 999 }
});

Article.path('title').validate(function (v) {
	return v.length > 3 && v.length < 70;
});

module.exports = mongoose.model('Article', Article);