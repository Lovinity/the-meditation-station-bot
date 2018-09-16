const {Monitor} = require('klasa');
const {NlpManager} = require('node-nlp');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'responder',
            enabled: true,
            ignoreBots: false,
            ignoreSelf: true,
            ignoreOthers: false,
            ignoreWebhooks: true,
            ignoreEdits: false,
            ignoreBlacklistedUsers: false,
            ignoreBlacklistedGuilds: true
        });
        this.manager = new NlpManager({languages: ['en']});
    }

    run(message) {
        this.manager.process('en', message.cleanContent).then((results) => {
            if (results.entities.length > 0)
            {
                results.entities.forEach((entity) => {
                    if (entity.accuracy >= 0.95)
                    {
                        if (entity.entity === 'url' && message.member.settings.xp < 128)
                        {
                            message.channel.send(`:x: <@${message.author.id}>, You must be level 3 (128 XP) or above to post links in this guild.`)
                                    .then((msg) => {
                                        setTimeout(function () {
                                            msg.delete();
                                        }, 10000);
                                    });
                            message.delete();
                            return null;
                        }
                        if (entity.entity === 'phonenumber')
                        {
                            message.channel.send(`:warning: **Please be careful when posting phone numbers**. People can harass you on the phone or sell it to advertisers. If this is a dox (someone exposing someone else's phone number), please report this immediately to staff via the !staff command.`)
                        }
                        if (entity.entity === 'ip')
                        {
                            message.channel.send(`:warning: **Please be careful when posting or accessing IP addresses**. People can send Denial of Service attacks to your IP. This could also be a malicious server IP address. If this is a dox (someone exposing someone else's IP address), please report this immediately to staff via the !staff command.`);
                        }
                        if (entity.entity === 'email')
                        {
                            message.channel.send(`:warning: **Please be careful when posting email addresses**. You open yourself up to potential spam. If this is a dox (someone exposing someone else's email address), please report this immediately to staff via the !staff command.`)
                        }
                    }
                });
            }

            if (results.answer && results.score >= 0.98)
                message.channel.send(`<@${message.author.id}>, ${results.answer}`);
            
            console.log(results);
        });
    }

    async init() {
        /*
        this.manager.addDocument('en', 'how do I report someone', 'help.report');
        this.manager.addDocument('en', 'I need to report someone', 'help.report');

        this.manager.addAnswer('en', 'help.report', `To report someone to staff, use the bot command \`!staff\` to create a private text channel with staff.`);

        this.manager.train();
        this.manager.save();
        */
    }

};



