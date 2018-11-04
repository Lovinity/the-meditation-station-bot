const { Structures } = require('discord.js');

Structures.extend('TextChannel', TextChannel => {
	class MyTextChannel extends TextChannel {

		constructor(...args) {
			super(...args);

			this.settings = this.client.gateways.channels.get(`${this.guild.id}-${this.id}`, true);
		}

	}

	return MyTextChannel;
});

Structures.extend('CategoryChannel', CategoryChannel => {
	class MyCategoryChannel extends CategoryChannel {

		constructor(...args) {
			super(...args);

			this.settings = this.client.gateways.channels.get(`${this.guild.id}-${this.id}`, true);
		}

	}

	return MyCategoryChannel;
});

Structures.extend('VoiceChannel', VoiceChannel => {
	class MyVoiceChannel extends VoiceChannel {

		constructor(...args) {
			super(...args);

			this.settings = this.client.gateways.channels.get(`${this.guild.id}-${this.id}`, true);
		}

	}

	return MyVoiceChannel;
});

Structures.extend('GuildChannel', GuildChannel => {
	class MyGuildChannel extends GuildChannel {

		constructor(...args) {
			super(...args);

			this.settings = this.client.gateways.channels.get(`${this.guild.id}-${this.id}`, true);
		}

	}

	return MyGuildChannel;
});
