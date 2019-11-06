const { Event } = require('klasa');

module.exports = class extends Event {

    async run (failure) {
        try {
            const owner = this.client.application.owner;
            if (owner) {
                owner.send(`:x: **ERROR** :x: 
${failure}`)
            }
        } catch (e) {

        }
        this.client.console.error(failure);
    }

    init () {
        if (!this.client.options.consoleEvents.error) this.disable();
    }

};