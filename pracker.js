// Database
var dbFile = './public/db.json';
var low = require('lowdb');
low.mixin(require('underscore-db'));
var db = low(dbFile);

// Server
var jsonServer = require('json-server');
var router = jsonServer.router(dbFile);
var server = jsonServer.create();
server.use(jsonServer.defaults);
server.use(router);
server.listen(3000);

// Job
var PriceFinder = require("price-finder");
var priceFinder = new PriceFinder();
var checkPrices = function (data) {
    console.log('=== ' + data.name + ' ===');
    var products = db('products').value();
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        checkPrice(product);
    }
};

var checkPrice = function (product) {
    priceFinder.findItemDetails(product.uri, function (err, data) {

        console.log('found ' + data.name + ' at ' + data.price + ', last price was : ' + product.price);

        console.log('  ' + data.price + ' < ' + product.lowestPrice + ' ? lowestPrice ' + (data.price < product.lowestPrice ? '' : 'NOT ') + 'updated');
        if (!product.lowestPrice || (product.lowestPrice && data.price < product.lowestPrice)) {
            product.lowestPrice = data.price;
        }

        console.log('  ' + data.price + ' > ' + product.highestPrice + ' ? highestPrice ' + (data.price > product.highestPrice ? '' : 'NOT ') + 'updated');
        if (!product.highestPrice || (product.highestPrice && data.price > product.highestPrice)) {
            product.highestPrice = data.price;
        }

        console.log('  ' + data.price + ' !== ' + product.price + ' ? price ' + (data.price !== product.price ? '' : 'NOT ') + 'updated');
        if (!product.price || (product.price && product.price !== data.price)) {
            product.price = data.price;
        }

        if (!product.name || (product.name && product.name !== data.name)) {
            product.name = data.name;
        }

        product.toto = 42;
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
