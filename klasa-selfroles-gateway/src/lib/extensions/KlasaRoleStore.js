const { RoleStore } = require('discord.js');

/**
 * Adds our extensions to d.js's MemberStore
 * @extends external:GuildMemberStore
 */
class KlasaRoleStore extends RoleStore {

}

module.exports = KlasaRoleStore;
