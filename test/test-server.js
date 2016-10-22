global.DATABASE_URL = 'mongodb://localhost/shopping-list-test';

var chai = require('chai');
var chaiHttp = require('chai-http');

var server = require('../server.js');   // Gives us the app object and runServer function
var Item = require('../models/item');   // TIM: why is the file referred to as 'item' instead of 'item.js'?

var should = chai.should();
var app = server.app;

chai.use(chaiHttp);

describe('Shopping List', function() {
    
    // Must have Mongo running, or the 'before' and 'after' hooks will result in timeout errors
    beforeEach(function(done) {
        server.runServer(function() {
            Item.create({name: 'Broad beans'},
                        {name: 'Tomatoes'},
                        {name: 'Peppers'}, function() {
                done();
            });
        });
    });

    afterEach(function(done) {
        // Remove entire collection
        Item.remove(function() {
            done();
        });
    }); 
    
    /* TIM: 
      I need to figure out how to test using the dummy data created inside the beforeEach function
      The routes will operate on the existing, persistent data (which obviously shouldn't be touched)
      Will have to look up how to operate on `Item` using Mongo functions like find(), create(), remove(), etc.
      When copying the tests over from the non-Mongo version of the shopping list, 2 pass and 12 fail
    */
    
    it('1. should list items on GET', function(done) {
        chai.request(app)
        .get('/items')
        .end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            // Test for return types
            res.body.should.be.a('array');
            res.body[0].should.be.a('object');
            // Test for keys
            res.body[0].should.have.property('_id');
            res.body[0].should.have.property('name');
            // Test for value types
            res.body[0]._id.should.be.a('string');
            res.body[0].name.should.be.a('string');
            // Test for value contents
            res.body[0].name.should.equal('Broad beans');
            res.body[1].name.should.equal('Tomatoes');
            res.body[2].name.should.equal('Peppers');
            done();
        });
    });
    
    it('2. should add an item on POST', function(done) {
        chai.request(app)
        .post('/items')
        .send({'name': 'Kale'})
        .end(function(err, res) {
            should.equal(err, null);    // Asserting that there should be no error
            res.should.have.status(201);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('name');
            res.body.should.have.property('_id');
            res.body.name.should.be.a('string');
            res.body._id.should.be.a('string');
            res.body.name.should.equal('Kale');
            // 'storage' object does not exist in this version of the project
            // storage.items.should.be.a('array');
            // storage.items.should.have.length(4);    // Can hard-code because we know we hard-coded 3 items initially
            // storage.items[3].should.be.a('object');
            // storage.items[3].should.have.property('id');
            // storage.items[3].should.have.property('name');
            // storage.items[3].id.should.be.a('number');
            // storage.items[3].name.should.be.a('string');
            // storage.items[3].name.should.equal('Kale');
            done();
        });
    });
    
    it('3. should edit an item on PUT', function(done) {
        
        var testItemID;
        // First need to find alphanumeric _id value for item
        Item.findOne({name: 'Broad beans'}, function(e, item){
            testItemID = item._id;
            console.log('testItemID (within findOne() body):', testItemID);
            
            chai.request(app)
            .put('/items/' + testItemID)
            .send({'name': 'Spinach', 'id': testItemID})
            .end(function(err, res) {
                console.log('res dot body: ', res.body);
                should.equal(err, null);
                res.should.have.status(201);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('name');
                res.body.should.have.property('_id');
                res.body.name.should.be.a('string');
                res.body._id.should.be.a('string');
                res.body.name.should.equal('Spinach');
                // Removed all tests of storage.items, because storage object doesn't exist in this version of the app
                done();
            }); // end of end()
            
        }); // end of Item.find()
        
    });
    
    it('should delete an item on DELETE', function(done) {
        chai.request(app)
        .delete('/items/57fc466dd5e035071a411ce4')
        .send({'_id': '57fc466dd5e035071a411ce4'})
        .end(function(err, res) {
            // console.log('err: ', err);
            // console.log('res: ', res);   // These don't output anywhere while test is running
            should.equal(err, null);
            res.should.have.status(201);
            done();
        });
    });
    
    it('should respond with a 400 on POST without body data', function(done) {
        chai.request(app)
        .post('/items')
        .send()
        .end(function(err, res) {
            should.equal(err.message, 'Bad Request');    // We expect an error here
            res.should.have.status(400);
            done();
        });
    });
    
    it('should respond with a 400 on POST without valid JSON', function(done) {
        chai.request(app)
        .post('/items')
        .send('foo')
        .end(function(err, res) {
            should.equal(err.message, 'Bad Request');
            res.should.have.status(400);
            done();
        });
    });
    
    it('should respond with a 404 on PUT without id in endpoint', function(done) {
        chai.request(app)
        .put('/items')          // Omit id, because that's the endpoint we're testing
        .send({'name': 'Spinach', 'id': 1})
        .end(function(err, res) {
            should.equal(err.message, 'Not Found');
            done();
        });
    });
    
    it('should respond with a 400 on PUT when ids in endpoint and body differ', function(done) {
        chai.request(app)
        .put('/items/1')
        .send({'name': 'Avocado', 'id': 2}) // ID in body not matching ID in URL
        .end(function(err, res) {
            should.equal(err.message, 'Bad Request');
            res.should.have.status(400);
            done();
        });
    });
    
    // FAILING TEST
    // TIM: see the commented-out if-block in app.put() in server.js. How can I verify that the passed in id exists?
    it('should respond with a 404 on PUT with nonexistent id', function(done) {
        chai.request(app)
        .put('/items/2001')     // Nonexistent ID
        .send({'name': 'Blackberries', 'id': 2001})
        .end(function(err, res) {
            should.equal(err.message, 'Not Found');
            res.should.have.status(404);
            done();
        });
    });
    
    // TIM: why is the `err` object null when it should be `{message: 'Bad Request'}`
    it('should respond with a 400 on PUT without body', function(done) {
        chai.request(app)
        .put('/items/1')
        .send()
        .end(function(err, res) {
            should.equal(err, 'Bad Request');
            res.should.have.status(400);
            done();
        });
    });
    
    // TIM: the condition `!('name' in req.body)` evaluates to true, so the 400 response should be sent (see app.put on server.js). 
    // What am I missing here?
    it('should respond with a 400 to a PUT without valid JSON', function(done) {
        chai.request(app)
        .put('/items/1')
        .send({'wrongKey': 'foobar'})
        .end(function(err, res) {
            should.equal(err.message, 'Bad Request');
            res.should.have.status(400);
            done();
        });
    });
    
    // TIM: same question as the '404 to a PUT with nonexistent id' test, around line 179. Once we solve one, we'll solve the other
    it('should respond with a 404 to a DELETE on an invalid id', function(done) {
        chai.request(app)
        .delete('/items/2001')
        .end(function(err, res) {
            should.equal(err.message, 'Not Found');
            res.should.have.status(404);
            done();
        });
    }); 
    
    it('should respond with a 400 to a DELETE without an id', function(done) {
        chai.request(app)
        .delete('/items')
        .end(function(err, res) {
            should.equal(err.message, 'Bad Request');
            res.should.have.status(400);
            done();
        });
    });
    
    // Try to think of any additional edge cases which could occur
    it('should respond with a 400 to a PUT where item name is not a string', function(done) {
        chai.request(app)
        .put('/items/1')
        .send({'name': 42, 'id': 1})
        .end(function(err, res) {
            should.equal(err.message, 'Bad Request');
            res.should.have.status(400);
            done();
        });
    });
    
});