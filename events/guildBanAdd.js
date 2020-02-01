const { Event } = require('klasa');

module.exports = class extends Event {

    async run (guild, user) {
        
        // Upgrade partial messages to full users
        if (user.partial) {
            await user.fetch();
        }

        var modLogChannel = guild.channels.resolve(guild.settings.modLogChannel);
        if (!modLogChannel) {
            return;
        }

        // Find out who applied the ban
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_BAN_ADD',
        });
        const auditLog = fetchedLogs.entries.first();
        if (!auditLog || auditLog.target.id !== user.id)
            auditLog = undefined;

        // Send Log
        modLogChannel.send(`:no_entry: A guild ban was added on <@${user.id}> ${auditLog ? `by ${auditLog.executor.tag} (${auditLog.executor.id})` : ''}.`);
    }

};
