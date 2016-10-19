// *** Main server file ***

var express = require('express');
var bodyParser = require('body-parser');    
var mongoose = require('mongoose');

var config = require('./config.js');

var app = express();

app.use(bodyParser.json());         // Middleware for request bodies
app.use(express.static('public'));  // Serve static assets

// Runs the server and connects to the database
var runServer = function(callback) {
    mongoose.connect(config.DATABASE_URL, function(err) {
        if (err && callback) {
            return callback(err);
        }

        app.listen(config.PORT, function() {
            // Optional callback function to signal that everything is running
            if (callback) {
                callback();
            }
        });
    });
};

if (require.main === module) {  // Makes this file both an executable script and a module
                                // If the script is run directly (by running `node server.js`), 
                                // then the runServer function will be called. 
                                // But if the file is included from somewhere else (`require('./server')`),
                                // then the function won't be called, allowing the server to be started at a different point.
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

// "Try It!" section: PUT handler
app.put('/items/:id', function(req, res) {
    var id = req.params.id;
    Item.findByIdAndUpdate(req.body.id,   // used both req.body.id and req.params.id and got same error:
                                            // 'CastError: Cast to ObjectId failed for value "1" at path "_id"'
        { $set: { name: req.body.name }}, 
        { new: true }, 
        function (err, item) {
            if (err) { 
                if (!req.body || !('name' in req.body) || req.body.id != id) {
                    // Will be testing for a 400 status if no body is passed to this method
                    return res.status(400).json({
                        message: 'Bad Request'
                    });
                } else {
                    return res.status(500).json({
                        message: 'Internal Server Error'
                    });                    
                }

            }
            res.status(201).json(item);
    });
});

// "Try It!" section: DELETE handler
app.delete('/items/:id', function(req, res) {
    Item.remove({ _id: req.params.id }, function(err, items) {
        if (err) {
            res.status(500).json({
                message: 'Internal Server Error'
            });
        } else {
            res.status(201).json(items);
        }
    });
});

// Catch-all endpoint
app.use('*', function(req, res) {
    res.status(404).json({
        message: 'Not Found'
    });
});