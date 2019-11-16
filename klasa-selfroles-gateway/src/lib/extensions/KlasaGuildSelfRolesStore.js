const { GuildMemberStore } = require('discord.js');

/**
 * Adds our extensions to d.js's MemberStore
 * @extends external:GuildMemberStore
 */
class KlasaGuildSelfRolesStore extends DataStore {

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
