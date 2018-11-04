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
            return message.send(`:x: Sorry, but this command may only be used in the bot channel.`);
        
        if (message.guild.settings.selfRoles.indexOf(role.id) === -1)
            return message.send(`:x: The provided role is not a self-assigned role.`);
        
        await message.member.roles.remove(role, `!iamnot command`);
        
        return message.send(`:white_check_mark: I attempted to remove the role to you.`);
    }

};


