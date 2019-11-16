const { GuildMemberRoleStore } = require('discord.js');

/**
 * Adds our extensions to d.js's MemberStore
 * @extends external:GuildMemberStore
 */
class KlasaGuildMemberRoleStore extends GuildMemberRoleStore {

}

module.exports = KlasaGuildMemberRoleStore;
