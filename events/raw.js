const { Event } = require('klasa');

module.exports = class extends Event {

    run (data) {
        console.log(data);
    }

};
