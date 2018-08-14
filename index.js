const {Client, PermissionLevels} = require('klasa');
const config = require('./config.js');
require('./util/conflictResolution');

var client = new Client({
    clientOptions: {
        fetchAllMembers: false
    },
    prefix: '!',
    commandEditing: true,
    typing: true,
    providers: {
        default: 'json'
    },
    permissionLevels: new PermissionLevels()
            // everyone can use these commands
            .add(0, () => true)
            // Members can view audit logs
            .add(4, (client, message) => message.guild && message.member.permissions.has('VIEW_AUDIT_LOG'), {fetch: true})
            // Members of guilds must have 'MANAGE_GUILD' permission
            .add(6, (client, message) => message.guild && message.member.permissions.has('MANAGE_GUILD'), {fetch: true})
            // The member using this command must be the guild owner
            .add(7, (client, message) => message.guild && message.member === message.guild.owner, {fetch: true})
            // Bot owner
            .add(9, (client, message) => message.author === client.owner, {break: true})
            // Allows the bot owner to use Bot Owner only commands, which silently fail for other users.
            .add(10, (client, message) => message.author === client.owner),
    readyMessage: (client) => `Ready to serve ${client.guilds.size} guilds and ${client.users.size} users`,
});

client.gateways.register('channels', {
    conflictResolution: {
        type: 'string',
        array: true
    }
});

client.login(config.botToken);