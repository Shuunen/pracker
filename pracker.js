// Database
var dbFile = './public/db.json';
var low = require('lowdb');
low.mixin(require('underscore-db'));

// Server
var jsonServer = require('json-server');
var router = jsonServer.router(dbFile);
var db = router.db;
var server = jsonServer.create();
server.use(jsonServer.defaults);
server.use(router);
server.listen(3000);

// Job
var PriceFinder = require("price-finder");
var priceFinder = new PriceFinder();
var checkPrices = function (data) {
    console.log('=== ' + new Date().toTimeString().split(' ')[0] + ' ' + data.name + ' ===');
    var products = db('products').value();
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        checkPrice(product);
    }
};

// Utils
var ellipse = function (str) {
    var limit = 30;
    return (str === str.substr(0, limit) ? str : str.substr(0, limit) + '...');
};
var checkPrice = function (product) {
    priceFinder.findItemDetails(product.uri, function (err, data) {

        var identifier = ellipse(data.name);
        var bModified = false;

        console.log('checking ' + identifier);

        if (!product.lowestPrice || (product.lowestPrice && data.price < product.lowestPrice)) {
            // FIXME : this log never shows up
            console.log(identifier + ' : lowestPrice change from ' + product.lowestPrice + ' to ' + data.price);
            product.lowestPrice = data.price;
            bModified = true;
        }

        if (!product.highestPrice || (product.highestPrice && data.price > product.highestPrice)) {
            // FIXME : this log never shows up
            console.log(identifier + ' : highestPrice change from ' + product.highestPrice + ' to ' + data.price);
            product.highestPrice = data.price;
            bModified = true;
        }

        if (!product.price || (product.price && product.price !== data.price)) {
            product.price = data.price;
            bModified = true;
        }

        if (!product.name || (product.name && product.name !== data.name)) {
            product.name = data.name;
            bModified = true;
        }

        if (bModified) {
            db.save();
        }
    });
};

// Scheduler
var schedule = require('./node_modules/pomelo-schedule/lib/schedule');
var minutes = 15;
var seconds = minutes * 60;
var milliseconds = seconds * 1000;
schedule.scheduleJob({
    period: milliseconds
}, checkPrices, {name: 'checkPrices'});
