const { Event } = require('klasa');

module.exports = class extends Event {

    async run (guildMember, speaking) {

        // Upgrade partial members to full members
        if (guildMember.partial) {
            await guildMember.fetch();
        }

        console.log(`Speaking ${guildMember.id}? ${speaking}`)
    }

};


