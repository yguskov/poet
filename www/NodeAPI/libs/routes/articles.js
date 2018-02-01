var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';
var log = require(libs + 'log')(module);
var config = require(libs + 'config');
var db = require(libs + 'db/mongoose');
var Article = require(libs + 'model/article');

router.get('/', passport.authenticate('bearer', { session: false }), function(req, res) {
    log.info('req.user.username:'+req.user.username);
	Article.find({}, null, {sort: {position: 1}}, function (err, articles) {
		if (!err) {
			return res.json(articles);
		} else {
			res.statusCode = 500;
			
			log.error('Internal error(%d): %s',res.statusCode,err.message);
			
			return res.json({ 
				error: 'Server error' 
			});
		}
	});
});

router.get('/search/:phase', passport.authenticate('bearer', { session: false }), function(req, res) {

    Article.find({ '$text': { '$search': req.params.phase } }, function (err, articles) {
        if (!err) {
            return res.json(articles);
        } else {
            res.statusCode = 500;

            log.error('Internal error(%d): %s',res.statusCode,err.message);

            return res.json({
                error: 'Server error'
            });
        }
    });
});


router.post('/', passport.authenticate('bearer', { session: false }), function(req, res) {

	// only for admin
    if(req.user.username!=config.get("default:admin:username")) {
        log.error('Adding poem forbidden for guest user');

        res.statusCode = 403;
        res.json({
            error: 'Access error'
        });
        return;
	}

	// save article
    var quatrains = req.body.text.split("\n\n");

	var article = new Article({
		title: req.body.title,
		author: 'aguskov',
		description: quatrains[0],
		text: req.body.text
		// images: req.body.images
	});

	article.save(function (err) {
		if (!err) {
			log.info("New article created with id: %s", article.id);
			return res.json({ 
				status: 'OK', 
				article:article 
			});
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

router.get('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {

	Article.findById(req.params.id, function (err, article) {

		if(!article) {
			res.statusCode = 404;
			
			return res.json({ 
				error: 'Not found' 
			});
		}
		
		if (!err) {
			return res.json({ 
				status: 'OK', 
				article:article 
			});
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
    // only for admin
    if(req.user.username!=config.get("default:admin:username")) {
        log.error('Saving poem forbidden for guest user');

        res.statusCode = 403;
        res.json({
            error: 'Access error'
        });
        return;
    }
    // find and save
	var articleId = req.params.id;
	Article.findById(articleId, function (err, article) {
		if(!article) {
			res.statusCode = 404;
			log.error('Article with id: %s Not Found', articleId);
			return res.json({ 
				error: 'Not found' 
			});
		}

		if(req.body.position != undefined) {
            article.position = req.body.position;
		}
		else {
            var quatrains = req.body.text.split("\n\n");

            article.title = req.body.title;
            article.description = quatrains[0];
            article.text = req.body.text;
            // article.author = req.body.author;
            // article.images = req.body.images;
		}

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
