const { Client: { plugin } } = require('klasa');

module.exports = {
	KlasaGuild: require('./lib/extensions/KlasaGuild'),
	KlasaGuildMemberRoleStore: require('./lib/extensions/KlasaGuildMemberRoleStore'),
	KlasaRole: require('./lib/extensions/KlasaRole'),
	RoleGateway: require('./lib/settings/RoleGateway'),
	Client: require('./lib/Client'),
	[plugin]: require('./lib/Client')[plugin]
};