const { Client: { plugin } } = require('klasa');

module.exports = {
	KlasaGuild: require('./lib/extensions/KlasaGuild'),
	KlasaRoleStore: require('./lib/extensions/KlasaRoleStore'),
	KlasaRole: require('./lib/extensions/KlasaRole'),
	RoleGateway: require('./lib/settings/RoleGateway'),
	Client: require('./lib/Client'),
	[plugin]: require('./lib/Client')[plugin]
};