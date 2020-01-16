const { Structures } = require('discord.js');

module.exports = Structures.extend('GuildMember', GuildMember => {
	/**
	 * Klasa's Extended GuildMember
	 * @extends external:GuildMember
	 */
	class KlasaMember extends GuildMember {

		constructor(...args) {
			super(...args);

			this.settings = this.client.gateways.members.create([this.guild.id, this.id]);
		}

		toJSON() {
			return { ...super.toJSON(), settings: this.settings };
		}

	}

	return KlasaMember;
});