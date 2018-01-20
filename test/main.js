require.config({
    paths: {
        drp: '../dist/date-range-picker',
        jquery: '../node_modules/jquery/dist/jquery',
        moment: '../node_modules/moment/min/moment-with-locales.min',

    },
    shims: {
        'drp': {
            deps: ['moment']
        }
    }
});



require(['drp', 'jquery'], function (drp, $) {
    console.log('require');

    $(function () {
        var days = 90;
        var from = new Date(new Date().getTime()).toISOString().split('T')[0];
        var to = new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * days)).toISOString().split('T')[0];

        var locked = [];
        [1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].forEach(function (el, ix) {
            var d;
            if (el === 0) {
                d = new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * ix)).toISOString().split('T')[0];
                locked.push(d);
            }
        });

        var d = new drp.DateRangePicker({
            locked: locked,
            start: new Date(Date.parse(from)),
            end: new Date(Date.parse(to)),
            selectionType: 'sequential',
            locale: 'nb',
            fisrtSelectionDuration: 2,
            monthFormat: 'MMMM YYYY',
            onchange: function () {
                console.log(d.values());
            }
        });

        window.drp = d;



    })



});