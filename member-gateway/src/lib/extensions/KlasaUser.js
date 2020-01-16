const { Structures } = require('discord.js');

module.exports = Structures.extend('User', User => {
	class KlasaUser extends User {

		constructor(...args) {
			super(...args);
		}

		guildSettings(guildID) {
			return this.client.gateways.members.create([guildID, this.id]);
		}

	}

	return KlasaUser;
});
