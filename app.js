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
        .add('selfRoles', 'role', {array: true})
        .add('levelRoles', folder => {
            for (var i = 2; i <= 100; i++)
            {
                folder.add(`level${i}`, 'role', {configurable: false});
            }
        }, {configurable: false})
        .add('yangStore', folder => {
            folder
                    .add('generator', 'integer', {min: 0, default: 0})
                    .add('nick', 'integer', {min: 0, default: 0})
                    .add('profileTitle', 'integer', {min: 0, default: 0})
                    .add('profileBackground', 'integer', {min: 0, default: 0})
                    .add('profileColor', 'integer', {min: 0, default: 0})
                    .add('remindme', 'integer', {min: 0, default: 0})
        })
        .add('badges', 'any', {array: true, configurable: false});

Client.use(require('klasa-member-gateway'));

// Guild Member Schema
Client.defaultMemberSchema
        .add('xp', 'integer', {default: 0})
        .add('yang', 'integer', {default: 0})
        .add('badRep', 'integer', {default: 0})
        .add('goodRep', 'integer', {default: 0})
        .add('spamScore', 'integer', {default: 0})
        .add('profile', folder => {
            folder
                    .add('title', 'string', {default: 'Member'})
                    .add('gender', 'string', {default: ''})
                    .add('pronouns', 'string', {default: ''})
                    .add('dob', 'string', {default: ''})
                    .add('location', 'string', {default: 'Earth'})
                    .add('factions', 'string', {default: ''})
                    .add('info', 'string', {default: ''})
                    .add('donations', 'float', {default: 0})
                    .add('badges', 'url', {array: true})
                    .add('background', 'url')
                    .add('profileColor', folder2 => {
                        folder2
                                .add('hue', 'float', {default: 0, min: 0, max: 0})
                                .add('saturation', 'float', {default: 0, min: 0, max: 100})
                                .add('lightness', 'float', {default: 100, min: 0, max: 1000});
                    });
        })
        .add('modLogs', 'any', {array: true})
        .add('reports', 'string', {array: true})
        .add('roles', 'role', {array: true});

// Prepare Klasa
var client = new Client({
    clientOptions: {
        fetchAllMembers: false
    },
    commandEditing: true,
    typing: true,
    ignoreBots: false,
    slowmode: 3000,
    slowmodeAggressive: true,
    providers: {
        default: 'mysql',
        mysql: config.providers.mysql
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
    provider: 'mysql',
    schema: new Schema()
            .add('conflictResolution', 'string', {array: true})
});

// login the client
client.login(config.botToken);