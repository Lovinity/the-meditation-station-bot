const { Structures } = require('discord.js');

module.exports = Structures.extend('User', User => {
	class KlasaUser extends User {

		constructor(...args) {
			super(...args);
		}

		guildSettings(guildID) {
			return this.client.gateways.members.get(`${guildID}.${this.id}`, true);
		}

	}

	return KlasaUser;
});
