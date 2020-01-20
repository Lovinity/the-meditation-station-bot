const { Command, CommandPrompt, CommandUsage } = require('klasa');
var wait = require('wait-for-stuff');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            subcommands: true,
            runIn: [ 'text' ],
            permissionLevel: 4,
            description: 'Manage reaction-based self-assignable roles',
            usage: '<add|remove|regenerate:default> [role:rolename]',
            usageDelim: ' | ',
            cooldown: 15,
            requiredSettings: [ "selfRolesChannel" ],
            promptLimit: 1,
            promptTime: 60000
        });
    }

    async add (message, [ role ]) {

        // Role is required argument for this subcommand. Validate and prompt.
        if (!user || !badgeid) {
            var usage = new CommandUsage(message.client, `<add|remove|regenerate:default> <role:rolename>`, ` | `, this);
            var prompt = new CommandPrompt(message, usage, { limit: 1, time: 60000 });
            await prompt.run();
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
        category.delete();
        return message.send(':white_check_mark: Self role added/edited! Once you have made all your changes, you must use the selfroles command with no parameters to re-generate the messages in the selfRolesChannel.')
    }

    async remove (message, [ role ]) {
        if (!role) {
            return message.send(`:x: Role id/name/mention is required.`);
        }
        var settings = role.settings;
        if (settings) { await settings.reset([ 'self.category', 'self.reaction', 'self.message' ]) }
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
    await pruneMessageChannel(message, selfRolesChannel);
    var selfRoles = {}
    message.guild.roles.each((role) => {
        var settings = role.settings;
        if (settings && settings.self && settings.self.category !== null && settings.self.reaction !== null) {
            if (typeof selfRoles[ settings.self.category ] === 'undefined')
                selfRoles[ settings.self.category ] = []
            selfRoles[ settings.self.category ].push({ settings, role })
        }
    })

    await selfRolesChannel.send(`:sun_with_face: **__SELF ROLES__** :sun_with_face: 
Use this channel to assign or remove self roles to yourself. React to the message with the emoji of the role you want to add or remove. If you don't have it, it will be added. If you have it, it will be removed. The bot will remove your message reaction to indicate the role was successfully added or removed.` + "\n\n")

    for (const category in selfRoles) {
        if (Object.prototype.hasOwnProperty.call(selfRoles, category)) {
            wait.for.time(1);
            var response = `**__${category} self roles__**` + "\n"
            selfRoles[ category ].map((setting) => {
                var emoji = parseEmoji(setting.settings.self.reaction)
                response += "\n" + `${emoji.name} | ${setting.role.name}`
            })
            var msg = await selfRolesChannel.send(response)
            selfRoles[ category ].map((setting, index) => {
                wait.for.time(1);
                if (setting.settings) { setting.settings.update(`self.message`, msg) }
                var emoji = parseEmoji(setting.settings.self.reaction)
                msg.react(emoji.name);
            })
        }
    }

}

async function pruneMessageChannel (message, channel, limit = 100) {
    var iteration = 0;
    var before = message.id;
    while (limit > 0 && iteration < 10) {
        var filtered = await _pruneMessageChannel(channel, limit, before);
        if (filtered[0] <= 0)
            limit = -1;
        limit -= filtered[0];
        before = filtered[1];
        wait.for.time(1);
        iteration++;
    }
    return true;
}

async function _pruneMessageChannel (channel, amount, before) {
    let messages = await channel.messages.fetch({ limit: 100, before: before });
    if (messages.array().length <= 0)
        return [-1];
    before = messages.lastKey();
    messages = messages.array().slice(0, amount);
    messages.map((msg) => {
        msg.delete();
    });
    return [ messages.length, before ];
}

function parseEmoji (data) {
    var data = `${data}`.split(':');
    if (data.length > 1) {
        data = { name: data[ 0 ], id: data[ 1 ] }
    } else {
        data = { name: String.fromCodePoint(parseInt(data[ 0 ])) }
    }

    return data;
}