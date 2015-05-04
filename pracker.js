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

// Notifications
var Growl = require('node-notifier').Growl;
var notifier = new Growl({
    name: 'Pracker',
    host: 'localhost',
    port: 23053
});
var notifierOptions = {
    wait: false
};


// Job
var PriceFinder = require("price-finder");
var priceFinder = new PriceFinder();
var checkPrices = function (data) {
    log('job ' + data.name + ' started');
    var products = db('products').value();
    checkNext(products);
};
var checkNext = function (products, i) {

    i = (typeof i !== 'undefined' ? i : 0);

    var product = products[i];

    if (!product) {
        // we reach the end of products array
        db.save();
        log('job ended, database is saving changes...');
        return;
    }

    priceFinder.findItemDetails(product.uri, function (err, data) {

        if (!data || !data.name) {
            log('data error on product uri : ' + product.uri);
            return;
        }

        // if no product name or if name changed
        if (!product.name || (product.name && product.name !== data.name)) {
            product.name = data.name;
        }

        // if no product prices
        if (!product.prices) {
            product.prices = {};
        }

        // save today's price
        var today = new Date().toISOString().split('T')[0];
        data.price = parseFloat(parseFloat(data.price).toFixed(2)); // type cast security
        log('adding price ' + data.price + ' for : ' + data.name);
        product.prices[today] = data.price;

        // check next product
        checkNext(products, ++i);
    });

};


// Logger and notifier
var log = function (message, title) {
    var str = message;
    if (title) {
        // add title to the log
        str = title + ' : ' + message;
        // send notification
        notifierOptions.title = title;
        notifierOptions.message = message;
        notifier.notify(notifierOptions);
    }
    console.log('=== ' + new Date().toTimeString().split(' ')[0] + ' ' + str + ' ===');
};

// Scheduler
var schedule = require('./node_modules/pomelo-schedule/lib/schedule');

schedule.scheduleJob({
    period: 30 * 60 * 1000 // 30 minutes
}, checkPrices, {name: 'checkPrices'});

// Test job
/*
 var notifyJob = function (data) {
 log('job ' + data.name + ' started');
 // send notification
 notifierOptions.title = 'Today date';
 notifierOptions.message = 'is : ' + new Date().toTimeString().split(' ')[0];
 notifier.notify(notifierOptions);
 };
 schedule.scheduleJob({
 period: 10 * 1000 // 10 seconds
 }, notifyJob, {name: 'notifyJob'});
 */

/* Snippet to batch add in browser :
 javascript:
 var r = new XMLHttpRequest();
 r.open("POST", "http://localhost:3000/products", true);
 r.onreadystatechange = function () {
 if (r.readyState != 4 || r.status != 200) return;
 console.info("Success: " + r.responseText);
 };
 r.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
 r.send("uri="+encodeURIComponent(document.location.href));
 */