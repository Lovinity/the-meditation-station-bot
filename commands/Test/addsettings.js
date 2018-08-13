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
            //this.client.settings.guilds.add("modRole", { type: "Role" });
            //this.client.settings.guilds.add("modLogChannel", { type: "TextChannel" });
            //this.client.settings.guilds.add("reportLogChannel", { type: "TextChannel" });
	}

};

