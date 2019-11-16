const { DataStore, Role } = require('discord.js');

/**
 * Adds our extensions to d.js's MemberStore
 * @extends external:DataStore
 */
class KlasaGuildSelfRolesStore extends DataStore {

	constructor(guild, iterable) {
		super(guild.client, iterable, Role);
	}

	async _fetchSingle(...args) {
		const selfRole = await super._fetchSingle(...args);
		await selfRole.settings.sync();
		return selfRole;
	}

	async _fetchMany(...args) {
		const selfRoles = await super._fetchMany(...args);
		await Promise.all(selfRoles.map(selfRole => selfRole.settings.sync()));
		return selfRoles;
	}

}

module.exports = KlasaGuildSelfRolesStore;
