const { Command } = require('klasa');
var wait = require('wait-for-stuff');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            subcommands: true,
            runIn: [ 'text' ],
            permLevel: 4,
            description: 'Manage reaction-based self-assignable roles',
            usage: '<add|remove|regenerate:default> [role:rolename]',
            usageDelim: ' | ',
            cooldown: 15,
            requiredSettings: [ "selfRolesChannel" ],
        });
    }

    async add (message, [ role ]) {
        if (!role) {
            return message.send(`:x: Role id/name/mention is required.`);
        }
        var category = await message.awaitMessage(`:question: First, send a message containing the name of the category (case sentitive) you want this role to be added to. If you specify a category that does not exist, it will be created. Then, react to the message you just sent with the reaction you want users to use to assign that role to themselves.`, 60000);
        if (!category) {
            return message.send(`:x: The selfroles command timed out.`);
        }
        if (!category.cleanContent) {
            return message.send(`:x: The message sent contained no text content for the category name.`);
        }
        var reaction = await category.awaitReaction()
        if (!reaction) {
            return message.send(`:x: The selfroles command timed out, or no reaction was provided.`);
        }
        var settings = role.settings;
        if (!settings) {
            return message.send(`:x: There was an error getting settings for the provided role.`);
        }
        await settings.update('self.category', category.cleanContent)
        await settings.update('self.reaction', reaction.emoji, message.guild)
        return message.send(':white_check_mark: Self role added/edited! Once you have made all your changes, you must use the selfroles command with no parameters to re-generate the messages in the selfRolesChannel.')
    }

    async remove (message, [ role ]) {
        if (!role) {
            return message.send(`:x: Role id/name/mention is required.`);
        }
        var settings = role.settings;
        if (settings) { await settings.reset(['self.category', 'self.reaction', 'self.message']) }
        return message.send(':white_check_mark: Self role removed! Once you have made all your changes, you must use the selfroles command with no parameters to re-generate the messages in the selfRolesChannel.')
    }

    async regenerate (message, []) {
        const selfRole = message.guild.settings.selfRolesChannel;
        if (!selfRole) {
            return message.send(`:x: I was unable to determine what the selfRolesChannel is. Please check your guild settings.`);
        }
        const _channel = message.client.channels.resolve(selfRole);
        if (!_channel) {
            return message.send(`:x: I was unable to determine what the selfRolesChannel is. Please check your guild settings and make sure the channel exists.`);
        }
        await generateMessages(message, _channel);
        return message.send(':white_check_mark: Self roles messages have been re-generated!')
    }

};


async function generateMessages (message, selfRolesChannel) {
    await pruneMessageChannel(selfRolesChannel);
    var selfRoles = {}
    message.guild.roles.each((role) => {
        console.log(`Checking role ${role.id}`)
        var settings = role.settings;
        if (settings && settings.self && settings.self.category !== null && settings.self.reaction !== null) {
            console.log(`Has settings!`)
            if (typeof selfRoles[ settings.self.category ] === 'undefined')
                selfRoles[ settings.self.category ] = []
            selfRoles[ settings.self.category ].push({ role: role, reaction: settings.self.reaction })
        }
    })

    var i = 0;
    for (const category in selfRoles) {
        if (Object.prototype.hasOwnProperty.call(selfRoles, category)) {
            console.log(`Checking category ${category}`)
            setTimeout(async () => {
                console.log(`Executing category ${category}`)
                var response = `**__${category} self roles__**` + "\n"
                selfRoles[ category ].map((role) => {
                    console.dir(role.reaction);
                    response += "\n" + `${role.reaction.name} | ${role.role.name}`
                })
                var msg = await selfRolesChannel.send(response)
                selfRoles[ category ].map((role, index) => {
                    var settings = role.role.settings;
                    if (settings) { settings.update(`self.message`, msg) }
                    setTimeout(() => {
                        msg.react(role.reaction);
                    }, index * 1000)
                    i++;
                })
            }, i * 1000);
            i++;
        }
    }

}

async function pruneMessageChannel (channel, limit = 1000) {
    wait.for.time(3);
    var iteration = 0;
    while (limit > 0 && iteration < 10) {
        var filtered = await _pruneMessageChannel(channel, limit);
        if (filtered <= 0)
            limit = -1;
        limit -= filtered;
        wait.for.time(10);
        iteration++;
    }
    return true;
}

async function _pruneMessageChannel (channel, amount) {
    let messages = await channel.messages.fetch({ limit: 100 });
    if (messages.array().length <= 0)
        return -1;
    messages = messages.array().slice(0, amount);
    await channel.bulkDelete(messages);
    return messages.length;
}
