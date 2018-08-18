const {MessageEmbed} = require('discord.js');
const moment = require("moment");

module.exports = class ModLog {

    constructor(guild) {
        this.guild = guild;
        this.client = guild.client;
        this.type = null;
        this.user = null;
        this.moderator = null;
        this.reason = null;
        this.discipline = null;
        this.channel = null;
        this.case = null;
        this.expiration = null;
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
    
    setChannel(channel) {
        this.channel = channel;
        return this;
    }

    // Send the log to the modlog channel

    async send() {
        const channel = this.guild.channels.get(this.guild.settings.get('modLogChannel'));
        await this.getCase();
        if (channel)
        {
            await channel.send({embed: this.embed});
        }
        
        return this.pack;
    }

    // Here we build the modlog embed

    get embed() {
        const embed = new MessageEmbed()
                .setAuthor(this.moderator.tag, this.moderator.avatar)
                .setColor(ModLog.colour(this.type))
                .setDescription([
                    `**Type**: ${this.type[0].toUpperCase() + this.type.slice(1)}`,
                    `**User**: ${this.user.tag} (${this.user.id})`,
                    `**Reason**: ${this.reason}`,
                    `**Discipline**: ${JSON.stringify(this.discipline)}`,
                    `${this.expiration ? `**Expiration**: ${this.expiration}` : ``}`
                ])
                .setFooter(`Case ${this.case}`)
                .setTimestamp();
        return embed;
    }

    // Here we get the case number and create a modlog provider entry

    async getCase() {
        this.case = Date.now().toString(36) + (this.client.shard ? this.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97);
        const user = this.client.users.get(this.user.id);
        await user.settings.update(`${this.guild.id}.modLogs`, this.pack, {action: 'add'});
        return this.case;
    }

    // Here we pack all the info together

    get pack() {
        return {
            case: this.case,
            date: moment().toISOString(true),
            type: this.type,
            user: this.user,
            moderator: this.moderator,
            reason: this.reason,
            discipline: this.discipline,
            channel: this.channel,
            expiration: this.expiration,
            valid: true
        };
    }

    // And here we just define the color for a certain type of offence or action

    static colour(type) {
        switch (type) {
            case 'ban':
                return 16724253;
            case 'usethis':
                return 1822618;
            case 'warn':
                return 16564545;
            case 'tempban':
                return 16573465;
            case 'mute':
                return 15014476;
            case 'discipline':
                return 8421631;
            default:
                return 16777215;
        }
    }

};
