const { Client, PermissionLevels, Schema } = require('klasa');
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
    .add('eventLogChannel', 'textchannel')
    .add('flagLogChannel', 'textchannel')
    .add('iceBreakerChannel', 'textchannel')
    .add('announcementsChannel', 'textchannel')
    .add('generalChannel', 'textchannel')
    .add('unverifiedChannel', 'textchannel')
    .add('starboardChannel', 'textchannel')
    .add('selfRolesChannel', 'textchannel')
    .add('inactiveChannel', 'textchannel')
    .add('noXPChannels', 'textchannel', { array: true })
    .add('noSelfModRole', 'role')
    .add('repEmoji', 'string')
    .add('muteRole', 'role')
    .add('modRole', 'role')
    .add('staffRole', 'role')
    .add('noRepRole', 'role')
    .add('inactiveRole', 'role')
    .add('conflictResolutionMembers', 'integer', { default: 3, min: 1 })
    .add('conflictResolutionTime', 'integer', { default: 15, min: 1 })
    .add('verifiedRole', 'role')
    .add('guildTasks', 'string', { configurable: false })
    .add('perspectiveQueue', 'integer', { default: 0, min: 0, configurable: false })
    .add('highestActivityScore', 'float', { configurable: false, default: 0, min: 0 })
    .add('statsMessageChannel', 'string')
    .add('statsMessage', 'string')
    .add('reportMembers', 'integer', { default: 3, min: 1 })
    .add('reportTime', 'integer', { default: 60, min: 1 })
    .add('starboardRequired', 'integer', { default: 3, min: 1 })
    .add('fuckboyRuleNumber', 'integer', { default: 1, min: 0 })
    .add('pendSuspensions', 'any', { array: true, configurable: false })
    .add('pendBans', 'any', { array: true, configurable: false })
    .add('pendIncidents', 'any', { array: true, configurable: false })
    .add('incidentsCategory', 'categorychannel')
    .add('staffCategory', 'categorychannel')
    .add('antispamCooldown', 'integer', { default: 33, min: 0, max: 100 })
    .add('antispamLessStrictRoles', 'role', { array: true })
    .add('antispamLessStrictChannels', 'textchannel', { array: true })
    .add('antispamRuleNumber', 'integer', { default: 1, min: 0 })
    .add('raidScore', 'integer', { default: 0, configurable: false })
    .add('raidMitigation', 'integer', { default: 0, configurable: false })
    .add('oneHPPerXP', 'integer', { default: 50, min: 0 })
    .add('levelRoles', folder => {
        for (var i = 2; i <= 100; i++) {
            folder.add(`level${i}`, 'role', { configurable: false });
        }
    }, { configurable: false })
    .add('yangStore', folder => {
        folder
            .add('generator', 'integer', { min: 0, default: 5 })
            .add('nick', 'integer', { min: 0, default: 25 })
            .add('profileTitle', 'integer', { min: 0, default: 50 })
            .add('profileBackground', 'integer', { min: 0, default: 150 })
            .add('profileColor', 'integer', { min: 0, default: 50 })
            .add('remindme', 'integer', { min: 0, default: 25 })
            .add('repMember', 'integer', { min: 0, default: 50 })
            .add('8ball', 'integer', { min: 0, default: 5 })
            .add('choice', 'integer', { min: 0, default: 5 })
            .add('affirmations', 'integer', { min: 0, default: 25 })
            .add('markov', 'integer', { min: 0, default: 10 })
            .add('advertisement', 'integer', { min: 0, default: 100 })
            .add('advertisementHere', 'integer', { min: 0, default: 250 })
    })
    .add('ads', 'any', { array: true, configurable: false })
    .add('badges', 'any', { array: true, configurable: false });

Client.use(require('klasa-member-gateway'));
Client.use(require('klasa-dashboard-hooks'));
Client.use(require('./klasa-selfroles-gateway'));

