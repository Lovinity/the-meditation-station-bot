// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
const { Extendable } = require('klasa');
const { Message } = require('discord.js');

module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, { appliesTo: [Message] });
	}

	async ask(content, options) {
		const message = await this.channel.send(content, options);
		if (this.channel.permissionsFor(this.guild.me).has('ADD_REACTIONS')) return awaitReaction(this, message);
		return awaitMessage(this, message);
	}

	async awaitReply(question, time = 60000, embed) {
		const message = await (embed ? this.channel.send(question, { embed }) : this.channel.send(question));
		return this.channel.awaitMessages(message => message.author.id === this.author.id,
			{ max: 1, time, errors: ['time'] })
			.then(messages => {
				const returnContent = messages.first().content;
				messages.first().delete();
				message.delete();
				return returnContent;
			})
			.catch(() => false);
	}

	async awaitMessage(question, time = 60000, embed) {
		const message = await (embed ? this.channel.send(question, { embed }) : this.channel.send(question));
		return this.channel.awaitMessages(message => message.author.id === this.author.id,
			{ max: 1, time, errors: ['time'] })
			.then(messages => {
				const returnContent = messages.first();
				message.delete();
				return returnContent;
			})
			.catch(() => false);
	}

	async awaitReaction(time = 60000) {
		return this.awaitReactions((reaction, user) => user.id === this.author.id, { time, max: 1, errors: ['time'] })
		.then(reaction => reaction.first())
		.catch(() => false);
	}

};

const awaitReaction = async (msg, message) => {
	await message.react('🇾');
	await message.react('🇳');
	const data = await message.awaitReactions(reaction => reaction.users.cache.get(msg.author.id), { time: 60000, max: 1 });
	message.delete();
	if (data.firstKey() === '🇾') return true;
	return false;
};

const awaitMessage = async (msg, message) => {
	const messages = await msg.channel.awaitMessages(mes => mes.author === msg.author, { time: 60000, max: 1 });
	if (messages.size === 0) return false;
	const responseMessage = await messages.first().content;
	messages.first().delete();
	message.delete();
	if (responseMessage.toLowerCase() === 'yes') return true;
	return false;
};