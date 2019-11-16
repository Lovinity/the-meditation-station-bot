const { Structures } = require('discord.js');
const KlasaRoleStore = require('./KlasaRoleStore');

Structures.extend('Guild', Guild => {
	/**
	 * Mutates KlasaGuild to include a KlasaMemberStore with our extensions
	 * @extends external:Guild
	 */
	class KlasaGuild extends Guild {

		constructor(client, data) {
			// avoid double iteration by the super class populating the members collection
			const { roles, ...restData } = data || {};
			super(client, Object.keys(restData).length ? restData : undefined);

			/**
			 * Storage for KlasaMembers
			 * @since 0.0.1
			 * @type {KlasaGuildMemberStore}
			 */
			this.roles = new KlasaRoleStore(this, roles);
		}

	}

	return KlasaGuild;
});