

import * as moment from 'moment';
import { Moment } from 'moment';

declare function require(path: string | Array<string>, fn?: Function): any;

type DateLike = Date | Moment | string;

type DateRange = {
    start: Date,
    end: Date
}

type Preferences = {
    start?: Date,
    end?: Date,
    id?: string,
    locale?: string,
    monthFormat?: string,
    selectionType?: string,
    firstSelectionDuration?:number,
    nightSelection?:boolean,
    locked?: Array<string>,
    onchange?: Function
}


export class DateRangePicker {

    select(targetDate: DateLike, duration: number = 1) {
        this._o._select(targetDate, duration);
    }

    values(type: string): Array<DateLike> {
        return this._o._values(type);
    }

    goto(targetDate:DateLike){
        this._o._goto(targetDate);
    }

    constructor(preferences: Preferences = {}) {
        this._o._setConfig(preferences);
    }

    private _o = (function () {
        let api;
        let element: HTMLElement;
        let config: Preferences;
        let dayLength: number = 1000 * 60 * 60 * 24;
        let defaults: Preferences = {
            start: new Date(),
            end: new Date(Date.now() + (30 * dayLength)),
            id: 'date-range-picker',
            selectionType: 'sequential',
            firstSelectionDuration:1,
            nightSelection:false,
            monthFormat:'MMMM'
        },
        monthIndex:number = 0;

        let dateString = 'YYYY-MM-DD';
        let monthString = 'YYYY-MM';

        let setConfig = (preferences: Preferences) => {
            config = <Preferences>(<any>Object).assign({}, defaults, preferences);

            if (element) element.innerHTML = '';
            element = document.getElementById(config.id);
            if (!element) {
                throw new Error('Element with ID "' + config.id + '" does not exists.');
            }

            if (config.locale) {
                moment.locale(config.locale);
            } else {

            }
            render(element, config);
        };

        let render = (el: HTMLElement, conf: Preferences) => {
            el.innerHTML = '';

            let s: Moment = moment(conf.start).startOf('month');
            let e: Moment = moment(conf.end).endOf('month');
            let t: Moment = s.clone();


            let months: any = {};

            while (t.isBetween(s, e, null, '[]')) {

                let outOfRange = !t.isBetween(conf.start, conf.end, null, '[]');

                let isLocked = conf.locked && (conf.locked.indexOf(t.format(dateString)) > -1);

                let monthDate = t.format(monthString);

                months[monthDate] = months[monthDate] || {
                    weeks: {},
                    name: t.format(config.monthFormat),
                    id: monthDate
                };

              

                let weekNum: string = t.format('YYYY-w'); //.isoWeek() //t.weekYear() returns number

                months[monthDate].weeks[weekNum] = months[monthDate].weeks[weekNum] || {
                    days: [{}, {}, {}, {}, {}, {}, {}],
                    id: weekNum,
                    start: t.clone().startOf('week')
                }

                let dayNum: number = t.weekday();//t.day();
                let dd = t.date();
                months[monthDate].weeks[weekNum].days[dayNum] = {
                    value: t,
                    date: t.date(),
                    name: t.format('dddd'),
                    short: t.format('ddd'),
                    outOfRange: outOfRange,
                    isLocked: isLocked
                }

                t = t.clone();
                t.add(1, 'd');
            }

            Object.keys(months).forEach(function (monthDate) {
                Object.keys(months[monthDate].weeks).forEach(function (weekNum) {
                    let week = months[monthDate].weeks[weekNum];
                    //Fill the week if overaps month
                    week.days.forEach(function (day, ix) {
                        if (!day.value) {
                            let w = week.start.clone().add(ix, 'd');
                            let outOfRange = !w.isBetween(conf.start, conf.end, null, '[]')
                            day.value = w;
                            day.date = w.date();
                            day.name = w.format('dddd');
                            day.short = w.format('ddd');
                            day.filler = true;
                            day.outOfRange = outOfRange
                        }
                    });
                })
            })

            let drp: HTMLElement = document.createElement('div');
            drp.className = 'drp';

            drp.appendChild(createToolElement());

            let drpScroller: HTMLElement = document.createElement('div');
            drpScroller.className = 'drp_scroller';

            drp.appendChild(drpScroller);

            Object.keys(months).forEach(function (monthDate) {
                drpScroller.appendChild(createMonthElement(months[monthDate]))
            })

            el.appendChild(drp);


            //Assign event listeners to day elements
            bind(document.querySelectorAll('.drp_day'), 'click', clickHandler);

            bind(document.querySelectorAll('.drp_left-arrow'), 'click', leftArrowClickHandler);
            bind(document.querySelectorAll('.drp_right-arrow'), 'click', rightArrowClickHandler);

        }

        let createToolElement = (): HTMLElement => {
            let el = document.createElement('div');
            el.className = 'drp_toolbar';

            //left arrow
            let left = document.createElement('div');
            left.className = 'drp_left-arrow';
            left.innerHTML = '<i class="material-icons">navigate_before</i>';
            el.appendChild(left);

            //right arrow
            let right = document.createElement('div');
            right.className = 'drp_right-arrow';
            right.innerHTML = '<i class="material-icons">navigate_next</i>';
            el.appendChild(right);

            return el;
        }

        let createMonthElement = (month: any): HTMLElement => {
            let el = document.createElement('div');


            el.className = 'drp_month';
            el.setAttribute('data-id', month.id);
            el.setAttribute('data-name', month.name);


            Object.keys(month.weeks).forEach(function (weekNum) {
                el.appendChild(createWeekElement(month.weeks[weekNum]));
            })

            return el;
        }

        let createWeekElement = (week: any): HTMLElement => {
            let el = document.createElement('div');

            el.className = 'drp_week';
            el.setAttribute('data-id', week.id);

            week.days.forEach(function (day, ix) {
                el.appendChild(createDayElement(day));
            });

            return el;
        }

        let createDayElement = (day: any): HTMLElement => {
            let el = document.createElement('div');

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

            let dayel: HTMLElement = document.createElement('div');
            dayel.className = 'drp_day_content';
            dayel.setAttribute('data-id', day.date);

            el.appendChild(dayel);

            return el;
        }

        let toggleClass = (el: HTMLElement, className: string) => {
            if (hasClass(el, className)) {
                removeClass(el, className);
            } else {
                addClass(el, className);
            }
        }

        let addClass = (el: HTMLElement, className: string) => {

            if (!hasClass(el, className)) {
                let classnames = el.className.split(' ');
                classnames.push(className);
                el.className = classnames.join(' ');
            }
        }

        let removeClass = (el: HTMLElement, className: string) => {
            if (hasClass(el, className)) {
                let classnames = el.className.split(' ');
                let ix = classnames.indexOf(className);
                classnames.splice(ix, 1);
                el.className = classnames.join(' ');
            }
        }

        let hasClass = (el: HTMLElement, className: string) => {
            let classnames = el.className.split(' ');
            return classnames.indexOf(className) > -1;
        }

        let bind = (elements, event, handler) => {
            for (let i = 0; i < elements.length; i++) {
                let el = elements[i] as HTMLElement;
                el.addEventListener(event, handler, true);
            }
        }

        let clickHandler = (event: Event) => {
            let target: HTMLElement = event.currentTarget as HTMLElement;

            let targetDate = target.getAttribute('data-value');

            if (isOutOfSequence(targetDate)){
                deselectAll();
                clearOutOfSequence();
            }

            select(targetDate, values().length ? 1 : config.firstSelectionDuration );

        }

        let leftArrowClickHandler = (event: Event) => {
            let target: HTMLElement = event.currentTarget as HTMLElement;

            let scroller = element.querySelector('.drp_scroller');

            let scrollLeft = scroller.scrollLeft;

            let months = arrayFrom(scroller.children);

            let next: HTMLElement;

            if (monthIndex>0){
                next = months[--monthIndex];
            }
            
            if (next) {
                scroller.scrollLeft = next.offsetLeft;
            }
        }

        let rightArrowClickHandler = (event: Event) => {
            let target: HTMLElement = event.currentTarget as HTMLElement;

            let scroller = element.querySelector('.drp_scroller');

            let scrollLeft = scroller.scrollLeft;

            let months = arrayFrom(scroller.children);

            let next: HTMLElement;

            if (monthIndex < months.length-1){
                next = months[++monthIndex];
            } 

            if (next) {
                scroller.scrollLeft = next.offsetLeft;
            }

        }

        let deselectAll = () => {
            arrayFrom(document.querySelectorAll('.drp_selected')).forEach((el) => {
                removeClass(el, 'drp_selected');
            });
        }

        let goto = (targetDate:DateLike) => {
            let month = moment(targetDate).format(monthString);
            
            let scroller = element.querySelector('.drp_scroller');

            let months = arrayFrom(scroller.children);

            let index = months.reduce(function(a, b, ix){
                if (b.getAttribute('data-id') == month){
                    a = ix;
                }
                return a;
            });

            let next = months[index];

            if (next) {
                monthIndex = index;
                scroller.scrollLeft = next.offsetLeft;
            }
        }

        let select = (targetDate: (DateLike), duration: number = 1) => {

            if (!targetDate) {
                if (config.onchange) config.onchange();
                return deselectAll();
            }

            targetDate = moment(targetDate);

            let targets: Array<string> = [];

           

            for (let i = 0; i < duration; i++) {
                let targetString = targetDate.clone().add(i, 'd').format(dateString);
                targets.push(targetString);
            }

           

            if (validateDates(targets)) {
                if (config.selectionType == 'sequential') {
                    var vals = values('moment');
                    if (vals.length) {
                        let first: Moment = vals[0] as Moment;
                        let last: Moment = vals[vals.length - 1] as Moment;
                        if (targetDate.isSame(first) || targetDate.isSame(last)) {
                            //if targetDate is the same as first selected then deselect it. 
                            if (config.firstSelectionDuration > 1 && config.firstSelectionDuration >= values().length){
                                deselectAll();
                                targets = [];
                            }
                        } else if (targetDate.isAfter(first)) {
                            //if targetDate is later then first selected then create new sequence between first selected and targetDate
                            targets = [];
                            let t = first.clone();
                            while (targetDate.isAfter(t)) {
                                let ts = t.format(dateString);
                                targets.push(ts);
                                t = t.clone().add(1, 'd');
                            }
                            targets.push(targetDate.format(dateString));
                            deselectAll();
                        } else if (targetDate.isBefore(first)) {
                            // targetDate is earlier that first selected then create new sequence between target Date and last selected
                            targets = [];
                            let t = targetDate.clone();
                            while (last.isAfter(t)) {
                                let ts = t.format(dateString);
                                targets.push(ts);
                                t = t.clone().add(1, 'd');
                            }
                            targets.push(last.format(dateString));
                            deselectAll();
    
                        }
                    }
                }


                //
                targets.forEach(function (targetString) {
                    let elements = document.querySelectorAll('[data-value="' + targetString + '"]');

                    for (let i = 0; i < elements.length; i++) {
                        let el = elements[i] as HTMLElement;

                        selectIfValid(el);
                    }
                });
                let vs = values();
                lockOutOfSequence(vs[0]);
                if(config.nightSelection){
                    
                }

                if (config.onchange) config.onchange();
            };
        }

        let clearOutOfSequence = () => {
            arrayFrom(document.querySelectorAll('.drp_out-of-sequence')).forEach((el) => {
                removeClass(el, 'drp_out-of-sequence');
            });
        }

        let lockOutOfSequence = (date: DateLike) => {

            clearOutOfSequence();
            if (config.selectionType == 'sequential' && date) {
                let targetDate: Moment = toType(date, 'moment') as Moment;
                //go back until validateDates is invalid
                let t = targetDate.clone();
                let ts = t.format(dateString);

                while (validateDates([ts])) {
                    t.subtract(1, 'd');
                    ts = t.format(dateString);
                }
                let backDate = t.clone();

                //go forward until validateDates is invalid
                t = targetDate.clone();
                ts = t.format(dateString);

                while (validateDates([ts])) {
                    t.add(1, 'd');
                    ts = t.format(dateString);
                }
                let forwDate = t.clone();

                //apply drp_out-of-sequence any element that is outside
                let dayElements: Array<HTMLElement> = arrayFrom(document.querySelectorAll('.drp_day'));

                dayElements.forEach((el: HTMLElement) => {
                    let d = moment(el.getAttribute('data-value'));
                    if (!d.isBetween(backDate, forwDate)) {
                        addClass(el, 'drp_out-of-sequence');
                    }
                });

            }
        }

        let minDate = (arr: Array<DateLike>, type: string = 'string'): DateLike => {

            let result = arr.reduce((a: DateLike, b: DateLike): DateLike => {
                if (!a) {
                    return toType(b, type);
                }
                let _a = moment(a);
                let _b = moment(b);

                if (_a.isBefore(_b)) return toType(_a, type);

                if (_a.isAfter(_b)) return toType(_b, type);

                if (_a.isSame(_b)) return toType(_a, type);

            }, null);

            return result;
        }

        let maxDate = (arr: Array<DateLike>, type: string = 'string'): DateLike => {

            let result = arr.reduce((a, b): DateLike => {
                if (!a) {
                    return toType(b, type);
                }


                let _a = moment(a);
                let _b = moment(b);

                if (_a.isBefore(_b)) return toType(_b, type);

                if (_a.isAfter(_b)) return toType(_a, type);

                if (_a.isSame(_b)) return toType(_a, type);

            }, null);

            return result;
        }

        let toType = (a: DateLike, type: string = 'string'): DateLike => {
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

        }

        let values = (type: string = 'string'): Array<DateLike> => {
            var res: Array<DateLike> = [];

            let elements = arrayFrom(document.querySelectorAll('.drp_selected'));
            res = elements.reduce((a, el) => {
                let val: string = el.getAttribute('data-value');

                a.push(toType(val, type));

                return a;
            }, []);

            return res;
        }

        let validateDates = (arr: Array<string>): boolean => {
            let valid = arr.filter((a) => {
                let elements = arrayFrom(document.querySelectorAll('[data-value="' + a + '"]'));

                let validElements = elements.filter(isValid);
                return !!validElements.length;
            });
            return valid.length == arr.length;
        }

        

        let isSelectedDate = (date: DateLike): boolean => {

            let a = moment(date).format(dateString);
            let elements = arrayFrom(document.querySelectorAll('[data-value="' + a + '"]'));

            var selected = elements.filter((el: HTMLElement) => {
                return (hasClass(el, 'drp_selected'))
            });

            return !!selected.length;
        }

        let arrayFrom = (arrLike: any): Array<any> => {
            if (arrLike.length === undefined) {
                throw new Error('Not Array like')
            }
            let arr: Array<any> = [];
            for (let i = 0; i < arrLike.length; i++) {
                arr.push(arrLike[i]);
            }
            return arr;

        }

        let isValid = (el: HTMLElement): boolean => {
            if (!hasClass(el, 'drp_placeholder') &&
                !hasClass(el, 'drp_out-of-range') &&
                !hasClass(el, 'drp_locked') &&
                !hasClass(el, 'drp_out-of-sequence')
            ) {
                return true;

            } else {
                return false;
            }
        }


        let isOutOfSequence = (target:DateLike):boolean=>{
            let b:boolean = false;
            let a = moment(target).format(dateString);
            let elements = arrayFrom(document.querySelectorAll('[data-value="' + a + '"]'));
             let outOfSequencElementds = elements.filter(function(el){
                 return hasClass(el, 'drp_out-of-sequence');
             });
            return !!outOfSequencElementds.length;
        }



        let selectIfValid = (el: HTMLElement) => {
            if (!hasClass(el, 'drp_placeholder') &&
                !hasClass(el, 'drp_out-of-range') &&
                !hasClass(el, 'drp_locked') &&
                !hasClass(el, 'drp_out-of-sequence')
            ) {
                toggleClass(el, 'drp_selected');
            } else {

            }
        }

        

        api = {
            _setConfig: setConfig,
            _select: select,
            _values: values,
            _goto: goto
        }

        return api;
    })();

}


//(window as any).DateRangePicker = DateRangePicker;