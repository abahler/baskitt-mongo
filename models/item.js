var mongoose = require('mongoose');

// Create schema for an item
var itemSchema = new mongoose.Schema({
    name: {type: String, required: true}    // Will throw error if user attempts to create item without name
});

// Create a model by giving it a name 'Item' and a schema to follow
var Item = mongoose.model('Item', itemSchema);

// Allow us to use Item globally in the app
module.exports = Item;

/* 
    Note that we don't connect to the database in this file.
    This is important because we want our db connection at the highest level of the application (server.js). 
    This allows the application to use a single database connection for working with any model.
*/