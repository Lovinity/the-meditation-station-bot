const { Structures } = require('discord.js');

module.exports = Structures.extend('GuildMember', GuildMember => {
	/**
	 * Klasa's Extended GuildMember
	 * @extends external:GuildMember
	 */
    class KlasaMember extends GuildMember {

        constructor(...args) {
            super(...args);
        }

        toJSON () {
            return { ...super.toJSON(), settings: this.settings };
        }

        get settings () {
            var settings = this.client.gateways.members.get(`${this.guild.id}.${this.id}`, true);
            settings.sync();
            return settings;
        }

    }

    return KlasaMember;
});