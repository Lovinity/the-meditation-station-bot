const { Structures } = require('discord.js');

Structures.extend('User', User => class MyUser extends User {

  constructor(...args) {
    super(...args);

    // Guild based member settings
    this.guildSettings = async (guildID) => {
      return await this.client.gateways.members.get(`${guildID}.${this.id}`, true);
    };

    this.HP = async (guildID) => {
      var settings = await this.client.gateways.members.get(`${guildID}.${this.id}`, true);
      var guild = this.client.guilds.resolve(guildID);
      if (!guild) return 100;

      var damage =settings.HPDamage;
      var decay = guild.settings.oneHPPerXP;
      var HP = (100 + Math.floor(decay > 0 ? settings.xp / decay : 0)) - damage;
      if (HP < 0) HP = 0;
      return HP;
    };

  }

});



