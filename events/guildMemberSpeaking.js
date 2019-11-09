const { Event } = require('klasa');

module.exports = class extends Event {

    constructor(...args) {
        super(...args, {
            enabled: true,
        });
    }

    async run (guildMember, speaking) {
        console.log(`Speaking ${guildMember.id}? ${speaking}`)
    }

};


