const {MessageEmbed} = require('discord.js');
const moment = require("moment");

module.exports = class ModLog {

    constructor(guild) {
        this.guild = guild;
        this.client = guild.client;
        this.case = null;
        this.type = null;
        this.user = null;
        this.moderator = null;
        this.reason = null;
        this.discipline = null;
        this.otherDiscipline = null;
        this.channel = null;
        this.case = null;
        this.expiration = null;
        this.rules = [];
        this.channelRestrictions = [];
        this.permissions = [];
        this.banDuration = null;
        this.muteDuration = null;
        this.classD = {
            apology: null,
            research: null,
            retraction: null
        };
    }

    setType(type) {
        this.type = type;
        return this;
    }

    setUser(user) {
        this.user = {
            id: user.id,
            tag: user.tag
        };
        return this;
    }

    // Here we get all the info about the executing Moderator

    setModerator(user) {
        this.moderator = {
            id: user.id,
            tag: user.tag,
            avatar: user.displayAvatarURL()
        };
        return this;
    }

    setReason(reason = null) {
        if (reason instanceof Array)
            reason = reason.join(' ');
        this.reason = reason;
        return this;
    }

    setExpiration(expiration) {
        this.expiration = expiration;
        return this;
    }

    setDiscipline(discipline) {
        this.discipline = discipline;
        return this;
    }

    setOtherDiscipline(other = null) {
        if (other instanceof Array)
            other = other.join('; ');
        this.otherDiscipline = other;
        return this;
    }

    setChannel(channel) {
        this.channel = channel;
        return this;
    }

    setCase(value) {
        this.case = value;
        return this;
    }

    setRules (array) {
        this.rules = array;
        return this;
    }

    setChannelRestrictions (array) {
        this.channelRestrictions = array;
        return this;
    }

    setPermissions (array) {
        this.permissions = array;
        return this;
    }

    setClassD (obj) {
        this.classD = obj;
        return this;
    }

    setMuteDuration (hours) {
        this.muteDuration = hours;
        return this;
    }

    setBanDuration (days) {
        this.banDuration = days;
        return this;
    }

    // Send the log to the modlog channel

    async send() {
        const channel = this.guild.channels.resolve(this.guild.settings.modLogChannel);
        if (channel)
        {
            await channel.send({embed: this.embed});
        }
        const user = this.client.users.resolve(this.user.id);
        await user.guildSettings(this.guild.id).update(`modLogs`, this.pack, {action: 'add'});
        return this.pack;
    }

    // Here we build the modlog embed

    get embed() {
        const embed = new MessageEmbed()
                .setTitle(`Discipline issued: ${this.type}`)
                .setAuthor(this.user.tag, this.user.avatar)
                .setColor(ModLog.colour(this.type))
                .setDescription(this.reason)
                .addField(`Rule Numbers Violated`, this.rules.join(", "))
                .addField(`Issued By`, this.moderator.tag)
                .addField(`Standard Discpline`, JSON.stringify(this.discipline))
                .addField(`Reflection / Accountability`, JSON.stringify(this.classD))
                .addField(`Channel Restrictions`, JSON.stringify(this.channelRestrictions))
                .addField(`Permission Restriction Roles`, JSON.stringify(this.permissions))
                .addField(`Additional Discpline`, this.otherDiscipline)
                .addField(`Expiration`, this.expiration ? this.expiration : 'None')
                .setFooter(`Case ${this.case} | :link: ${this.client.options.dashboardHooks.origin}/modlogs.html?user=${this.user.id}&case=${this.case}`);
        return embed;
    }

    // Here we get the case number and create a modlog provider entry

    // Here we pack all the info together

    get pack() {
        return {
            case: this.case,
            date: moment().toISOString(true),
            type: this.type,
            user: this.user,
            moderator: this.moderator,
            reason: this.reason,
            rules: this.rules,
            discipline: this.discipline,
            classD: this.classD,
            channelRestrictions: this.channelRestrictions,
            permissions: this.permissions,
            otherDiscipline: this.otherDiscipline,
            channel: this.channel,
            expiration: this.expiration,
            banDuration: this.banDuration,
            muteDuration: this.muteDuration,
            valid: true
        };
    }

    // And here we just define the color for a certain type of offence or action

    static colour(type) {
        switch (type) {
            case 'classF':
                return 16724253;
            case 'classC':
                return 1822618;
            case 'classA':
                return 16564545;
            case 'classE':
                return 16573465;
            case 'classD':
                return 15014476;
            case 'classB':
                return 8421631;
            default:
                return 16777215;
        }
    }

};

