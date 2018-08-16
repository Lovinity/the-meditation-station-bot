const { Extendable } = require('klasa');

module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, { appliesTo: ['Message'] });
	}

	async extend(question, time = 60000, embed) {
		await (embed ? this.channel.send(question, { embed }) : this.channel.send(question));
		return this.channel.awaitMessages(msg => msg.author.id === this.author.id,
			{ max: 1, time, errors: ['time'] })
			.then(msgs => msgs.first().content)
			.catch(() => false);
	}

};