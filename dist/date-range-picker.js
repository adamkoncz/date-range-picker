(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "moment"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var moment = require("moment");
    var DateRangePicker = (function () {
        function DateRangePicker(preferences) {
            if (preferences === void 0) { preferences = {}; }
            this._o = (function () {
                var api;
                var element;
                var config;
                var dayLength = 1000 * 60 * 60 * 24;
                var defaults = {
                    start: new Date(),
                    end: new Date(Date.now() + (30 * dayLength)),
                    id: 'date-range-picker',
                    selectionType: 'sequential',
                    firstSelectionDuration: 1,
                    nightSelection: false,
                    monthFormat: 'MMMM'
                }, monthIndex = 0;
                var dateString = 'YYYY-MM-DD';
                var monthString = 'YYYY-MM';
                var setConfig = function (preferences) {
                    config = Object.assign({}, defaults, preferences);
                    if (element)
                        element.innerHTML = '';
                    element = document.getElementById(config.id);
                    if (!element) {
                        throw new Error('Element with ID "' + config.id + '" does not exists.');
                    }
                    if (config.locale) {
                        moment.locale(config.locale);
                    }
                    else {
                    }
                    render(element, config);
                };
                var render = function (el, conf) {
                    el.innerHTML = '';
                    var s = moment(conf.start).startOf('month');
                    var e = moment(conf.end).endOf('month');
                    var t = s.clone();
                    var months = {};
                    while (t.isBetween(s, e, null, '[]')) {
                        var outOfRange = !t.isBetween(conf.start, conf.end, null, '[]');
                        var isLocked = conf.locked && (conf.locked.indexOf(t.format(dateString)) > -1);
                        var monthDate = t.format(monthString);
                        months[monthDate] = months[monthDate] || {
                            weeks: {},
                            name: t.format(config.monthFormat),
                            id: monthDate
                        };
                        var weekNum = t.format('YYYY-w');
                        months[monthDate].weeks[weekNum] = months[monthDate].weeks[weekNum] || {
                            days: [{}, {}, {}, {}, {}, {}, {}],
                            id: weekNum,
                            start: t.clone().startOf('week')
                        };
                        var dayNum = t.weekday();
                        var dd = t.date();
                        months[monthDate].weeks[weekNum].days[dayNum] = {
                            value: t,
                            date: t.date(),
                            name: t.format('dddd'),
                            short: t.format('ddd'),
                            outOfRange: outOfRange,
                            isLocked: isLocked
                        };
                        t = t.clone();
                        t.add(1, 'd');
                    }
                    Object.keys(months).forEach(function (monthDate) {
                        Object.keys(months[monthDate].weeks).forEach(function (weekNum) {
                            var week = months[monthDate].weeks[weekNum];
                            week.days.forEach(function (day, ix) {
                                if (!day.value) {
                                    var w = week.start.clone().add(ix, 'd');
                                    var outOfRange = !w.isBetween(conf.start, conf.end, null, '[]');
                                    day.value = w;
                                    day.date = w.date();
                                    day.name = w.format('dddd');
                                    day.short = w.format('ddd');
                                    day.filler = true;
                                    day.outOfRange = outOfRange;
                                }
                            });
                        });
                    });
                    var drp = document.createElement('div');
                    drp.className = 'drp';
                    drp.appendChild(createToolElement());
                    var drpScroller = document.createElement('div');
                    drpScroller.className = 'drp_scroller';
                    drp.appendChild(drpScroller);
                    Object.keys(months).forEach(function (monthDate) {
                        drpScroller.appendChild(createMonthElement(months[monthDate]));
                    });
                    el.appendChild(drp);
                    bind(document.querySelectorAll('.drp_day'), 'click', clickHandler);
                    bind(document.querySelectorAll('.drp_left-arrow'), 'click', leftArrowClickHandler);
                    bind(document.querySelectorAll('.drp_right-arrow'), 'click', rightArrowClickHandler);
                };
                var createToolElement = function () {
                    var el = document.createElement('div');
                    el.className = 'drp_toolbar';
                    var left = document.createElement('div');
                    left.className = 'drp_left-arrow';
                    left.innerHTML = '<i class="material-icons">navigate_before</i>';
                    el.appendChild(left);
                    var right = document.createElement('div');
                    right.className = 'drp_right-arrow';
                    right.innerHTML = '<i class="material-icons">navigate_next</i>';
                    el.appendChild(right);
                    return el;
                };
                var createMonthElement = function (month) {
                    var el = document.createElement('div');
                    el.className = 'drp_month';
                    el.setAttribute('data-id', month.id);
                    el.setAttribute('data-name', month.name);
                    Object.keys(month.weeks).forEach(function (weekNum) {
                        el.appendChild(createWeekElement(month.weeks[weekNum]));
                    });
                    return el;
                };
                var createWeekElement = function (week) {
                    var el = document.createElement('div');
                    el.className = 'drp_week';
                    el.setAttribute('data-id', week.id);
                    week.days.forEach(function (day, ix) {
                        el.appendChild(createDayElement(day));
                    });
                    return el;
                };
                var createDayElement = function (day) {
                    var el = document.createElement('div');
                    el.className = 'drp_day';
                    el.setAttribute('data-id', day.date);
                    el.setAttribute('data-name', day.name);
                    el.setAttribute('data-short', day.short);
                    el.setAttribute('data-value', day.value.format(dateString));
                    el.setAttribute('data-locked', day.isLocked);
                    if (day.isLocked) {
                        addClass(el, 'drp_locked');
                    }
                    if (day.filler) {
                        addClass(el, 'drp_placeholder');
                    }
                    if (day.outOfRange) {
                        addClass(el, 'drp_out-of-range');
                    }
                    var dayel = document.createElement('div');
                    dayel.className = 'drp_day_content';
                    dayel.setAttribute('data-id', day.date);
                    el.appendChild(dayel);
                    return el;
                };
                var toggleClass = function (el, className) {
                    if (hasClass(el, className)) {
                        removeClass(el, className);
                    }
                    else {
                        addClass(el, className);
                    }
                };
                var addClass = function (el, className) {
                    if (!hasClass(el, className)) {
                        var classnames = el.className.split(' ');
                        classnames.push(className);
                        el.className = classnames.join(' ');
                    }
                };
                var removeClass = function (el, className) {
                    if (hasClass(el, className)) {
                        var classnames = el.className.split(' ');
                        var ix = classnames.indexOf(className);
                        classnames.splice(ix, 1);
                        el.className = classnames.join(' ');
                    }
                };
                var hasClass = function (el, className) {
                    var classnames = el.className.split(' ');
                    return classnames.indexOf(className) > -1;
                };
                var bind = function (elements, event, handler) {
                    for (var i = 0; i < elements.length; i++) {
                        var el = elements[i];
                        el.addEventListener(event, handler, true);
                    }
                };
                var clickHandler = function (event) {
                    var target = event.currentTarget;
                    var targetDate = target.getAttribute('data-value');
                    if (isOutOfSequence(targetDate)) {
                        deselectAll();
                        clearOutOfSequence();
                    }
                    select(targetDate, values().length ? 1 : config.firstSelectionDuration);
                };
                var leftArrowClickHandler = function (event) {
                    var target = event.currentTarget;
                    var scroller = element.querySelector('.drp_scroller');
                    var scrollLeft = scroller.scrollLeft;
                    var months = arrayFrom(scroller.children);
                    var next;
                    if (monthIndex > 0) {
                        next = months[--monthIndex];
                    }
                    if (next) {
                        scroller.scrollLeft = next.offsetLeft;
                    }
                };
                var rightArrowClickHandler = function (event) {
                    var target = event.currentTarget;
                    var scroller = element.querySelector('.drp_scroller');
                    var scrollLeft = scroller.scrollLeft;
                    var months = arrayFrom(scroller.children);
                    var next;
                    if (monthIndex < months.length - 1) {
                        next = months[++monthIndex];
                    }
                    if (next) {
                        scroller.scrollLeft = next.offsetLeft;
                    }
                };
                var deselectAll = function () {
                    arrayFrom(document.querySelectorAll('.drp_selected')).forEach(function (el) {
                        removeClass(el, 'drp_selected');
                    });
                };
                var goto = function (targetDate) {
                    var month = moment(targetDate).format(monthString);
                    var scroller = element.querySelector('.drp_scroller');
                    var months = arrayFrom(scroller.children);
                    var index = months.reduce(function (a, b, ix) {
                        if (b.getAttribute('data-id') == month) {
                            a = ix;
                        }
                        return a;
                    });
                    var next = months[index];
                    if (next) {
                        monthIndex = index;
                        scroller.scrollLeft = next.offsetLeft;
                    }
                };
                var select = function (targetDate, duration) {
                    if (duration === void 0) { duration = 1; }
                    if (!targetDate) {
                        if (config.onchange)
                            config.onchange();
                        return deselectAll();
                    }
                    targetDate = moment(targetDate);
                    var targets = [];
                    for (var i = 0; i < duration; i++) {
                        var targetString = targetDate.clone().add(i, 'd').format(dateString);
                        targets.push(targetString);
                    }
                    if (validateDates(targets)) {
                        if (config.selectionType == 'sequential') {
                            var vals = values('moment');
                            if (vals.length) {
                                var first = vals[0];
                                var last = vals[vals.length - 1];
                                if (targetDate.isSame(first) || targetDate.isSame(last)) {
                                    if (config.firstSelectionDuration > 1 && config.firstSelectionDuration >= values().length) {
                                        deselectAll();
                                        targets = [];
                                    }
                                }
                                else if (targetDate.isAfter(first)) {
                                    targets = [];
                                    var t = first.clone();
                                    while (targetDate.isAfter(t)) {
                                        var ts = t.format(dateString);
                                        targets.push(ts);
                                        t = t.clone().add(1, 'd');
                                    }
                                    targets.push(targetDate.format(dateString));
                                    deselectAll();
                                }
                                else if (targetDate.isBefore(first)) {
                                    targets = [];
                                    var t = targetDate.clone();
                                    while (last.isAfter(t)) {
                                        var ts = t.format(dateString);
                                        targets.push(ts);
                                        t = t.clone().add(1, 'd');
                                    }
                                    targets.push(last.format(dateString));
                                    deselectAll();
                                }
                            }
                        }
                        targets.forEach(function (targetString) {
                            var elements = document.querySelectorAll('[data-value="' + targetString + '"]');
                            for (var i = 0; i < elements.length; i++) {
                                var el = elements[i];
                                selectIfValid(el);
                            }
                        });
                        var vs = values();
                        lockOutOfSequence(vs[0]);
                        if (config.nightSelection) {
                        }
                        if (config.onchange)
                            config.onchange();
                    }
                    ;
                };
                var clearOutOfSequence = function () {
                    arrayFrom(document.querySelectorAll('.drp_out-of-sequence')).forEach(function (el) {
                        removeClass(el, 'drp_out-of-sequence');
                    });
                };
                var lockOutOfSequence = function (date) {
                    clearOutOfSequence();
                    if (config.selectionType == 'sequential' && date) {
                        var targetDate = toType(date, 'moment');
                        var t = targetDate.clone();
                        var ts = t.format(dateString);
                        while (validateDates([ts])) {
                            t.subtract(1, 'd');
                            ts = t.format(dateString);
                        }
                        var backDate_1 = t.clone();
                        t = targetDate.clone();
                        ts = t.format(dateString);
                        while (validateDates([ts])) {
                            t.add(1, 'd');
                            ts = t.format(dateString);
                        }
                        var forwDate_1 = t.clone();
                        var dayElements = arrayFrom(document.querySelectorAll('.drp_day'));
                        dayElements.forEach(function (el) {
                            var d = moment(el.getAttribute('data-value'));
                            if (!d.isBetween(backDate_1, forwDate_1)) {
                                addClass(el, 'drp_out-of-sequence');
                            }
                        });
                    }
                };
                var minDate = function (arr, type) {
                    if (type === void 0) { type = 'string'; }
                    var result = arr.reduce(function (a, b) {
                        if (!a) {
                            return toType(b, type);
                        }
                        var _a = moment(a);
                        var _b = moment(b);
                        if (_a.isBefore(_b))
                            return toType(_a, type);
                        if (_a.isAfter(_b))
                            return toType(_b, type);
                        if (_a.isSame(_b))
                            return toType(_a, type);
                    }, null);
                    return result;
                };
                var maxDate = function (arr, type) {
                    if (type === void 0) { type = 'string'; }
                    var result = arr.reduce(function (a, b) {
                        if (!a) {
                            return toType(b, type);
                        }
                        var _a = moment(a);
                        var _b = moment(b);
                        if (_a.isBefore(_b))
                            return toType(_b, type);
                        if (_a.isAfter(_b))
                            return toType(_a, type);
                        if (_a.isSame(_b))
                            return toType(_a, type);
                    }, null);
                    return result;
                };
                var toType = function (a, type) {
                    if (type === void 0) { type = 'string'; }
                    var v = moment(a);
                    switch (type) {
                        case 'string':
                            return v.format(dateString);
                        case 'date':
                            return v.toDate();
                        case 'moment':
                            return v;
                        default:
                            return a;
                    }
                };
                var values = function (type) {
                    if (type === void 0) { type = 'string'; }
                    var res = [];
                    var elements = arrayFrom(document.querySelectorAll('.drp_selected'));
                    res = elements.reduce(function (a, el) {
                        var val = el.getAttribute('data-value');
                        a.push(toType(val, type));
                        return a;
                    }, []);
                    return res;
                };
                var validateDates = function (arr) {
                    var valid = arr.filter(function (a) {
                        var elements = arrayFrom(document.querySelectorAll('[data-value="' + a + '"]'));
                        var validElements = elements.filter(isValid);
                        return !!validElements.length;
                    });
                    return valid.length == arr.length;
                };
                var isSelectedDate = function (date) {
                    var a = moment(date).format(dateString);
                    var elements = arrayFrom(document.querySelectorAll('[data-value="' + a + '"]'));
                    var selected = elements.filter(function (el) {
                        return (hasClass(el, 'drp_selected'));
                    });
                    return !!selected.length;
                };
                var arrayFrom = function (arrLike) {
                    if (arrLike.length === undefined) {
                        throw new Error('Not Array like');
                    }
                    var arr = [];
                    for (var i = 0; i < arrLike.length; i++) {
                        arr.push(arrLike[i]);
                    }
                    return arr;
                };
                var isValid = function (el) {
                    if (!hasClass(el, 'drp_placeholder') &&
                        !hasClass(el, 'drp_out-of-range') &&
                        !hasClass(el, 'drp_locked') &&
                        !hasClass(el, 'drp_out-of-sequence')) {
                        return true;
                    }
                    else {
                        return false;
                    }
                };
                var isOutOfSequence = function (target) {
                    var b = false;
                    var a = moment(target).format(dateString);
                    var elements = arrayFrom(document.querySelectorAll('[data-value="' + a + '"]'));
                    var outOfSequencElementds = elements.filter(function (el) {
                        return hasClass(el, 'drp_out-of-sequence');
                    });
                    return !!outOfSequencElementds.length;
                };
                var selectIfValid = function (el) {
                    if (!hasClass(el, 'drp_placeholder') &&
                        !hasClass(el, 'drp_out-of-range') &&
                        !hasClass(el, 'drp_locked') &&
                        !hasClass(el, 'drp_out-of-sequence')) {
                        toggleClass(el, 'drp_selected');
                    }
                    else {
                    }
                };
                api = {
                    _setConfig: setConfig,
                    _select: select,
                    _values: values,
                    _goto: goto
                };
                return api;
            })();
            this._o._setConfig(preferences);
        }
        DateRangePicker.prototype.select = function (targetDate, duration) {
            if (duration === void 0) { duration = 1; }
            this._o._select(targetDate, duration);
        };
        DateRangePicker.prototype.values = function (type) {
            return this._o._values(type);
        };
        DateRangePicker.prototype.goto = function (targetDate) {
            this._o._goto(targetDate);
        };
        return DateRangePicker;
    }());
    exports.DateRangePicker = DateRangePicker;
});
//# sourceMappingURL=date-range-picker.js.map