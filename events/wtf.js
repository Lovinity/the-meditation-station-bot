const { Event } = require('klasa');

module.exports = class extends Event {

    async run (failure) {
        try {
            const owner = await this.client.users.fetch(`637468753092804620`);
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