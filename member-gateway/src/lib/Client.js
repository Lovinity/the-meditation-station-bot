const { Client, Schema, Gateway, util: { mergeDefault } } = require('klasa');
const { CLIENT } = require('./util/constants');

Client.defaultMemberSchema = new Schema();

module.exports = class extends Client {

	constructor(options) {
		super(options);
		this.constructor[ Client.plugin ].call(this);
	}

	static [ Client.plugin ] () {
		mergeDefault(CLIENT, this.options);
		const { members } = this.options.gateways;
		const memberSchema = 'schema' in members ? members.schema : this.constructor.defaultMemberSchema;
		this.gateways.register('members', { ...members, schema: memberSchema });
	}

};
