const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permLevel: 4,
            botPerms: ['MANAGE_ROLES'],
            runIn: ['text'],
            description: 'Grant a user or users access to the channel this command was executed in.',
            usage: '<user:username> [...]',
            usageDelim: ' | '
        });
    }

    async run(message, [...users]) {
        if (users && users.length > 0)
        {
            users.map((user) => {

                message.channel.createOverwrite(user, {
                    ADD_REACTIONS: true,
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
                    EMBED_LINKS: true,
                    ATTACH_FILES: true,
                    READ_MESSAGE_HISTORY: true
                }, "Use of the !grant command");

            });
        }

        return message.send(`:white_check_mark: Permissions have been added.`);
    }

};
