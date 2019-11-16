const { GuildMemberRoleStore } = require('discord.js');

/**
 * Adds our extensions to d.js's MemberStore
 * @extends external:GuildMemberStore
 */
class KlasaGuildMemberRoleStore extends GuildMemberRoleStore {

	async _fetchSingle(...args) {
		const role = await super._fetchSingle(...args);
		await role.settings.sync();
		return role;
	}

	async _fetchMany(...args) {
		const roles = await super._fetchMany(...args);
		await Promise.all(roles.map(role => role.settings.sync()));
		return roles;
	}

}

module.exports = KlasaGuildMemberRoleStore;
