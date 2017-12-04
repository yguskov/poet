var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Article = require(libs + 'model/article');
var ogs = require('open-graph-scraper');

const options = {'baseUrl': 'http://gus.181.rsdemo.ru', 'poster' : '/assets/images/aguskov.jpg', 'author':'А.Гуськов'};

router.get('/', function(req, res) {
	return res.send('<head>' +
		'<title>Aнатолий Гуськов - стихи</title>' +
		'<meta name="description" content="Aнатолий Гуськов - стихи" />' +
		'<meta name="twitter:card" value="Aнатолий Гуськов - стихи">' +
		// Open Graph data
		'<meta property="og:title" content="Aнатолий Гуськов - стихи" />' +
		'<meta property="og:type" content="website" />' +
		'<meta property="og:url" content="'+options.baseUrl+'" />' +
		'<meta property="og:image" content="'+options.baseUrl+options.poster+'" />' +
		'<meta property="og:description" content="Aнатолий Алексеевич Гуськов - стихи" />' +
		'<meta property="og:site_name" content="A.A.Guskov" />' +
		'</head>'
		);
});

router.get('/all', function(req, res) {

    Article.find(function (err, articles) {
        if (!err) {
            var html = '<head>' +
                '<title>Aнатолий Гуськов - стихи</title>' +
                '<meta name="description" content="Aнатолий Гуськов - все стихи" />' +
                '<meta name="twitter:card" value="Aнатолий Гуськов - все стихи">' +
                // Open Graph data
                '<meta property="og:title" content="Aнатолий Гуськов - стихи" />' +
                '<meta property="og:type" content="website" />' +
                '<meta property="og:url" content="'+options.baseUrl+'/all">' +
                '<meta property="og:image" content="'+options.baseUrl+options.poster+'" />' +
                '<meta property="og:description" content="Aнатолий Алексеевич Гуськов - все стихи" />' +
                '<meta property="og:site_name" content="A.A.Guskov" />' +
                '</head><body>';
            for(var i=0; i < articles.length; i++) {
            	html += '<a href="'+options.baseUrl+'/poem?id='+articles[i].id+'">'+articles[i].title+"</a>";
			}
			html += '</body>';
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

			return res.send('<head>' +
                '<title>'+article.title+'</title>' +
            	'<meta name="description" content="'+article.description+'" />' +
            	'<meta name="twitter:card" value="'+article.description+'">' +
                // Open Graph data
            	'<meta property="og:title" content="'+options.author+': '+article.title+'." />' +
                '<meta property="og:type" content="website" />' +
                '<meta property="og:url" content="'+options.baseUrl+'/poem?id='+article.id+'" />' +
                '<meta property="og:image" content="'+options.baseUrl+options.poster+'" />' +
                '<meta property="og:description" content="'+article.description+'" />' +
                '<meta property="og:site_name" content="A.A.Guskov" />' +
				'</head>'
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
