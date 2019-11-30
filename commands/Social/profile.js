const { Command } = require('klasa');
const moment = require("moment");
const { createCanvas, loadImage } = require('canvas');
const config = require("../../config");
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            subcommands: true,
            runIn: [ 'text' ],
            description: 'View your profile or the profile of another user; or, edit your profile info.',
            usage: '<title|identities|pronouns|dob|location|factions|info|background|color|badge|show:default> [user:user] [parameter:string]',
            usageDelim: ' | ',
            cooldown: 30,
            requiredSettings: [ "botChannel" ],
        });
    }

    async title (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;

        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: Let's not get excessive; titles can't be over 48 characters long.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: You don't need fancy text in titles.`);

        if (user.id === message.author.id && await yangStore(message, 'profileTitle', 1)) {
            await user.guildSettings(message.guild.id).update('profile.title', parameter);
            return message.send(":white_check_mark: Title has been updated!");
        }
    }

    async identities (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;
        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: Let's not get excessive; identities can't be over 48 characters long.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: You don't need fancy text in identities.`);

        await user.guildSettings(message.guild.id).update('profile.identities', parameter);

        return message.send(":white_check_mark: Identities has been updated!");
    }

    async pronouns (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;
        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: Let's not get excessive; pronouns can't be over 48 characters long.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: You don't need fancy text for pronouns.`);

        await user.guildSettings(message.guild.id).update('profile.pronouns', parameter);

        return message.send(":white_check_mark: Pronouns have been updated!");
    }

    async dob (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;
            if (user.guildSettings(message.guild.id).profile.dob !== "" && user.guildSettings(message.guild.id).profile.dob !== null)
                return message.send(`:x: You already set your birthday. Please contact staff if you put the wrong birthday.`);
        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        if (!moment(parameter).isValid())
            return message.send(`:x: I don't understand what date that is.`);

        await user.guildSettings(message.guild.id).update('profile.dob', parameter);

        return message.send(":white_check_mark: date of birth has been updated!");
    }

    async location (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;
        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: Let's not get excessive; location can't be more than 48 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: You don't need special characters for location.`);

        await user.guildSettings(message.guild.id).update('profile.location', parameter);

        return message.send(":white_check_mark: location has been updated!");
    }

    async factions (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;
        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: Let's not get excessive; factions can't be more than 48 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: You don't need fancy text in your factions.`);

        await user.guildSettings(message.guild.id).update('profile.factions', parameter);

        return message.send(":white_check_mark: factions has been updated!");
    }

    async info (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;
        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        if (parameter.length > 512)
            return message.send(`:x: Let's not get excessive; info can't be more than 512 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: You don't need fancy text in your info.`);

        await user.guildSettings(message.guild.id).update('profile.info', parameter);

        return message.send(":white_check_mark: info has been updated!");
    }

    async background (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;
        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        await message.send(`:question: Please send an attachment of the background you want to use. Or, send the word "clear" to remove your current background. You have 5 minutes to respond.`);
        try {
            var messages = await message.channel.awaitMessages(dmessage => dmessage.author.id === message.author.id && (dmessage.attachments.size > 0 || dmessage.content === "clear"),
                { max: 1, time: 300000, errors: [ 'time' ] });
        } catch (err) {
            return message.send(`:x: I didn't hear back from you. I canceled your !profile background command.`);
        }
        var themessage = messages.first();
        if (themessage.content === "clear") {
            user.guildSettings(message.guild.id).reset('profile.background');
        } else {
            if (user.id === message.author.id && await yangStore(message, 'profileBackground', 1)) {
                var url = themessage.attachments.first().url;
                await user.guildSettings(message.guild.id).update('profile.background', url);
                return message.send(":white_check_mark: background has been updated!");
            }
        }
        themessage.delete();
    }

    async color (message, [ user = null, parameter = "" ]) {
        if (user === null || user.id === message.author.id) {
            user = message.author;
        } else {
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);
        }

        var hue = await message.awaitReply(`:question: What would you like the hue to be (between 0 and 360)? You have 1 minute to respond.`, 60000)
        if (!hue)
            return message.send(`:x: I didn't hear anything from you about what profile hue you wanted. The command timed out.`);

        hue = parseFloat(hue);

        if (isNaN(hue))
            return message.send(`:x: That's not a number. Please try again.`);

        if (hue < 0 || hue > 360)
            return message.send(`:x: hue must be between 0 and 360.`);

        var sat = await message.awaitReply(`:question: What would you like the saturation to be (between 0 and 100)? You have 1 minute to respond.`, 60000)
        if (!sat)
            return message.send(`:x: I didn't hear anything from you about what saturation you wanted. The command timed out.`);

        sat = parseFloat(sat);

        if (isNaN(sat))
            return message.send(`:x: That's not a number. Please try again.`);

        if (sat < 0 || sat > 100)
            return message.send(`:x: saturation must be between 0 and 100.`);

        var l = await message.awaitReply(`:question: What would you like the lightness to be (between 0 and 1000)? Use 100 to maintain current lightness. You have 1 minute to respond.`, 60000)
        if (!l)
            return message.send(`:x: I didn't hear anything from you about profile color lightness. Command timed out.`);

        l = parseFloat(l);

        if (isNaN(l))
            return message.send(`:x: That's not a number. Please try again.`);

        if (l < 0 || l > 1000)
            return message.send(`:x: lightness must be between 0 and 1000.`);

        if (user.id === message.author.id && await yangStore(message, 'profileColor', 1)) {
            await user.guildSettings(message.guild.id).update('profile.profileColor.hue', hue);
            await user.guildSettings(message.guild.id).update('profile.profileColor.saturation', sat);
            await user.guildSettings(message.guild.id).update('profile.profileColor.lightness', l);

            return message.send(":white_check_mark: Profile colors have been updated!");
        }
    }

    async badge (message, [ user = null, parameter = "" ]) {
        const { permission } = await this.client.permissionLevels.run(message, 4);
        if (!permission)
            return message.send(`:x: Ha ha, you're not a staff member. Good try, though.`);

        if (user === null)
            user = message.author;

        if (parameter === "remove") {
            var toRemove = await message.awaitReply(`:question: Which badge do you want to remove from this user? Specify a number from 1 to 15, where 1 is the top left badge, counting right, and then counting down (the left badge in row 2 is 4).`, 60000);
            if (!toRemove || toRemove < 1 || toRemove > 15)
                return message.send(`:x: That's an invalid badge number. Please try the command again.`);

            var badges = user.guildSettings(message.guild.id).profile.badges;
            if (badges.length > 0)
                badges = badges.reverse();

            await user.guildSettings(message.guild.id).update('profile.badges', badges[ toRemove - 1 ], { action: 'remove' });
        } else {
            await message.send(`:question: Please upload an attachment containing the badge you want to award this member. Or, send a message containing a link to it. It is highly advised to use square images. You have 3 minutes.`);
            try {
                var messages = await message.channel.awaitMessages(dmessage => dmessage.author.id === message.author.id && (dmessage.attachments.size > 0 || /(https?:\/\/[^\s]+)/g.test(dmessage.content)),
                    { max: 1, time: 180000, errors: [ 'time' ] });
            } catch (err) {
                return message.send(`:x: I didn't receive a valid image from you for the badge. The command was canceled.`);
            }
            var themessage = messages.first();
            if (themessage.attachments.size > 0) {
                var url = themessage.attachments.first().url;
            } else {
                var url = themessage.cleanContent;
            }
            await user.guildSettings(message.guild.id).update('profile.badges', url, { action: 'add' });
            themessage.delete();
        }

        return message.send(":white_check_mark: Badge has been updated!");
    }

    async show (message, [ user = null ]) {
        if (user === null)
            user = message.author;
        return message.send(`:link: ${message.client.options.dashboardHooks.origin}/profile.html?user=${user.id}`);
    }

};