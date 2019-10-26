/*
 To use this correctly, you will also need the reminder task located in
 /tasks/reminder.js
 */
const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Remove a self-assigned role from yourself.',
            usage: '<role:rolename>',
            usageDelim: '',
            runIn: ['text'],
            requiredSettings: ["selfRoles", "botChannel"],
        });
    }

    async run(message, [role]) {
        if (message.channel.id !== message.guild.settings.botChannel)
            return message.send(`:x: No spammy whammy! Please use this command in the bot channel.`);
        
        if (message.guild.settings.selfRoles.indexOf(role.id) === -1)
            return message.send(`:x: Nice try, but you can't remove that role.`);
        
        await message.member.roles.remove(role, `!iamnot command`);
        
        return message.send(`:white_check_mark: I attempted to remove the role from you.`);
    }

};


