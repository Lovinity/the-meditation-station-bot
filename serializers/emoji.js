// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Emoji, GuildEmoji, ReactionEmoji } = require('discord.js');
const { Serializer } = require('klasa');

module.exports = class extends Serializer {

    deserialize (data, piece, language) {
        if (data instanceof Emoji || data instanceof GuildEmoji || data instanceof ReactionEmoji) return data;
        if (typeof data !== 'string') throw this.constructor.error(language, piece.key);

        const emoji = this.constructor.regex.snowflake.test(data) ? this.client.emojis.get(data) : null;
        if (emoji) return emoji;
        throw message.language.get('RESOLVER_INVALID_EMOJI', possible.name);
    }

    serialize (data) {
        return data.name;
    }

    stringify (data) {
        return data.name;
    }

};