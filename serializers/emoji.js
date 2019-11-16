// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Emoji, GuildEmoji, ReactionEmoji } = require('discord.js');
const { Serializer } = require('klasa');

module.exports = class extends Serializer {

    constructor(...args) {
        super(...args, { aliases: [] });
    }

    async deserialize (data, piece, language, guild) {
        if (data instanceof Emoji || data instanceof GuildEmoji || data instanceof ReactionEmoji) return data;
        if (typeof data !== 'string') throw this.constructor.error(language, piece.key);

        console.log(`Data string`)

        var data = data.split(':');

        if (data.length > 1) {
            console.log(`length > 1`)
            data = { name: data[ 0 ], id: data[ 1 ] }
            console.dir(data)
        } else {
            console.log(`length 1`)
            data = { name: String.fromCodePoint(parseInt(data[ 0 ])) }
            console.dir(data)
        }
        console.dir(new GuildEmoji(this.client, data, this.client.guilds.get(guild)));
        return new GuildEmoji(this.client, data, this.client.guilds.get(guild));
    }

    serialize (data) {
        console.log(`Emoji serialise ${(data.id) ? `${data.name}:${data.id}` : data.name.codePointAt(0)}`)
        return (data.id) ? `${data.name}:${data.id}` : data.name.codePointAt(0);
    }

    stringify (data) {
        return (data.id) ? `${data.name}:${data.id}` : data.name;
    }

};