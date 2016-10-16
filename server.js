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
            console.log('Listening on localhost:' + config.PORT);
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
    Item.findByIdAndUpdate(req.body.id, 
        { $set: { name: req.body.name }}, 
        { new: true }, 
        function (err, item) {
            if (err) { 
                return res.status(500).json({
                    message: 'Internal Server Error'
                });
            }
            res.status(201).json(item);
    });
});

// "Try It!" section: DELETE handler
app.delete('/items/:id', function(req, res) {
    console.log('delete items/:id', req.params.id);
    
    Item.remove({ _id: req.params.id }, function(err, items) {
        console.log("_id is " + req.params.id);
        if (err) {
            console.log('We have an error object...', err);
            res.status(500).json({
                message: 'Internal Server Error'
            });
        } else {
            console.log('No error object present in the remove() callback function. Yay.');
            res.status(201).json(items);
        }
    });
});

/*
// DELETE from non-Mongo shopping list
app.delete('/items/:id', function(req, res) {
    var id = req.params.id;
    if (!id) {
        res.status(400).json({'error': 'No id supplied to deletion service'});
    }
    id = parseInt(id);  // Make sure we're working with a number

    // Supplied id needs to be in items list
    if (storage.items[id] === undefined) {  
        var msg = 'The supplied id was not found in the items list';
        res.status(404).json({'error': msg});
    } else {
        var r = storage.delete(id);     // Returns true on success   
        if (r) {
            res.status(200);
        } else {
            res.status(500).json({'error': 'You passed a valid item id, but the item could not be deleted for some reason.'});
        }
    }
});
*/

// Catch-all endpoint
app.use('*', function(req, res) {
    res.status(404).json({
        message: 'Not Found'
    });
});