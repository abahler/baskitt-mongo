// URL can be specified one of three ways:
// environment var, global application var, or by setting NODE_ENV to production
exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                       (process.env.NODE_ENV === 'production' ?
                            'mongodb://thinkful:8#dsfjk72@ds031157.mlab.com:31157/baskitt' :
                            // 'mongodb://localhost/shopping-list':
                            'mongodb://localhost/shopping-list-dev');
                            
// Remember, it should be `PORT`, not `port`
exports.PORT = process.env.PORT || 5000;