// Guild Member Schema
Client.defaultMemberSchema
    .add('xp', 'integer', { default: 0, configurable: false })
    .add('yang', 'integer', { default: 0, configurable: false })
    .add('HPDamage', 'integer', { default: 0, configurable: false })
    .add('goodRep', 'integer', { default: 0, configurable: false })
    .add('spamScore', 'integer', { default: 0, configurable: false })
    .add('lastMessage', 'string', { configurable: false })
    .add('activityScore', 'float', { min: 0, default: 0, configurable: false })
    .add('profile', folder => {
        folder
            .add('title', 'string')
            .add('identities', 'string')
            .add('pronouns', 'string')
            .add('dob', 'string')
            .add('location', 'string')
            .add('info', 'string')
            .add('donations', 'float', { default: 0 })
            .add('background', 'url')
            .add('badges', 'any', { array: true })
    })
    .add('restrictions', folder => {
        folder
            .add('cannotUseVoiceChannels', 'boolean', { default: false, configurable: false })
            .add('cannotGiveReputation', 'boolean', { default: false, configurable: false })
            .add('cannotUseStaffCommand', 'boolean', { default: false, configurable: false })
            .add('cannotUseReportCommand', 'boolean', { default: false, configurable: false })
            .add('cannotUseSupportCommand', 'boolean', { default: false, configurable: false })
            .add('cannotUseConflictCommand', 'boolean', { default: false, configurable: false })
            .add('cannotPurchaseAds', 'boolean', { default: false, configurable: false })
            .add('cannotEditProfile', 'boolean', { default: false, configurable: false })
    })
    .add('canRep', 'boolean', { default: true, configurable: false })
    .add('muted', 'boolean', { default: false, configurable: false })
    .add('modLogs', 'any', { array: true, configurable: false })
    .add('reports', 'string', { array: true, configurable: false })
    .add('roles', 'role', { array: true, configurable: false });

Client.defaultRoleSchema
    .add('self', folder => {
        folder
            .add('category', 'string')
            .add('message', 'messagepromise')
            .add('reaction', 'emoji');
    });

// Prepare Klasa
var client = new Client({
    clientOptions: {
        fetchAllMembers: false
    },
    clientID: '637472382797348875',
    clientSecret: config.clientSecret,
    commandEditing: true,
    typing: true,
    ignoreBots: false,
    slowmode: 5000,
    slowmodeAggressive: true,
    schedule: { interval: 5000 },
    providers: {
        default: 'mysql',
        mysql: config.providers.mysql
    },
    dashboardHooks: config.dashboardHooks,
    // Add custom permissions
    permissionLevels: new PermissionLevels()
        // everyone can use these commands
        .add(0, () => true)
        // Members can view audit logs
        .add(4, ({ guild, member }) => guild && member.permissions.has('VIEW_AUDIT_LOG'), { fetch: true })
        // Member has the guild's modRole
        .add(5, ({ guild, member }) => guild && guild.settings.modRole && member.roles.get(guild.settings.modRole), { fetch: true }, { break: true })
        // Members of guilds must have 'MANAGE_GUILD' permission
        .add(6, ({ guild, member }) => guild && member.permissions.has('MANAGE_GUILD'), { fetch: true })
        // The member using this command must be the guild owner
        .add(7, ({ guild, member }) => guild && member === guild.owner, { fetch: true })
        // Bot owner
        .add(9, ({ author, client }) => author === client.owner, { break: true })
        // Allows the bot owner to use Bot Owner only commands, which silently fail for other users.
        .add(10, ({ author, client }) => author === client.owner),
    readyMessage: (client) => `Ready to serve ${client.guilds.size} guilds and ${client.users.size} users`,
});

// Add a channels gateway
client.gateways.register('channels', {
    provider: 'mysql',
    schema: new Schema()
        .add('conflictResolution', 'string', { array: true })
});

// login the client
client.login(config.botToken);