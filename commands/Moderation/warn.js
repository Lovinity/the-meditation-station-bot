const {Command} = require('klasa');
const GuildWarn = require('../../util/guildWarn');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            enabled: true,
            runIn: ['text'],
            deletable: true,
            permissionLevel: 4,
            requiredPermissions: [],
            requiredSettings: ["incidentsCategory"],
            description: 'Issues a formal warning against a user',
            quotedStringSupport: false,
            usage: '<user:username> <reason:string>',
            usageDelim: ' | ',
            extendedHelp: 'Using this command will create an incidents channel for the user and outline the issued warning. Bot adds permissions for the incidents channel automatically.'
        });
    }

    async run(message, [user, reason]) {
        await message.send(`:hourglass_flowing_sand: Warning user...`)
                .then(msg => {

                    var warn = new GuildWarn(user, message.guild, message.author)
                            .setReason(reason);

                    warn.execute();

                    msg.edit(`:white_check_mark: The warning has been issued.`);
                });
    }

    async init() {
    }

};


