const { Argument } = require('klasa');
const chrono = require('chrono-node');
const moment = require('moment');

module.exports = class extends Argument {

	run(arg, possible, message) {
        let date = chrono.parseDate(arg, new Date(), {forwardDate: true});

        if (date === null)
            throw `Unrecognized date, time, or duration of time provided for ${possible.name}.`;

        if (moment().isAfter(moment(date))) {
            return moment(date).add(1, 'days').toDate();
        }

        return date;
	}

};
