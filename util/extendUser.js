const { Structures } = require('discord.js');

Structures.extend('User', User => class MyUser extends User {

    constructor(...args) {
        super(...args);
        
        // Guild based member settings
        this.guildSettings = function(guildID) {
          return this.client.gateways.members.create([guildID, this.id]);  
        };
        
    }

});



