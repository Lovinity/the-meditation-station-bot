const discord_js_1 = require("discord.js");
const klasa_1 = require("klasa");
module.exports = class extends klasa_1.Extendable {
	constructor(store, file, directory) {
		super(store, file, directory, { appliesTo: [ discord_js_1.Message ] });
	}
	async awaitReply (content, time = 60000, embed) {
		const message = await this.channel.send(content, { embed });
		const responses = await this.channel.awaitMessages(msg => msg.author === this.author, { time, max: 1 });
		message.nuke().catch(error => this.client.emit("apiError" /* ApiError */, error));
		if (responses.size === 0)
			throw this.language.tget('MESSAGE_PROMPT_TIMEOUT');
		return responses.first();
	}
	async ask (content, options, promptOptions) {
		if (typeof content !== 'string') {
			options = content;
			content = null;
		}
		const message = await this.send(content, options);
		return this.reactable
			? awaitReaction(this, message, promptOptions)
			: awaitMessage(this, promptOptions);
	}
	async alert (content, options, timer) {
		if (!this.channel.postable)
			return Promise.resolve(null);
		if (typeof options === 'number' && typeof timer === 'undefined') {
			timer = options;
			options = undefined;
		}
		const msg = await this.sendMessage(content, options);
		msg.nuke(typeof timer === 'number' ? timer : 10000)
			.catch(error => this.client.emit("apiError" /* ApiError */, error));
		return msg;
	}
	async nuke (time = 0) {
		if (time === 0)
			return nuke(this);
		const count = this.edits.length;
		await klasa_1.util.sleep(time);
		return !this.deleted && this.edits.length === count ? nuke(this) : this;
	}
}
const OPTIONS = { time: 60000, max: 1 };
const REACTIONS = { YES: 'ðŸ‡¾', NO: 'ðŸ‡³' };
const REG_ACCEPT = /^y|yes?|yeah?$/i;
async function awaitReaction (message, messageSent, promptOptions = OPTIONS) {
	await messageSent.react(REACTIONS.YES);
	await messageSent.react(REACTIONS.NO);
	const reactions = await messageSent.awaitReactions((__, user) => user === message.author, promptOptions);
	// Remove all reactions if the user has permissions to do so
	if (message.guild && message.channel.permissionsFor(message.guild.me).has(discord_js_1.Permissions.FLAGS.MANAGE_MESSAGES)) {
		messageSent.reactions.removeAll().catch(error => messageSent.client.emit("apiError" /* ApiError */, error));
	}
	return Boolean(reactions.size) && reactions.firstKey() === REACTIONS.YES;
}
async function awaitMessage (message, promptOptions = OPTIONS) {
	const messages = await message.channel.awaitMessages(mes => mes.author === message.author, promptOptions);
	return Boolean(messages.size) && REG_ACCEPT.test(messages.first().content);
}
async function nuke (message) {
	try {
		return await message.delete();
	}
	catch (error) {
		// Unknown Message
		if (error.code === 10008)
			return message;
		throw error;
	}
}
//# sourceMappingURL=KlasaMessageExtendables.js.map