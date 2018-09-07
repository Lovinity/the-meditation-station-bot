const {Client, PermissionLevels} = require('klasa');
const config = require('./config.js');
require('./util/extendTextChannel');
require('./util/extendUser');
require('./util/extendGuildMember');
require('./util/extendGuild');

// Prepare Klasa
var client = new Client({
    clientOptions: {
        fetchAllMembers: false
    },
    prefix: '!',
    commandEditing: true,
    typing: true,
    providers: {
        default: 'rethinkdb',
        rethinkdb: {
            pool: true,
            servers: [{host: 'localhost', port: 28015}]
        }
    },
    // Add custom permissions
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

// Add a channels gateway
client.gateways.register('channels', {
    conflictResolution: {
        type: 'string',
        array: true
    }
});

// Add a users gateway with no schema (there will be folders for each guild)
client.gateways.register('user');

// login the client
client.login(config.botToken);