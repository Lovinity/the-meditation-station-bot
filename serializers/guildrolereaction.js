// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Role, Emoji, GuildEmoji } = require('discord.js');
const { Serializer } = require('klasa');

module.exports = class extends Serializer {

	deserialize(data, piece, language, guild) {
        if (data.role && data.role instanceof Role && data.emoji && (data.emoji instanceof Emoji || data.emoji instanceof GuildEmoji || data.emoji instanceof ReactionEmoji)) return data;
		if (typeof data !== 'string') throw `Invalid rolereaction role/emoji`;
		const [roleID, emojiID] = data.split('/', 2);
		if (!(roleID && emojiID)) throw `Invalid rolereaction role/emoji`;

		const role = this.client.serializers.get('role').deserialize(roleID,
			{ key: piece.key, type: 'role' }, language, guild);
            const emoji = this.constructor.regex.emoji.test(arg) ? guild.emojis.get(this.constructor.regex.emoji.exec(arg)[1]) : null;
		if (emoji) return {role: role, emoji: emoji};
		// Yes, the split is supposed to be text, not code
		throw `Invalid rolereaction role/emoji`;
	}

	serialize(data) {
		return `${data.role.id}/${data.emoji.id}`;
	}

	stringify(value) {
		return `${(message.guild.roles.get(value.role) || { name: (value.role && value.role.name) || value.role }).name}/${(message.guild.emojis.get(value.emoji) || { name: (value.emoji && value.emoji.name) || value.emoji }).name}`;
	}

};