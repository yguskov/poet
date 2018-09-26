var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Article = require(libs + 'model/article');
var ogs = require('open-graph-scraper');

var options = {'baseUrl': function(req) { return 'http://'+req.hostname; }, 'poster' : '/assets/images/ag_thumb.png', 'author':'А.Гуськов'};

router.get('/', function(req, res) {
	return res.send('<!DOCTYPE html><html><head>' +
		'<title>Aнатолий Гуськов - стихи</title>' +
		'<meta name="description" content="Aнатолий Гуськов - стихи" />' +
		// Open Graph data
		'<meta property="og:title" content="Aнатолий Гуськов - стихи" />' +
		'<meta property="og:type" content="website" />' +
		'<meta property="og:url" content="'+options.baseUrl(req)+'" />' +
		'<meta property="og:image" content="'+options.baseUrl(req)+options.poster+'" />' +
		'<meta property="og:description" content="Aнатолий Алексеевич Гуськов - стихи" />' +
		'<meta property="og:site_name" content="A.A.Guskov" />' +
        '</head><body><script>document.location.href="'+options.baseUrl(req)+'/";'+
        '</script>' +
        '<a href="'+options.baseUrl(req)+'/pub/all">Все стихи</a>' +
        '</body></html>'
		);
});

router.get('/all', function(req, res) {

    Article.find(function (err, articles) {
        if (!err) {
            var html = '<!DOCTYPE html><html><head>' +
                '<title>Aнатолий Гуськов - стихи</title>' +
                '<meta name="description" content="Aнатолий Гуськов - все стихи" />' +
                // Open Graph data
                '<meta property="og:title" content="Aнатолий Гуськов - стихи" />' +
                '<meta property="og:type" content="website" />' +
                '<meta property="og:url" content="'+options.baseUrl(req)+'/all">' +
                '<meta property="og:image" content="'+options.baseUrl(req)+options.poster+'" />' +
                '<meta property="og:description" content="Aнатолий Алексеевич Гуськов - все стихи" />' +
                '<meta property="og:site_name" content="A.A.Guskov" />' +
                '</head><body><script>document.location.href="'+options.baseUrl(req)+'/all";'+
                '</script>';
            for(var i=0; i < articles.length; i++) {
            	html += '<a href="'+options.baseUrl(req)+'/poem?id='+articles[i].id+'">'+articles[i].title+'</a>';
			}
			html += '</body></html>';
            return res.send(html);
        } else {
            res.statusCode = 500;

            log.error('Internal error(%d): %s',res.statusCode,err.message);

            return res.json({
                error: 'Server error'
            });
        }
    });
});


router.get('/poem', function(req, res) {
	
	Article.findById(req.query.id, function (err, article) {
		if(!article) {
			res.statusCode = 404;
			
			return res.json({ 
				error: 'Not found '
			});
		}
		
		if (!err) {
			// ogs(options, function (error, results) {
			//   console.log('error:', error); // This is returns true or false. True if there was a error. The error it self is inside the results object.
			//   console.log('results:', results);
			// });

			return res.send('<!DOCTYPE html><html><head>' +
                '<title>'+article.title+'</title>' +
            	'<meta name="description" content="'+article.description+'" />' +
                // Open Graph data
            	'<meta property="og:title" content="'+options.author+': '+article.title+'." />' +
                '<meta property="og:type" content="website" />' +
                '<meta property="og:url" content="'+options.baseUrl(req)+'/poem?id='+article.id+'" />' +
                '<meta property="og:image" content="'+options.baseUrl(req)+options.poster+'" />' +
                '<meta property="og:description" content="'+article.description+'" />' +
                '<meta property="og:site_name" content="A.A.Guskov" />' +
				'</head><body><script>document.location.href="'+options.baseUrl(req)+'/poem?id='+article.id+'";'+
                '</script></body></html>'
			);
		} else {
            if(err.name === 'ValidationError') {
                res.statusCode = 400;
                res.json({
                    error: 'Validation error' + err.message
                });
            } else {
                res.statusCode = 500;

                log.error('Internal error(%d): %s', res.statusCode, err.message);

                res.json({
                    error: 'Server error'
                });
            }
		}
	});
});

module.exports = router;
