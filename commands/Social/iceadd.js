const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'iceadd',
            enabled: true,
            runIn: ['text'],
            cooldown: 0,
            bucket: 1,
            permissionLevel: 4,
            description: 'Add a question into the pool of Ice Breaker questions.',
            usage: '<question:string>',
            usageDelim: '',
            extendedHelp: 'No extended help available.'
        });
    }

    async run(message, [question]) {
        await message.guild.settings.update('icebreakers', question, { action: 'add' });
        //await this.client.gateways.icebreakers.update('icebreakers', question, { action: 'add' });
        return message.send(`:white_check_mark: Ice Breaker question was added.`);
    }

    async init() {
        const { schema } = this.client.gateways.guilds;
        if (!schema.has('icebreakers')) await schema.add('icebreakers', { type: 'string', array: true });
    }

};


