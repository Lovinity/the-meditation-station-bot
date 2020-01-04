// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const request = require('node-superfetch');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Get a random Wikipedia fact.',
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

        if (await yangStore(message, 'wikiFact', 1)) {
            try {
                const article = await this.randomWikipediaArticle();
                const { body } = await request
                    .get('https://en.wikipedia.org/w/api.php')
                    .query({
                        action: 'query',
                        prop: 'extracts',
                        format: 'json',
                        titles: article,
                        exintro: '',
                        explaintext: '',
                        redirects: '',
                        formatversion: 2
                    });
                let fact = body.query.pages[0].extract;
                if (fact.length > 200) {
                    const facts = fact.split('.');
                    fact = `${facts[0]}.`;
                    if (fact.length < 200 && facts.length > 1) fact += `${facts[1]}.`;
                }
                return message.send(fact);
            } catch (err) {
                return message.send(`:x: Oh no, an error occurred: \`${err.message}\`. Try again later!`);
            }
        }
    }

    async randomWikipediaArticle() {
		const { body } = await request
			.get('https://en.wikipedia.org/w/api.php')
			.query({
				action: 'query',
				list: 'random',
				rnnamespace: 0,
				rnlimit: 1,
				format: 'json',
				formatversion: 2
			});
		if (!body.query.random[0].title) return 'Facts are hard to find sometimes.';
		return body.query.random[0].title;
	}

};