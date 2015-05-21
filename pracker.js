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
            checkNext(products, ++i);
            return;
        }

        // if no product name or if name changed
        data.name = cleanProductName(data.name);
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

        // calculate medianPrice & medianDiscount
        var lastPrices = getLastNPrices(product, 200);
        var middleIndex = parseInt(lastPrices.length / 2);
        var sortedPrices = lastPrices.sort();
        var medianPrice = sortedPrices[middleIndex];
        var lastPrice = getLastNPrices(product, 1)[0];
        var medianDiscount = Math.round((1 - (lastPrice / medianPrice)) * 100);
        var diffLastNewMedianPrice = Math.round((1 - ((product.medianPrice - medianPrice) / medianPrice)) * 100);

        // if the median price goes down and the change is a least 1%
        if ((medianPrice < product.medianPrice) && (diffLastNewMedianPrice > 1)) {
            log('median price is now ' + medianPrice + ' (' + diffLastNewMedianPrice + '% lower) for : ' + data.name);
        }

        // if the median discount is nice
        if (medianDiscount > 30) {
            log('great discount : ' + medianDiscount + '% off !', data.name);
        } else if (medianDiscount > 20) {
            log('nice discount : ' + medianDiscount + '% off', data.name);
        }

        // update medianPrice & medianDiscount
        product.medianPrice = medianPrice;
        product.medianDiscount = medianDiscount;

        // check next product
        checkNext(products, ++i);
    });

};
var cleanProductName = function (str) {

    str = str.replace(' jeu video', '');

    return str;

};

/*
 * Return an array of the last n prices
 * Ex : getLastNPrices(product, 3) -> (array) [10.55, 9.60, 10.20]
 */
var getLastNPrices = function (product, limit) {

    var dates = JSON.stringify(product.prices).match(/\d{4}-\d{2}-\d{2}/g).sort();
    var sliceStart = ((dates.length - limit) > 0) ? (dates.length - limit) : 0;
    sliceStart = sliceStart > 0 ? sliceStart : 0;
    var lastNDates = dates.slice(sliceStart, dates.length);
    var lastNPrices = [];
    for (var i = 0; i < lastNDates.length; i++) {
        var date = lastNDates[i];
        var value = product.prices[date];
        lastNPrices.push(value);
    }
    return lastNPrices;
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
    period: 60 * 60 * 1000 // 1 hour
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