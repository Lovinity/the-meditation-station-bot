const { Structures } = require('discord.js');
const KlasaGuildSelfRolesStore = require('./KlasaGuildSelfRolesStore');

Structures.extend('Guild', Guild => {
	/**
	 * Mutates KlasaGuild to include a KlasaMemberStore with our extensions
	 * @extends external:Guild
	 */
	class KlasaGuild extends Guild {

		constructor(client, data) {
			super(client, data);

			/**
			 * Storage for KlasaMembers
			 * @since 0.0.1
			 * @type {KlasaGuildSelfRolesStore}
			 */
			this.selfRoles = new KlasaGuildSelfRolesStore(this);
		}

	}

	return KlasaGuild;
});
