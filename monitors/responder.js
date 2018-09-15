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
                            message.channel.send(`:x: <@${message.author.id}>, phone numbers are not allowed in this guild as they violate our rule on doxing.`)
                                    .then((msg) => {
                                        setTimeout(function () {
                                            msg.delete();
                                        }, 10000);
                                    });
                            message.delete();
                            return null;
                        }
                        if (entity.entity === 'ip')
                        {
                            message.channel.send(`:x: <@${message.author.id}>, IP addresses are not allowed in this guild as they violate our rule on doxing.`)
                                    .then((msg) => {
                                        setTimeout(function () {
                                            msg.delete();
                                        }, 10000);
                                    });
                            message.delete();
                            return null;
                        }
                        if (entity.entity === 'email')
                        {
                            message.channel.send(`:x: <@${message.author.id}>, email addresses are not allowed in this guild as they violate our rule on doxing.`)
                                    .then((msg) => {
                                        setTimeout(function () {
                                            msg.delete();
                                        }, 10000);
                                    });
                            message.delete();
                            return null;
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
        this.manager.addDocument('en', 'how do I report someone', 'help.report');
        this.manager.addDocument('en', 'I need to report someone', 'help.report');

        this.manager.addAnswer('en', 'help.report', `To report someone to staff, use the bot command \`!staff\` to create a private text channel with staff.`);

        this.manager.train();
        this.manager.save();
    }

};



