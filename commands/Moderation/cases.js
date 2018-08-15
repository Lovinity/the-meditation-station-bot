const {Command, util} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'cases',
            permLevel: 4,
            runIn: ['text'],
            description: 'Get information about a given user modlogs.',
            subcommands: true,
            usage: '<show|remove> <user:username> [caseID:string]',
            usageDelim: ' | '
        });
    }

    async show(msg, [user, caseID = null]) {

        // Get the modLogs
        const modLogs = user.settings[msg.guild.id].modLogs;

        // If a case ID was provided, return info about that case if found
        if (caseID !== null)
        {
            var log = modLogs.find(function (element) {
                return element.case === caseID;
            });

            if (log)
            {
                return msg.send([
                    `Case ID   : ${log.case}`,
                    `Date      : ${log.date}`,
                    `Type      : ${log.type}`,
                    `User      : ${log.user.tag} (${log.user.id})`,
                    `Moderator : ${log.moderator.tag} (${log.moderator.id})`,
                    `Reason:   : ${log.reason}`,
                    `Expiration: ${log.expiration}`,
                    `Counts?   : ${log.valid ? "Yes" : "No"}`
                ], {code: 'http'});
            } else {
                return msg.send(`:x: The provided user and case ID were not found.`);
            }
            // If no case ID provided, provide a mod history of the user
        } else {


            var actions = {
                ban: 0,
                unban: 0,
                mute: 0,
                kick: 0,
                warn: 0,
                discipline: 0
            };

            var cases = {
                ban: [],
                unban: [],
                mute: [],
                kick: [],
                warn: [],
                discipline: []
            };

            modLogs.forEach(function (log) {
                if (typeof actions[log.type] !== 'undefined' && log.valid)
                    actions[log.type]++;
                if (typeof cases[log.type] !== 'undefined' && log.valid)
                    cases[log.type].push(log.case);
            });

            var final = {
                warn: `${actions.warn} (${cases.warn.join(", ")})`,
                discipline: `${actions.discipline} (${cases.discipline.join(", ")})`,
                mute: `${actions.mute} (${cases.mute.join(", ")})`,
                kick: `${actions.kick} (${cases.kick.join(", ")})`,
                ban: `${actions.ban} (${cases.ban.join(", ")})`,
                unban: `${actions.unban} (${cases.unban.join(", ")})`,
            }

            return msg.send([
                `${user.tag} (${user.id}) Moderation Logs:`,
                util.codeBlock('http', Object.entries(final).map(([action, value]) => `${util.toTitleCase(`${action}s`).padEnd(11)}: ${value}`).join('\n'))
            ]);
    }
    }
    
    async remove(msg, [user, caseID = null]) {
        
        if (caseID === null)
            return msg.send(`:x: caseID is required when removing a case.`);

        // Get the modLogs
        const modLogs = user.settings[msg.guild.id].modLogs;

            var log = modLogs.find(function (element) {
                return element.case === caseID;
            });

            if (log)
            {
                await user.settings.update(`${msg.guild.id}.modLogs`, log, {action: 'remove'});
                log.valid = false;
                await user.settings.update(`${msg.guild.id}.modLogs`, log, {action: 'add'});
                return msg.send(`:white_check_mark: The log has been marked as invalid; though it remains in the system, it will not count towards the user records.`);
            } else {
                return msg.send(`:x: The provided user and case ID were not found.`);
            }
            // If no case ID provided, provide a mod history of the user
    }

};


