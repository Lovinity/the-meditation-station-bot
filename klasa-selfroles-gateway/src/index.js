const { Client: { plugin } } = require('klasa');

module.exports = {
	KlasaGuild: require('./lib/extensions/KlasaGuild'),
	KlasaGuildSelfRolesStore: require('./lib/extensions/KlasaGuildSelfRolesStore'),
	SelfrolesGateway: require('./lib/settings/SelfrolesGateway'),
	Client: require('./lib/Client'),
	[plugin]: require('./lib/Client')[plugin]
};