const { Structures, GuildMember } = require('discord.js');

Structures.extend('User', User => class MyUser extends User {

  constructor(...args) {
    super(...args);

    // Guild based member settings
    this.guildSettings = (guildID) => {
      var guild = this.client.guilds.resolve(guildID);
      if (!guild) return null;

      var guildmember = new GuildMember(this.client, {
        user: this
      }, guild);

      return guildmember.settings;
    };

    this.HP = (guildID) => {
      var guild = this.client.guilds.resolve(guildID);
      if (!guild) return 100;

      var guildmember = new GuildMember(this.client, {
        user: this
      }, guild);

      var settings = guildmember.settings;

      var damage = settings.HPDamage;
      var decay = guild.settings.oneHPPerXP;
      var HP = (100 + Math.floor(decay > 0 ? settings.xp / decay : 0)) - damage;
      if (HP < 0) HP = 0;
      return HP;
    };

  }

});



