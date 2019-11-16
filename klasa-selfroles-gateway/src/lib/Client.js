const { Client, Schema, util: { mergeDefault } } = require('klasa');
const { CLIENT } = require('./util/constants');
const SelfrolesGateway = require('./settings/SelfrolesGateway');

Client.defaultSelfRolesSchema = new Schema();

module.exports = class extends Client {

	constructor(options) {
		super(options);
		this.constructor[Client.plugin].call(this);
	}

	static [Client.plugin]() {
		mergeDefault(CLIENT, this.options);
		const { selfroles } = this.options.gateways;
		const selfRolesSchema = 'schema' in selfroles ? selfroles.schema : this.constructor.defaultSelfRolesSchema;

		this.gateways.selfroles = new SelfrolesGateway(this.gateways, 'selfroles', selfRolesSchema, selfroles.provider || this.options.providers.default);
		this.gateways.keys.add('selfroles');
		this.gateways._queue.push(this.gateways.selfroles.init.bind(this.gateways.selfroles));
	}

};
