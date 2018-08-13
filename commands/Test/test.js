const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: [],
			permissionLevel: 10,
			usage: ''
		});
	}

	async run(message, []) {
            return message.send(message.guild.settings.get('botChannel'));
            return null;
	}

};


