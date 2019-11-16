const { Client, Schema, util: { mergeDefault } } = require('klasa');
const { CLIENT } = require('./util/constants');
const RoleGateway = require('./settings/RoleGateway');

Client.defaultRoleSchema = new Schema();

module.exports = class extends Client {

	constructor(options) {
		super(options);
		this.constructor[Client.plugin].call(this);
	}

	static [Client.plugin]() {
		mergeDefault(CLIENT, this.options);
		const { roles } = this.options.gateways;
		const roleSchema = 'schema' in roles ? roles.schema : this.constructor.defaultRoleSchema;

		this.gateways.roles = new RoleGateway(this.gateways, 'roles', roleSchema, roles.provider || this.options.providers.default);
		this.gateways.keys.add('roles');
		this.gateways._queue.push(this.gateways.roles.init.bind(this.gateways.roles));
	}

};
