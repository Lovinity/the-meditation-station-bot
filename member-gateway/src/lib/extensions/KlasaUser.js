const { Structures } = require('discord.js');

module.exports = Structures.extend('User', User => {
	class KlasaUser extends User {

		constructor(...args) {
			super(...args);
		}

		async guildSettings(guildID) {
			var settings = this.client.gateways.members.get(`${guildID}.${this.id}`, true);
			await settings.sync();
			return settings;
		}

	}

	return KlasaUser;
});
