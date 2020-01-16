const { GatewayStorage, Settings } = require('klasa');
const { Collection } = require('discord.js');

/**
 * The Gateway class that manages the data input, parsing, and output, of an entire database, while keeping a cache system sync with the changes.
 * @extends GatewayStorage
 */
class MemberGateway extends GatewayStorage {

	/**
	 * @since 0.0.1
	 * @param {GatewayDriver} store The GatewayDriver instance which initiated this instance
	 * @param {string} type The name of this Gateway
	 * @param {external:Schema} schema The schema for this gateway
	 * @param {string} provider The provider's name for this gateway
	 */
	constructor(store, type, schema, provider) {
		super(store.client, type, schema, provider);

		/**
		 * The GatewayDriver that manages this Gateway
		 * @since 0.0.1
		 * @type {external:GatewayDriver}
		 */
		this.store = store;

		/**
		 * The cached entries for this Gateway or the external datastore to get the settings from
		 * @since 0.0.1
		 * @type {external:Collection<string, Settings>|external:DataStore}
		 */
		this.cache = (type in this.client) && this.client[ type ] instanceof Map ? this.client[ type ] : new Collection();

		/**
		 * The synchronization queue for all Settings instances
		 * @since 0.0.1
		 * @type {external:Collection<string, Promise<external:Settings>>}
		 */
		this.syncQueue = new Collection();

		/**
		 * @since 0.0.1
		 * @type {boolean}
		 * @private
		 */
		Object.defineProperty(this, '_synced', { value: false, writable: true });
	}

	/**
	 * The Settings that this class should make.
	 * @since 0.0.1
	 * @type {external:Settings}
	 * @readonly
	 * @private
	 */
	get Settings () {
		return Settings;
	}

	/**
	 * The ID length for all entries.
	 * @since 0.0.1
	 * @type {number}
	 * @readonly
	 * @private
	 */
	get idLength () {
		// 18 + 1 + 18: `{MEMBERID}.{GUILDID}`
		return 37;
	}

	/**
	 * Get a Settings entry from this gateway
	 * @since 0.0.1
	 * @param {string|string[]} id The id for this instance
	 * @returns {?external:Settings}
	 */
	get(id, create = false) {
		const entry = this.cache.get(id);
		if (entry) return entry.settings;
		if (create) {
			const settings = new this.Settings(this, { id });
			if (this._synced && this.schema.size) settings.sync().catch(err => this.client.emit('error', err));
			return settings;
		}
		return null;
	}


	/**
	 * Create a new Settings for this gateway
	 * @since 0.0.1
	 * @param {string|string[]} id The id for this instance
	 * @param {Object<string, *>} [data={}] The data for this Settings instance
	 * @returns {external:Settings}
	 */
	create (id, data = {}) {
		const entry = this.cache.get(id);
		if (entry) return entry.settings;

		const settings = new this.Settings(this, Object.assign({ id }, data));
		if (this._synced && this.schema.size) settings.sync().catch(err => this.client.emit('error', err));
		return settings;
	}

	async sync (input = [ ...this.cache.keys() ]) {
		if (Array.isArray(input)) {
			if (!this._synced) this._synced = true;
			const entries = await this.provider.getAll(this.type, input);
			for (const entry of entries) {
				if (!entry) continue;
				const cache = this.get(entry.id);
				if (cache) {
					if (!cache._existsInDB) cache._existsInDB = true;
					cache._patch(entry);
				}
			}

			// Set all the remaining settings from unknown status in DB to not exists.
			for (const entry of this.cache.values()) {
				if (entry.settings._existsInDB === null) entry.settings._existsInDB = false;
			}
			return this;
		}

		const cache = this.get((input && input.id) || input);
		return cache ? cache.sync() : null;
	}

}

module.exports = MemberGateway;
