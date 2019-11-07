// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
const { Extendable } = require('klasa');
const { Message } = require('discord.js');

module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, { appliesTo: [Message] });
	}

	async ask(content, options) {
		const message = await this.sendMessage(content, options);
		if (this.channel.permissionsFor(this.guild.me).has('ADD_REACTIONS')) return awaitReaction(this, message);
		return awaitMessage(this);
	}

	async awaitReply(question, time = 60000, embed) {
		await (embed ? this.channel.send(question, { embed }) : this.channel.send(question));
		return this.channel.awaitMessages(message => message.author.id === this.author.id,
			{ max: 1, time, errors: ['time'] })
			.then(messages => messages.first().content)
			.catch(() => false);
	}

};

const awaitReaction = async (msg, message) => {
	await message.react('🇾');
	await message.react('🇳');
	const data = await message.awaitReactions(reaction => reaction.users.has(msg.author.id), { time: 20000, max: 1 });
	if (data.firstKey() === '🇾') return true;
	return false;
};

const awaitMessage = async (message) => {
	const messages = await message.channel.awaitMessages(mes => mes.author === message.author, { time: 20000, max: 1 });
	if (messages.size === 0) return false;
	const responseMessage = await messages.first();
	if (responseMessage.content.toLowerCase() === 'yes') return true;
	return false;
};