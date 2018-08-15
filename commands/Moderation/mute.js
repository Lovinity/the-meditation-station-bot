const {Command} = require('klasa');
const GuildMute = require('../../util/guildMute');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            enabled: true,
            runIn: ['text'],
            deletable: true,
            permissionLevel: 4,
            requiredPermissions: ["MANAGE_ROLES"],
            requiredSettings: ["muteRole", "incidentsCategory"],
            description: 'Adds the configured muteRole to the specified user',
            quotedStringSupport: false,
            usage: '<user:username> <reason:string> [duration:integer]',
            usageDelim: ' | ',
            extendedHelp: 'Using this command will add the configured muteRole to the specified user, and creates an incidents channel for the user. muteRole should prohibit the user from seeing any channels. Bot adds permissions for the incidents channel automatically.'
        });
    }

    async run(message, [user, reason, duration = null]) {
        await message.send(`:hourglass_flowing_sand: Muting user...`)
                .then(msg => {
                    
                    var mute = new GuildMute(user, message.guild, message.author)
                    .setReason(reason);
            
                    if (duration !== null)
                        mute.setDuration(duration);
                    
                    mute.execute();
                    
                    msg.edit(`:white_check_mark: The mute has been issued.`);
                });
    }

    async init() {
    }

};


