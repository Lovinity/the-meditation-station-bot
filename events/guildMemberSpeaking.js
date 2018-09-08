const { Event } = require('klasa');

module.exports = class extends Event {

    constructor(...args) {
        super(...args, {
            enabled: true,
        });
    }

    run(guildMember, speaking) {
        // This event is not firing at this time
        // TODO: when this event starts firing again correctly, program speaking XP
    }

};


