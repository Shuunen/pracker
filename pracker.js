// Database
var low = require('lowdb');
low.mixin(require('underscore-db'));
var db = low('db.json');

// Server
var jsonServer = require('json-server');
var router = jsonServer.router('db.json'); // Express router
var server = jsonServer.create();          // Express server
server.use(jsonServer.defaults);           // Default middleware (logger, public, ...)
server.use(router);
server.listen(3000);

// Job
var PriceFinder = require("price-finder");
var priceFinder = new PriceFinder();
var checkPrices = function (data) {
    console.log(data.name);

    var products = db('products').value();
    for (var i = 0; i < products.length; i++) {
        var product = products[i];

        checkPrice(product);
    }
};

var checkPrice = function (product) {
    priceFinder.findItemDetails(product.uri, function (err, data) {

        console.log('found ' + data.name + ' at ' + data.price);

        if (!product.lowestPrice || (product.lowestPrice && data.price < product.lowestPrice)) {
            product.lowestPrice = data.price;
        }

        if (!product.highestPrice || (product.highestPrice && data.price > product.highestPrice)) {
            product.highestPrice = data.price;
        }

        if (!product.price || (product.price && product.price !== data.price)) {
            product.price = data.price;
        }

        if (!product.name || (product.name && product.name !== data.name)) {
            product.name = data.name;
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
