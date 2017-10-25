var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);

var db = require(libs + 'db/mongoose');
var Article = require(libs + 'model/article');
var ogs = require('open-graph-scraper');

const options = {'url': 'http://agu/'};

router.get('/', function(req, res) {
	
	Article.find(function (err, articles) {
		if (!err) {
            return res.send('<head>' +
                '<title>Aнатолий Гуськов - стихи</title>' +
                '<meta name="description" content="Aнатолий Гуськов - стихи" />' +
                '<meta name="twitter:card" value="Aнатолий Гуськов - стихи">' +
                // Open Graph data
                '<meta property="og:title" content="Aнатолий Гуськов - стихи" />' +
                '<meta property="og:type" content="website" />' +
                '<meta property="og:url" content="http://agu.181.rsdemo.ru" />' +
                '<meta property="og:image" content="http://agu.181.rsdemo.ru/assets/images/body4.jpg" />' +
                '<meta property="og:description" content="Aнатолий Алексеевич Гуськов - стихи" />' +
                '<meta property="og:site_name" content="A.A.Guskov" />' +
                '</head>'
            );
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
            	'<meta property="og:title" content="'+article.title+'" />' +
                '<meta property="og:type" content="website" />' +
                '<meta property="og:url" content="http://agu.181.rsdemo.ru/poem?id='+article.id+'" />' +
                '<meta property="og:image" content="http://agu.181.rsdemo.ru/assets/images/body4.jpg" />' +
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

router.put('/:id', passport.authenticate('bearer', { session: false }), function (req, res){
	var articleId = req.params.id;

	Article.findById(articleId, function (err, article) {
		if(!article) {
			res.statusCode = 404;
			log.error('Article with id: %s Not Found', articleId);
			return res.json({ 
				error: 'Not found' 
			});
		}

        var quatrains = req.body.text.split("\n\n");

		article.title = req.body.title;
		article.description = quatrains[0];
		article.text = req.body.text;
		// article.author = req.body.author;
		// article.images = req.body.images;

		article.save(function (err) {
			if (!err) {
				log.info("Article with id: %s updated", article.id);
                // res.redirect('/articles/all');
				return res.json({ 
					status: 'OK', 
					article:article 
				});
			} else {
                log.info("error %s now", err);
				if(err.name === 'ValidationError') {
					res.statusCode = 400;
					return res.json({ 
						error: 'Validation error' + err.message
					});
				} else {
					res.statusCode = 500;
					
					return res.json({ 
						error: 'Server error' 
					});
				}
				log.error('Internal error (%d): %s', res.statusCode, err.message);
			}
		});
	});
});

module.exports = router;
