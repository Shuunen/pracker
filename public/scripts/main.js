/*
 * Display tiny charts like ▁▄▆█▂▁
 * Ex : sparkline([10.55, 9.60, 10.20]) -> (string) "█▄▆"
 */
var sparkline = function (numbers) {

    // make a clone copy
    var originalNumbers = (JSON.parse(JSON.stringify(numbers)));

    for (i = 0; i < numbers.length; i++) {
        numbers[i] = numbers[i] * 100;
    }

    var ticks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
        max = Math.max.apply(null, numbers),
        min = Math.min.apply(null, numbers),
        line = '',
        f, i;

    f = ~~(((max - min) << 8) / (ticks.length - 1));

    if (f < 1) {
        f = 1;
    }

    for (i = 0; i < numbers.length; i++) {
        var number = numbers[i];
        var originalNumber = originalNumbers[i];
        var bar = ticks[~~(((number - min) << 8) / f)];
        bar = '<div class="sparkline-bar hint--top hint--no-animate" data-hint="' + originalNumber + '">' + bar + '</div>';
        line += bar;
    }

    line = '<div class="sparkline-line">' + line + '</div>';

    return line;
}

/*
 * Return an array of the last n prices
 * Ex : getLastNPrices(product, 3) -> (array) [10.55, 9.60, 10.20]
 */
var getLastNPrices = function (product, limit) {

    var orderedDates = _.sortBy(_.keys(product.prices));
    var lastNDates = orderedDates.splice(orderedDates.length - limit, orderedDates.length);
    var lastNPrices = [];
    for (var i = 0; i < lastNDates.length; i++) {
        var date = lastNDates[i];
        var value = product.prices[date];
        lastNPrices.push(value);
    }

    return lastNPrices;
}

/*
 * Initialize datatables
 */
function initDatatable() {

    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "currency-pre": function (a) {
            a = $(a).text();
            a = a.split('%')[0];
            return parseFloat(a);
        },
        "discount-pre": function (a) {
            a = $(a).text();
            a = a.split('%')[0];
            return parseFloat(a);
        }
    });

    $('#table').dataTable({
        "ajax": {
            "url": 'db.json',
            "dataSrc": 'products'
        },
        "order": [[2, "desc"]],
        "lengthMenu": [[25, 50, -1], [25, 50, "All"]],
        "columns": [
            {
                "data": "name"
            },
            {
                "data": "prices"
            },
            {
                "data": "prices" // fake placeholder for discount display
            },
            {
                "data": "prices" // fake placeholder for chart display
            }
        ],
        "columnDefs": [
            {
                "render": function (data, type, row) {
                    return '<a href="' + row['uri'] + '" title="id : ' + row['id'] + '">' + row['name'] + '</a>';
                },
                "targets": 0
            },
            {
                "type": 'currency',
                "render": function (data, type, row) {
                    var lastPrice = getLastNPrices(row, 1)[0];
                    return '<span class="col-sm-12 text-right">' + formatMoney(lastPrice) + '</span>';
                },
                "targets": 1
            }, {
                "type": 'discount',
                "render": function (data, type, row) {
                    var niceDiscountClass = (row['medianDiscount'] > 20) ? 'nice-discount' : '';
                    return '<span class="col-sm-12 text-right ' + niceDiscountClass + '" title="median price : ' + formatMoney(row['medianPrice']) + '">' + row['medianDiscount'] + '&nbsp;%</span>';
                },
                "targets": 2
            },
            {
                "type": 'chart',
                "render": function (data, type, row) {
                    return sparkline(getLastNPrices(row, 10));
                },
                "targets": 3
            }
        ]
    });

}

/*
 * Format raw numbers to money display
 * Ex : formatMoney(5.96) -> (string) "5,96 €"
 */
function formatMoney(number, currency, decPlaces, thouSeparator, decSeparator) {
    currency = currency === undefined ? '&euro;' : currency;
    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
    decSeparator = decSeparator == undefined ? "," : decSeparator;
    thouSeparator = thouSeparator == undefined ? " " : thouSeparator;
    var sign = number < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+number || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(number - i).toFixed(decPlaces).slice(2) : "") + ' ' + currency;
}

function handleForm() {

    var form = document.querySelector('form');
    var addInput = form.querySelector('input');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (addInput.value.length) {
            console.log('add product : ' + addInput.value);
            var newProduct = {
                "uri": addInput.value
            };
            $.post("products", newProduct)
                .done(function () {
                    addInput.value = '';
                    var line = $('<p>Product added :)</p>');
                    $(form).append(line);
                    setTimeout(function () {
                        line.remove();
                    }, 1500);
                });
        }
    });

}


function init() {
    handleForm();
    initDatatable();
}

init();
