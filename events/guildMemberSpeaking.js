const { Event } = require('klasa');

module.exports = class extends Event {

    run (guildMember, speaking) {
        console.log(`Speaking ${guildMember.id}? ${speaking}`)
    }

};


