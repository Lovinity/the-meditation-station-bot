const {Command} = require('klasa');
var wait = require('wait-for-stuff');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'prune',
            permLevel: 4,
            botPerms: ['MANAGE_MESSAGES'],
            runIn: ['text'],
            description: 'Prune messages',
            usage: '[limit:integer{1,1000}] [link|invite|bots|you|me|upload|user:username]',
            usageDelim: ' | '
        });
    }

    async run(msg, [limit = 50, filter = null]) {
        var message = await msg.send(`:hourglass_flowing_sand: Pruning messages (depending on the specified limit, this could take a while)...`);
        await this.process(msg, limit, filter);
        return msg.send(`:white_check_mark: Prune is complete!`);
    }

    getFilter(msg, filter, user) {
        switch (filter) {
            // Here we use Regex to check for the diffrent types of prune options
            case 'link':
                return mes => /https?:\/\/[^ /.]+\.[^ /.]+/.test(mes.content);
            case 'invite':
                return mes => /(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(mes.content);
            case 'bots':
                return mes => mes.author.bot;
            case 'you':
                return mes => mes.author.id === this.client.user.id;
            case 'me':
                return mes => mes.author.id === msg.author.id;
            case 'upload':
                return mes => mes.attachments.size > 0;
            case 'user':
                return mes => mes.author.id === user.id;
            default:
                return () => true;
        }
    }

    async process(msg, limit, filter) {
        wait.for.time(3);
        var iteration = 0;
        while (limit > 0 && iteration < 10)
        {
            var filtered = await this._process(msg, limit, filter);
            if (filtered <= 0)
                limit = -1;
            limit -= filtered;
            wait.for.time(10);
            iteration++;
        }
        return true;
    }

    async _process(msg, amount, filter) {
        let messages = await msg.channel.messages.fetch({limit: 100});
        if (messages.array().length <= 0)
            return -1;
        if (filter) {
            const user = typeof filter !== 'string' ? filter : null;
            const type = typeof filter === 'string' ? filter : 'user';
            messages = messages.filter(this.getFilter(msg, type, user));
        }
        messages = messages.array().slice(0, amount);
        await msg.channel.bulkDelete(messages);
        return messages.length;
    }

};


