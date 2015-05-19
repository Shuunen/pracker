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

/*
 * Display tiny charts like ▁▄▆█▂▁
 * Ex : sparkline([10.55, 9.60, 10.20]) -> (string) "█▄▆"
 */
var sparkline = function (numbers) {

    // make a clone copy
    var originalNumbers = (JSON.parse(JSON.stringify(numbers)));

    // multiply values by 100, 10.55 & 10.20 are like ▁▁ but 1055 and 1020 are like ▂▁
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
};

