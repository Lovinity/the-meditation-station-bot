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
        if (message.channel.id !== message.guild.settings.botChannel)
            return message.send(`:x: No spammy whammy! Please use this command in the bot channel.`);
        
        if (message.guild.settings.selfRoles.indexOf(role.id) === -1)
            return message.send(`:x: Worthy effort, but you can't give yourself that role.`);
        
        await message.member.roles.add(role, `!iam command`);
        
        return message.send(`:white_check_mark: I added that role to you.`);
    }

};


