const {Task} = require('klasa');

module.exports = class extends Task {

    async run({}) {
        process.exit();
    }

};


