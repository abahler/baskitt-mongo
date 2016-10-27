// *** Main server file ***

var express = require('express');
var bodyParser = require('body-parser');    
var mongoose = require('mongoose');

var config = require('./config');   // TIM: why './config' instead of './config.js'?

var app = express();

app.use(bodyParser.json());         // Middleware for request bodies
app.use(express.static('public'));  // Serve static assets

// Runs the server and connects to the database
var runServer = function(callback) {
    mongoose.set('debug', true);
    
    // Set to production so DATABASE_URL uses mlab. 
    // Not sure if this should be left here, because Travis will need to use the development db to run tests for each build/push.
    process.env.NODE_ENV = 'production';
    
    mongoose.connect(config.DATABASE_URL, function(err) {
        if (err && callback) {
            return callback(err);
        }

        // config.PORT is exported on line 10 of config.js
        app.listen(config.PORT || 5000, function() {
            console.log('Listening on localhost:' + config.PORT);
            if (callback) {
                callback();
            }
        });
    });
};

// Makes this file both an executable script and a module
// If the script is run directly (by running `node server.js`), 
// then the runServer function will be called. 
// But if the file is included from somewhere else (`require('./server')`),
// then the function won't be called, allowing the server to be started at a different point.
if (require.main === module) {
    runServer(function(err) {
        if (err) {
            console.error(err);
        }
    });
}

exports.app = app;
exports.runServer = runServer;

var Item = require('./models/item');

app.get('/items', function(req, res) {
    console.log('process dot env dot NODE_ENV: ', process.env.NODE_ENV);
    Item.find(function(err, items) {
        if (err) {
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
        res.json(items);
    });
});

app.post('/items', function(req, res) {
    // Need body data to proceed
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: 'Bad Request'
        });
    }
    
    Item.create({
        name: req.body.name
    }, function(err, item) {
        if (err) {
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
        res.status(201).json(item);
    });
});

app.put('/items/:id', function(req, res) {
    // Need body data to proceed
    if (Object.keys(req.body).length === 0 || !('name' in req.body)) {
        return res.status(400).json({
            message: 'Bad Request'
        });
    }
    
    var id = req.params.id;
    Item.findByIdAndUpdate(req.body.id, 
        { $set: { name: req.body.name }}, 
        { new: true }, 
        function (err, item) {
            if (err) { 
                if (req.body.id != id || typeof req.body.name != 'string' ) {
                    return res.status(400).json({
                        message: 'Bad Request'
                    });
                // Looking for the 'Cast to ObjectId failed' message feels hacky; 
                // is there a way to check if item exists and get a simple bool back?
                } else if (err.message.indexOf('Cast to ObjectId failed') != -1) {
                    return res.status(404).json({
                        message: 'Not Found'
                    });
                } else {
                    return res.status(500).json({
                        message: 'Internal Server Error'
                    });                    
                }

            }
            res.status(201).json(item);
        }
    );
});

app.delete('/items/:id', function(req, res) {
    Item.remove({ _id: req.params.id }, function(err, items) {
        if (err) {
            if (err.message.indexOf('Cast to ObjectId failed') != -1) {
                res.status(404).json({
                    message: 'Not found'
                });
            } else {
                res.status(500).json({
                    message: 'Internal Server Error'
                });                
            }
        } else {
            res.status(201).json(items);
        }
    });
});

app.delete('/items', function(req, res) {
    res.status(400).json({message: 'Bad Request'});
});

// Catch-all endpoint
app.use('*', function(req, res) {
    res.status(404).json({
        message: 'Not Found'
    });
});