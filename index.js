const {Client, PermissionLevels, Schema} = require('klasa');
const config = require('./config.js');
require('./util/extendTextChannel');
require('./util/extendUser');
require('./util/extendGuildMember');
require('./util/extendGuild');

// Guild schema
Client.defaultGuildSchema
        .add('botChannel', 'textchannel')
        .add('botGamesChannel', 'textchannel')
        .add('modLogChannel', 'textchannel')
        .add('iceBreakerChannel', 'textchannel')
        .add('announcementsChannel', 'textchannel')
        .add('generalChannel', 'textchannel')
        .add('noSelfModRole', 'role')
        .add('repEmoji', 'string')
        .add('muteRole', 'role')
        .add('modRole', 'role')
        .add('raidRole', 'role')
        .add('conflictResolutionMembers', 'integer', {default: 3, min: 1})
        .add('conflictResolutionTime', 'integer', {default: 15, min: 1})
        .add('verifiedRole', 'role')
        .add('guildTasks', 'string', {configurable: false})
        .add('statsMessageChannel', 'string')
        .add('statsMessage', 'string')
        .add('reportMembers', 'integer', {default: 3, min: 1})
        .add('reportTime', 'integer', {default: 60, min: 1})
        .add('pendSuspensions', 'any', {array: true, configurable: false})
        .add('pendBans', 'any', {array: true, configurable: false})
        .add('pendIncidents', 'any', {array: true, configurable: false})
        .add('incidentsCategory', 'categorychannel')
        .add('staffCategory', 'categorychannel')
        .add('antispamCooldown', 'integer', {default: 33, min: 0, max: 100})
        .add('antispamLessStrictRoles', 'role', {array: true})
        .add('antispamLessStrictChannels', 'textchannel', {array: true})
        .add('raidScore', 'integer', {default: 0, configurable: false})
        .add('raidMitigation', 'integer', {default: 0, configurable: false})
        .add('selfRoles', 'role', {array: true});

Client.use(require('klasa-member-gateway'));

// Guild Member Schema
Client.defaultMemberSchema
    .add('xp', 'integer', {default: 0})
    .add('yang', 'integer', {default: 0})
    .add('badRep', 'integer', {default: 0})
    .add('goodRep', 'integer', {default: 0})
    .add('spamScore', 'integer', {default: 0})
    .add('profile', 'any', {array: true})
    .add('modLogs', 'any', {array: true})
    .add('reports', 'string', {array: true})
    .add('roles', 'string', {array: true});

// Prepare Klasa
var client = new Client({
    clientOptions: {
        fetchAllMembers: false
    },
    prefix: '!',
    commandEditing: true,
    typing: true,
    ignoreBots: false,
    slowmode: 3000,
    slowmodeAggressive: true,
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
    provider: 'rethinkdb',
    schema: new Schema()
            .add('conflictResolution', 'string', {array: true})
});

// Add a users gateway with no schema (there will be folders for each guild)
client.gateways.register('user');

// login the client
client.login(config.botToken);