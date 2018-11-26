const {Command} = require('klasa');
const moment = require("moment");
const {createCanvas, loadImage} = require('canvas');
const config = require("../../config");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            subcommands: true,
            runIn: ['text'],
            description: 'View your profile or the profile of another user; or, edit your profile info.',
            usage: '<title|gender|pronouns|dob|location|factions|info|background|color|show:default> [user:username] [parameter:string]',
            usageDelim: ' | ',
            cooldown: 30,
            requiredSettings: ["botChannel"],
        });
    }

    async title(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the titles of other members.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: Titles may only contain a maximum of 48 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: Titles may not contain special characters.`);

        config.profanity.forEach((word) => {
            var numbers = getIndicesOf(word, parameter, false);
            if (numbers.length > 0)
            {
                return message.send(`:x: Titles may not contain profanity.`);
            }
        });

        await user.guildSettings(message.guild.id).update('profile.title', parameter);

        return message.send(":white_check_mark: Title has been updated.");
    }

    async gender(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the genders of other members.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: Genders may only contain a maximum of 48 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: Genders may not contain special characters.`);

        config.profanity.forEach((word) => {
            var numbers = getIndicesOf(word, parameter, false);
            if (numbers.length > 0)
            {
                return message.send(`:x: Genders may not contain profanity.`);
            }
        });

        await user.guildSettings(message.guild.id).update('profile.gender', parameter);

        return message.send(":white_check_mark: Gender has been updated.");
    }

    async pronouns(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the pronouns of other members.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: pronouns may only contain a maximum of 48 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: pronouns may not contain special characters.`);

        config.profanity.forEach((word) => {
            var numbers = getIndicesOf(word, parameter, false);
            if (numbers.length > 0)
            {
                return message.send(`:x: pronouns may not contain profanity.`);
            }
        });

        await user.guildSettings(message.guild.id).update('profile.pronouns', parameter);

        return message.send(":white_check_mark: pronouns have been updated.");
    }

    async dob(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the dob of other members.`);
        }

        if (!moment(parameter).isValid())
            return message.send(`:x: The date you provided does not seem like a valid date.`);

        await user.guildSettings(message.guild.id).update('profile.dob', parameter);

        return message.send(":white_check_mark: date of birth has been updated.");
    }

    async location(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the location of other members.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: location may only contain a maximum of 48 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: location may not contain special characters.`);

        config.profanity.forEach((word) => {
            var numbers = getIndicesOf(word, parameter, false);
            if (numbers.length > 0)
            {
                return message.send(`:x: location may not contain profanity.`);
            }
        });

        await user.guildSettings(message.guild.id).update('profile.location', parameter);

        return message.send(":white_check_mark: location has been updated.");
    }

    async factions(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the factions of other members.`);
        }

        if (parameter.length > 48)
            return message.send(`:x: factions may only contain a maximum of 48 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: factions may not contain special characters.`);

        config.profanity.forEach((word) => {
            var numbers = getIndicesOf(word, parameter, false);
            if (numbers.length > 0)
            {
                return message.send(`:x: factions may not contain profanity.`);
            }
        });

        await user.guildSettings(message.guild.id).update('profile.factions', parameter);

        return message.send(":white_check_mark: factions has been updated.");
    }

    async info(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the info of other members.`);
        }

        if (parameter.length > 512)
            return message.send(`:x: info may only contain a maximum of 512 characters.`);

        if (/[^\x20-\x7E]/g.test(parameter))
            return message.send(`:x: info may not contain special characters.`);

        config.profanity.forEach((word) => {
            var numbers = getIndicesOf(word, parameter, false);
            if (numbers.length > 0)
            {
                return message.send(`:x: info may not contain profanity.`);
            }
        });

        await user.guildSettings(message.guild.id).update('profile.info', parameter);

        return message.send(":white_check_mark: info has been updated.");
    }

    async background(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the background of other members.`);
        }

        await message.send(`:question: Please send an attachment of the background you want to use. Or, send the word "clear" to remove your current background. You have 5 minutes to respond.`);
        message.channel.awaitMessages(dmessage => dmessage.author.id === message.author.id && (dmessage.attachments.size > 0 || dmessage.content === "clear"),
                {max: 1, time: 300000, errors: ['time']})
                .then(messages => {
                    var themessage = messages.first();
                    if (themessage.content === "clear")
                    {
                        user.guildSettings(message.guild.id).reset('profile.background');
                    } else {
                        var url = themessage.attachments.first().url;
                        user.guildSettings(message.guild.id).update('profile.background', url);
                    }
                    return message.send(":white_check_mark: background has been updated.");
                })
                .catch((err) => {
                    message.send(`:x: An image was not provided; the profile background command was aborted.`);
                    console.error(err);
                });
    }

    async color(message, [user = null, parameter = ""]) {
        if (user === null)
        {
            user = message.author;
        } else {
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return message.send(`:x: Only staff may edit the color of other member profiles.`);
        }

        var hue = await message.awaitReply(`:question: What would you like the hue to be (between 0 and 360)? You have 1 minute to respond.`, 60000)
        if (!hue)
            return message.send(`:x: Response for profile color timed out.`);

        hue = parseFloat(hue);

        if (isNaN(hue))
            return message.send(`:x: Invalud number passed for hue. Please try the command again.`);

        if (hue < 0 || hue > 360)
            return message.send(`:x: hue must be between 0 and 360.`);

        var sat = await message.awaitReply(`:question: What would you like the saturation to be (between 0 and 100)? You have 1 minute to respond.`, 60000)
        if (!sat)
            return message.send(`:x: Response for profile color timed out.`);

        sat = parseFloat(sat);

        if (isNaN(sat))
            return message.send(`:x: Invalud number passed for saturation. Please try the command again.`);

        if (sat < 0 || sat > 100)
            return message.send(`:x: saturation must be between 0 and 100.`);

        var l = await message.awaitReply(`:question: What would you like the lightness to be (between 0 and 1000)? Use 100 to maintain current lightness. You have 1 minute to respond.`, 60000)
        if (!l)
            return message.send(`:x: Response for profile color timed out.`);

        l = parseFloat(l);

        if (isNaN(l))
            return message.send(`:x: Invalud number passed for lightness. Please try the command again.`);

        if (l < 0 || l > 1000)
            return message.send(`:x: lightness must be between 0 and 1000.`);

        await user.guildSettings(message.guild.id).update('profile.profileColor.hue', hue);
        await user.guildSettings(message.guild.id).update('profile.profileColor.saturation', sat);
        await user.guildSettings(message.guild.id).update('profile.profileColor.lightness', l);

        return message.send(":white_check_mark: Profile colors have been updated.");
    }

    async show(message, [user = null]) {
        const canvas = createCanvas(480, 360);

        if (user === null)
            user = message.author;

        var xp = user.guildSettings(message.guild.id).xp;
        var profile = user.guildSettings(message.guild.id).profile;

        var level = Math.floor(0.177 * Math.sqrt(xp)) + 1;
        var upper = Math.ceil((level / 0.177) ** 2);
        var lower = Math.ceil(((level - 1) / 0.177) ** 2);
        var fillValue = Math.min(Math.max((xp - lower) / (upper - lower), 0), 1);

        var ctx = canvas.getContext('2d');
        ctx.save();
        if (profile.background && profile.background !== null)
        {
            try {
                var background = await loadImage(profile.background);
                ctx.drawImage(background, 0, 0, 480, 360);
                ctx.scale(1, 1);
                ctx.patternQuality = 'billinear';
                ctx.filter = 'bilinear';
                ctx.antialias = 'subpixel';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowOffsetY = 2;
                ctx.shadowBlur = 2;
            } catch (e) {

            }
        }
        ctx.restore();
        ctx.save();
        try {
            var image = await loadImage('assets/images/profile.png');
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(image, 0, 0, 480, 360);

            var hue = profile.profileColor.hue;
            var sat = profile.profileColor.saturation;
            var l = profile.profileColor.lightness;

            // adjust "lightness"
            ctx.globalCompositeOperation = l < 100 ? "color-burn" : "color-dodge";
            // for common slider, to produce a valid value for both directions
            l = l >= 100 ? l - 100 : 100 - (100 - l);
            ctx.fillStyle = "hsl(0, 50%, " + l + "%)";
            ctx.fillRect(0, 0, 480, 360);

            // adjust saturation
            ctx.globalCompositeOperation = "saturation";
            ctx.fillStyle = "hsl(0," + sat + "%, 50%)";
            ctx.fillRect(0, 0, 480, 360);

            // adjust hue
            ctx.globalCompositeOperation = "hue";
            ctx.fillStyle = "hsl(" + hue + ",1%, 50%)";
            ctx.fillRect(0, 0, 480, 360);

            // clip
            ctx.globalCompositeOperation = "destination-in";
            ctx.drawImage(image, 0, 0, 480, 360);
        } catch (e) {

        }
        // reset comp. mode to default
        ctx.globalCompositeOperation = "source-over";

        ctx.restore();
        ctx.save();
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        try {
            var avatar = await loadImage(user.displayAvatarURL({format: 'png'}));
            ctx.drawImage(avatar, 9, 13, 100, 100);
        } catch (e) {
            console.error(e);
        }
        ctx.restore();

        var lines = wrapText(ctx, profile.info, 350);

        // Username
        ctx.font = '24px Roboto';
        ctx.fillStyle = '#FFCBCB';
        ctx.fillText(user.tag, 116, 85);

        // Title
        ctx.font = '14px Roboto';
        ctx.fillStyle = '#FFCBCB';
        ctx.fillText(profile.title, 116, 110);

        // bad credibility
        ctx.font = '14px Roboto';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(user.guildSettings(message.guild.id).badRep, 31, 130);

        // good credibility
        ctx.font = '14px Roboto';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText(user.guildSettings(message.guild.id).goodRep, 88, 130);

        // level fill
        ctx.font = '10px Roboto';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#72ffa7';
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(118, 118, fillValue * 98, 15);

        // level
        ctx.font = '10px Roboto';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333333';
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.fillText(`LVL ${level}: ${xp}`, 165, 128);

        // Yang / money
        ctx.font = '14px Roboto';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText(user.guildSettings(message.guild.id).yang, 271, 130);

        // Donations
        ctx.font = '14px Roboto';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText(profile.donations, 363, 130);

        // activity
        ctx.font = '14px Roboto';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText("NA", 440, 130);

        // joined
        var joined = await message.guild.members.fetch(user);
        if (joined)
            joined = joined.joinedAt;

        ctx.font = '12px Roboto';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.fillText(joined ? moment(joined).format("LLL") : "<Member not in the guild>", 219, 164);

        // gender
        ctx.font = '12px Roboto';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.fillText(profile.gender, 219, 181);

        // pronouns
        ctx.font = '12px Roboto';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.fillText(profile.pronouns, 219, 199);

        // DOB
        ctx.font = '12px Roboto';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.fillText(profile.dob, 219, 216);

        // Location
        ctx.font = '12px Roboto';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.fillText(profile.location, 219, 233);

        // Factions
        ctx.font = '12px Roboto';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.fillText(profile.factions, 219, 250);

        // Info
        ctx.font = '10px Roboto';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        lines.forEach((line, i) => {
            if (i < 7)
                ctx.fillText(line, 116, (i * 12) + 265);
        });

        return message.send('', {files: [canvas.toBuffer()]});
    }

};


function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let line = '';

    if (ctx.measureText(text).width < maxWidth) {
        return [text];
    }

    while (words.length > 0) {
        let split = false;

        while (ctx.measureText(words[0]).width >= maxWidth) {
            const tmp = words[0];
            words[0] = tmp.slice(0, -1);

            if (!split) {
                split = true;
                words.splice(1, 0, tmp.slice(-1));
            } else {
                words[1] = tmp.slice(-1) + words[1];
            }
        }

        if (ctx.measureText(line + words[0]).width < maxWidth) {
            line += `${words.shift()} `;
        } else {
            lines.push(line);
            line = '';
        }

        if (words.length === 0) {
            lines.push(line);
        }
    }

    return lines;
}


function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}