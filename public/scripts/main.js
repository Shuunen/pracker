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
            },
            {
                "data": "prices" // fake placeholder for actions display
            }
        ],
        "columnDefs": [
            {
                "render": function (data, type, row) {
                    return '<a href="' + row['uri'] + '" title="id : ' + row['id'] + '" data-id="' + row['id'] + '">' + row['name'] + '</a>';
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
                    var lastPrices = getLastNPrices(row, 10);
                    return sparkline(lastPrices);
                },
                "targets": 3
            },
            {
                "type": 'chart',
                "render": function () {
                    var deleteIcon = '<span class="glyphicon glyphicon-remove action-remove"></span>';
                    return '<span class="col-sm-12 text-center actions">' + deleteIcon + '</span>';
                },
                "targets": 4
            }
        ]
    });

}

/*
 * Return an array of the last n prices
 * Ex : getLastNPrices(product, 3) -> (array) [10.55, 9.60, 10.20]
 */
var getLastNPrices = function (product, limit) {

    var lastNPrices = [];

    if (product.prices) {

        var dates = JSON.stringify(product.prices).match(/\d{4}-\d{2}-\d{2}/g).sort();
        var sliceStart = ((dates.length - limit) > 0) ? (dates.length - limit) : 0;
        sliceStart = sliceStart > 0 ? sliceStart : 0;
        var lastNDates = dates.slice(sliceStart, dates.length);

        for (var i = 0; i < lastNDates.length; i++) {
            var date = lastNDates[i];
            var value = product.prices[date];
            lastNPrices.push(value);
        }
    }

    return lastNPrices;
};

function handleForm() {

    var form = document.querySelector('form.action-add');
    var addInput = form.querySelector('input');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (addInput.value.length) {
            console.log('add product : ' + addInput.value);
            var newProduct = {
                "uri": addInput.value
            };
            $.ajax({
                url: 'products',
                data: newProduct,
                type: 'POST',
                success: function () {
                    addInput.value = '';
                    $.smkAlert({text: 'Product added"', type: 'success'});
                },
                error: function () {
                    $.smkAlert({text: 'Product has not been added"', type: 'danger'});
                }
            });
        }
    });

}

function handleActions() {

    $('body').on('click', '.glyphicon', function () {

        var $this = $(this);
        var productId = $this.parents('tr').find('a[data-id]').attr('data-id');

        if ($this.hasClass('action-remove')) {
            console.log('removing product with id ' + productId);
            $.ajax({
                url: 'products/' + productId,
                type: 'DELETE',
                success: function () {
                    $.smkAlert({text: 'Product deleted"', type: 'success'});
                    var $tr = $this.parents('tr');
                    $tr.fadeOut('slow', function () {
                        $('#table').DataTable().row($tr[0]._DT_RowIndex).remove().draw();
                    });
                },
                error: function () {
                    $.smkAlert({text: 'Product ' + productId + ' has not been deleted"', type: 'danger'});
                }
            });
        }

    });

}

function init() {
    handleForm();
    handleActions();
    initDatatable();
}

init();
