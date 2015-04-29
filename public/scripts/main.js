function initDatatable() {

    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "currency-pre": function (a) {
            a = (a === "-") ? 0 : a.replace(/[^\d\-\.]/g, "");
            var pre = parseFloat(a);
            // console.log(pre);
            return pre;
        },

        "currency-asc": function (a, b) {
            return a - b;
        },

        "currency-desc": function (a, b) {
            return b - a;
        }
    });

    $('#table').dataTable({
        "ajax": {
            "url": 'db.json',
            "dataSrc": 'products'
        },
        "order": [[1, "asc"]],
        "columns": [
            {
                "data": "name"
            },
            {
                "data": "price"
            },
            {
                "data": "lowestPrice"
            },
            {
                "data": "highestPrice"
            },
            {
                "data": "id"
            }
        ],
        "columnDefs": [
            {
                "render": function (data, type, row) {
                    return '<a href="' + row['uri'] + '">' + row['name'] + '</a>';
                },
                "targets": 0
            },
            {
                "type": 'currency',
                "render": function (data) {
                    return formatMoney(data);
                },
                "targets": [1, 2, 3]
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
