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

// Desktop notification
var notifier = require('node-notifier');
var notifierOptions = {
    /*title: "A title",
    message: "A message"*/
};

// Mobile notification
var nma = require("nma");
var nmaOptions = {
    "apikey": "YOUR_API_KEY",
    "application": "Pracker",/*
    "event": "An Event",
    "description": "And a description of that event...",
    "priority": 0, // Priority
    "url": "http://www.somewebsite.com/",*/
    "content-type": "text/plain"
};

// Job
var PriceFinder = require("price-finder");
var priceFinder = new PriceFinder();
var checkPrices = function (data) {
    log('job ' + data.name + ' started');
    var products = db('products').value();
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        checkPrice(product);
    }
};

// Utils
var log = function (message, title) {
    var str = message;
    if (title) {
        // desktop notification
        notifierOptions.title = title;
        notifierOptions.message = message;
        notifier.notify(notifierOptions);
        str = title + ' : ' + message;
        // mobile notification
        nmaOptions.event = title;
        nmaOptions.description = message;
        nma(nmaOptions);
    }
    console.log('=== ' + new Date().toTimeString().split(' ')[0] + ' ' + str + ' ===');
};
var ellipse = function (str) {
    var limit = 30;
    return (str === str.substr(0, limit) ? str : str.substr(0, limit) + '...');
};
var checkPrice = function (product) {
    priceFinder.findItemDetails(product.uri, function (err, data) {

        if(!data || !data.name){
            log('data error on product uri : ' + product.uri);
            return;
        }

        var identifier = ellipse(data.name);
        var bModified = false;

        if (!product.lowestPrice || (product.lowestPrice && data.price < product.lowestPrice)) {
            if (product.lowestPrice) {
                log('price drop from ' + product.lowestPrice + ' to ' + data.price, identifier);
            }
            product.lowestPrice = data.price;
            bModified = true;
        }

        if (!product.highestPrice || (product.highestPrice && data.price > product.highestPrice)) {
            if(product.highestPrice) {
                log('price jump from ' + product.highestPrice + ' to ' + data.price, identifier);
            }
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
var minutes = 30;
var seconds = minutes * 60;
var milliseconds = seconds * 1000;
schedule.scheduleJob({
    period: milliseconds
}, checkPrices, {name: 'checkPrices'});
