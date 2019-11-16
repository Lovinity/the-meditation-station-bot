const { Structures } = require('discord.js');

module.exports = Structures.extend('Role', Role => {
	/**
	 * Klasa's Extended GuildMember
	 * @extends external:GuildMember
	 */
	class KlasaRole extends Role {

		/**
		 * @typedef {external:GuildMemberJSON} KlasaMemberJSON
		 * @property {external:SettingsJSON} settings The per member settings
		 */

		/**
		 * @param {...*} args Normal D.JS GuildMember args
		 */
		constructor(...args) {
			super(...args);

			/**
			 * The member level settings for this context (member || default)
			 * @since 0.0.1
			 * @type {external:Settings}
			 */
			this.selfrole = this.client.gateways.selfroles.create([this.guild.id, this.id]);
		}

		/**
		 * Returns the JSON-compatible object of this instance.
		 * @since 0.5.0
		 * @returns {KlasaMemberJSON}
		 */
		toJSON() {
			return { ...super.toJSON(), settings: this.settings };
		}

	}

	return KlasaRole;
});