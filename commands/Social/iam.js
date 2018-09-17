/*
 To use this correctly, you will also need the reminder task located in
 /tasks/reminder.js
 */
const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Add a self-assigned role to yourself.',
            usage: '<role:rolename>',
            usageDelim: '',
            runIn: ['text'],
            requiredSettings: ["selfRoles", "botChannel"],
        });
    }

    async run(message, [role]) {
        if (message.channel.id !== message.guild.settings.get('botChannel'))
            return message.send(`:x: Sorry, but this command may only be used in the bot channel.`);
        
        if (message.guild.settings.selfRoles.indexOf(role.id) === -1)
            return message.send(`:x: The provided role cannot be self-assigned.`);
        
        await message.member.roles.add(role, `!iam command`);
        
        return message.send(`:white_check_mark: I attempted to add the role to you.`);
    }

};


