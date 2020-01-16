const { Structures } = require('discord.js');

Structures.extend('User', User => class MyUser extends User {

  constructor(...args) {
    super(...args);

    // Guild based member settings
    this.guildSettings = (guildID) => {
      return this.client.gateways.members.create(`${guildID}.${this.id}`);
    };

    this.HP = (guildID) => {
      var settings = this.client.gateways.members.create(`${guildID}.${this.id}`);
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



