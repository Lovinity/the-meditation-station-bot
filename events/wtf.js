const { Event } = require('klasa');

module.exports = class extends Event {

    async run (failure) {
        try {
            const owner = this.client.application.owner;
            if (owner) {
                owner.send(`:no_entry: **__MEGA ERROR__** :no_entry: 
${failure}`)
            }
        } catch (e) {

        }
        this.client.console.wtf(failure);
    }

    init () {
        if (!this.client.options.consoleEvents.wtf) this.disable();
    }

};