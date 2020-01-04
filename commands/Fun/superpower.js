// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const request = require('node-superfetch');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Find out what superpower you will use today.',
            cooldown: 60,
            runIn: [ 'text' ],
        });
    }

    async run (message, []) {
        if (message.guild.settings.botChannel && message.channel.id !== message.guild.settings.botChannel) {
            var msg = await message.send(`:x: No spammy whammy! Please use that command in the bot channel.`);
            message.delete();
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }

        if (await yangStore(message, 'superpower', 1)) {
            try {
                const id = await this.random();
                const article = await this.fetchSuperpower(id);
                return message.send(`Your superpower is... **${article.title}**!
_${this.shorten(article.content.map(section => section.text).join('\n\n'), 1950)}_
			`);
            } catch (err) {
                return message.send(`:x: Oh no, an error occurred: \`${err.message}\`. Try again later!`);
            }
        }
    }

    shorten(text, maxLen = 2000) {
		return text.length > maxLen ? `${text.substr(0, maxLen - 3)}...` : text;
    }
    
    async random() {
		const { body } = await request
			.get('http://powerlisting.wikia.com/api.php')
			.query({
				action: 'query',
				list: 'random',
				rnnamespace: 0,
				rnlimit: 1,
				format: 'json',
				formatversion: 2
			});
		return body.query.random[0].id;
	}

	async fetchSuperpower(id) {
		const { body } = await request
			.get('http://powerlisting.wikia.com/api/v1/Articles/AsSimpleJson/')
			.query({ id });
		return body.sections[0];
	}

};