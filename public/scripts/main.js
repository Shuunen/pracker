function initDatatable() {

    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "currency-pre": function (a) {
            a = (a === "-") ? 0 : a.replace(/[^\d\-\.]/g, "");
            return parseFloat(a);
        },
        "discount-pre": function (a) {
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
        "columns": [
            {
                "data": "name"
            },
            {
                "data": "price"
            },
            {
                "data": "price" // fake placeholder for discount display
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
                    return '<span title="from ' + formatMoney(row['lowestPrice']) + ' to ' + formatMoney(row['highestPrice']) + '">' + formatMoney(row['price']) + '</span>';
                },
                "targets": 1
            },
            {
                "type": 'discount',
                "render": function (data, type, row) {

                    // type cast security
                    price = parseFloat(parseFloat(row['price']).toFixed(2));
                    lowestPrice = parseFloat(parseFloat(row['lowestPrice']).toFixed(2));
                    highestPrice = parseFloat(parseFloat(row['highestPrice']).toFixed(2));

                    var average = (lowestPrice + highestPrice) / 2;
                    var discount = (1 - (price / average)) * 100;
                    discount = (isNaN(discount) ? 0 : discount.toFixed(0)) + '%';
                    var difference = Math.round(average - price);
                    difference = difference ? ' - ' + difference + '€' : '';
                    return discount + difference;
                },
                "targets": 2
            }
        ]
    });

}

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
                .done(function (data) {
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
