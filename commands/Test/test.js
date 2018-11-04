const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: [],
            permissionLevel: 10,
            usage: ''
        });
    }

    async run(message, []) {
        //var stuff = await message.author.settings.reset(`${message.guild.id}.xp`);
        var data = JSON.parse(`{  
   "115385224119975941":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "507549981691871242",
         "478434146096775168"
      ],
      "spamscore":0,
      "xp":1,
      "yang":1
   },
   "172003405399719936":{  
      "badRep":0,
      "goodRep":12,
      "modLogs":[  
         {  
            "case":"jlq1qgmsb",
            "channel":null,
            "date":"2018-09-06T00:03:01.684-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":"jlq1qgm7b",
               "xp":0,
               "yang":0
            },
            "expiration":"2018-09-06T00:33:01.683-04:00",
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/478062812623798282/b9dda325050a9902f9b6ff26440564c2.webp",
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "reason":"Triggered the antispam system and ignored the warnings by the bot.",
            "type":"mute",
            "user":{  
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "valid":false
         },
         {  
            "case":"jlq1qgn0b",
            "channel":null,
            "date":"2018-09-06T00:03:01.693-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":"jlq1qgmbb",
               "xp":0,
               "yang":0
            },
            "expiration":"2018-09-06T00:33:01.692-04:00",
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/478062812623798282/b9dda325050a9902f9b6ff26440564c2.webp",
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "reason":"Triggered the antispam system and ignored the warnings by the bot.",
            "type":"mute",
            "user":{  
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "valid":false
         },
         {  
            "case":"jlq22jkpb",
            "channel":null,
            "date":"2018-09-06T00:12:25.369-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":"jlq22jjxb",
               "xp":0,
               "yang":0
            },
            "expiration":"2018-09-06T00:42:25.368-04:00",
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/478062812623798282/b9dda325050a9902f9b6ff26440564c2.webp",
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "reason":"Triggered the antispam system and ignored the warnings by the bot.",
            "type":"mute",
            "user":{  
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "valid":false
         },
         {  
            "case":"jlq23x2wb",
            "channel":null,
            "date":"2018-09-06T00:13:29.528-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":"jlq23x27b",
               "xp":0,
               "yang":0
            },
            "expiration":"2018-09-06T00:43:29.528-04:00",
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/478062812623798282/b9dda325050a9902f9b6ff26440564c2.webp",
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "reason":"Triggered the antispam system and ignored the warnings by the bot.",
            "type":"mute",
            "user":{  
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "valid":false
         }
      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080",
         "490538209374371861",
         "477199784466448394",
         "505366523280621578",
         "490539061363081226",
         "477200481068777479",
         "505504350676975631",
         "490540153182355466",
         "490539343157657604",
         "487865099613241358",
         "487863539273302016",
         "477041102432501771"
      ],
      "spamscore":22,
      "xp":2369,
      "yang":2777
   },
   "181096104174026752":{  
      "badRep":0,
      "goodRep":14,
      "modLogs":[  
         {  
            "case":"jlwd7n55b",
            "channel":null,
            "date":"2018-09-10T10:10:56.105-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":null,
               "xp":0,
               "yang":0
            },
            "expiration":null,
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "otherDiscipline":null,
            "reason":"Discussing very personal / sexual topics with Midnight in DMs without first asking if it is okay to discuss said topics. We advise blocking Midnight, as further incidents will result in further discipline.",
            "type":"warn",
            "user":{  
               "id":"181096104174026752",
               "tag":"Silverwing#5419"
            },
            "valid":true
         }
      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "490594841823150090",
         "477199547844526080",
         "487864989651042305",
         "477199784466448394",
         "477200481068777479",
         "487864470975021075"
      ],
      "spamscore":0,
      "xp":1269,
      "yang":1141
   },
   "197412709678055424":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080",
         "477199784466448394"
      ],
      "spamscore":0,
      "xp":244,
      "yang":244
   },
   "212681528730189824":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "490536938806181949",
         "478434146096775168"
      ],
      "spamscore":0,
      "xp":1,
      "yang":1
   },
   "212996491105665026":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080"
      ],
      "spamscore":0,
      "xp":4,
      "yang":4
   },
   "229234392634097664":{  
      "badRep":0,
      "goodRep":4,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "487864317123756033",
         "477199547844526080",
         "490538209374371861",
         "490593342061543434",
         "487864989651042305",
         "477199784466448394",
         "490595724170362880",
         "490539061363081226",
         "490540153182355466",
         "490539343157657604"
      ],
      "spamscore":0,
      "xp":175,
      "yang":273
   },
   "231967762635816960":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "487864317123756033",
         "477199547844526080",
         "487864989651042305",
         "477199784466448394",
         "489368348178776065"
      ],
      "spamscore":0,
      "xp":221,
      "yang":221
   },
   "235088799074484224":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  
         {  
            "case":"jm4enbnkb",
            "channel":null,
            "date":"2018-09-16T01:13:16.736-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":"jm4enbm8b",
               "xp":0,
               "yang":0
            },
            "expiration":"2018-09-16T01:43:16.728-04:00",
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/478062812623798282/adc8bd8215f3af4bfcfa5a91b427de1e.webp",
               "id":"478062812623798282",
               "tag":"Deboter#8987"
            },
            "otherDiscipline":null,
            "reason":"Triggered the antispam system and ignored the warnings by the bot.",
            "type":"mute",
            "user":{  
               "id":"235088799074484224",
               "tag":"Rythm#3722"
            },
            "valid":false
         }
      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "478434146096775168"
      ],
      "spamscore":0,
      "xp":204,
      "yang":204
   },
   "237360479624757249":{  
      "badRep":0,
      "goodRep":5,
      "modLogs":[  
         {  
            "case":"jls3aseub",
            "channel":null,
            "date":"2018-09-07T10:22:22.040-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":"jls3ase2b",
               "xp":0,
               "yang":0
            },
            "expiration":"2018-09-07T10:52:22.030-04:00",
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/478062812623798282/b9dda325050a9902f9b6ff26440564c2.webp",
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "reason":"Triggered the antispam system and ignored the warnings by the bot.",
            "type":"mute",
            "user":{  
               "id":"237360479624757249",
               "tag":"MoonlitJolty [Nicole]#1692"
            },
            "valid":false
         }
      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080",
         "477199784466448394",
         "477200481068777479"
      ],
      "spamscore":0,
      "xp":1952,
      "yang":3535
   },
   "241000177345757185":{  
      "badRep":0,
      "goodRep":3,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080"
      ],
      "spamscore":0,
      "xp":79,
      "yang":79
   },
   "249052243934969868":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080",
         "477199784466448394"
      ],
      "spamscore":0,
      "xp":131,
      "yang":131
   },
   "302050872383242240":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "493131700688388107",
         "478434146096775168"
      ],
      "spamscore":0,
      "xp":3,
      "yang":3
   },
   "306485112453726208":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080"
      ],
      "spamscore":0,
      "xp":10,
      "yang":10
   },
   "327380217280593930":{  
      "badRep":0,
      "goodRep":1,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080",
         "487864470975021075"
      ],
      "spamscore":0,
      "xp":112,
      "yang":121
   },
   "360323211247747073":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080",
         "477199784466448394"
      ],
      "spamscore":0,
      "xp":133,
      "yang":133
   },
   "365975655608745985":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "489834316222955523",
         "478434146096775168"
      ],
      "spamscore":0,
      "xp":3,
      "yang":3
   },
   "422087909634736160":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "503047914873159702",
         "478434146096775168"
      ],
      "spamscore":0,
      "xp":1,
      "yang":1
   },
   "442296975065481243":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "487864535521165313",
         "490594841823150090",
         "477199547844526080",
         "490538209374371861",
         "487864989651042305",
         "490540357759664138"
      ],
      "spamscore":0,
      "xp":105,
      "yang":105
   },
   "475115126761193475":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080"
      ],
      "spamscore":0,
      "xp":61,
      "yang":61
   },
   "475129833752494100":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  

      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "477199547844526080"
      ],
      "spamscore":0,
      "xp":0,
      "yang":0
   },
   "478062812623798282":{  
      "badRep":0,
      "goodRep":0,
      "modLogs":[  
         {  
            "case":"jlsgjfo3b",
            "channel":null,
            "date":"2018-09-07T16:33:00.436-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":null,
               "xp":0,
               "yang":0
            },
            "expiration":null,
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "reason":"Test warning",
            "type":"warn",
            "user":{  
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "valid":false
         },
         {  
            "case":"jlsgvtwbb",
            "channel":null,
            "date":"2018-09-07T16:42:38.749-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":null,
               "xp":0,
               "yang":0
            },
            "expiration":null,
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "reason":"test",
            "type":"warn",
            "user":{  
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "valid":false
         },
         {  
            "case":"jlsh3kidb",
            "channel":null,
            "date":"2018-09-07T16:48:39.829-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":null,
               "xp":0,
               "yang":0
            },
            "expiration":null,
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "reason":"test",
            "type":"discipline",
            "user":{  
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "valid":false
         },
         {  
            "case":"jlsyxx2vb",
            "channel":null,
            "date":"2018-09-08T01:08:09.271-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":null,
               "xp":0,
               "yang":0
            },
            "expiration":null,
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "otherDiscipline":"Apologize",
            "reason":"Test",
            "type":"discipline",
            "user":{  
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "valid":false
         },
         {  
            "case":"jlyjl17rb",
            "channel":null,
            "date":"2018-09-11T22:44:50.920-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":null,
               "xp":0,
               "yang":0
            },
            "expiration":null,
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "otherDiscipline":null,
            "reason":"Test warning",
            "type":"warn",
            "user":{  
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "valid":false
         },
         {  
            "case":"jlykxom1b",
            "channel":null,
            "date":"2018-09-11T23:22:40.730-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":null,
               "xp":0,
               "yang":0
            },
            "expiration":null,
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "otherDiscipline":null,
            "reason":"test warning 2",
            "type":"warn",
            "user":{  
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "valid":false
         },
         {  
            "case":"jlyl03e8b",
            "channel":null,
            "date":"2018-09-11T23:24:33.200-04:00",
            "discipline":{  
               "reputation":0,
               "schedule":null,
               "xp":0,
               "yang":1
            },
            "expiration":null,
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "otherDiscipline":"Manual discipline",
            "reason":"Test discipline",
            "type":"discipline",
            "user":{  
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "valid":false
         },
         {  
            "case":"jlyl2guhb",
            "channel":null,
            "date":"2018-09-11T23:26:23.945-04:00",
            "discipline":{  
               "reputation":5,
               "schedule":"jlyl2gsrb",
               "xp":0,
               "yang":0
            },
            "expiration":"2018-09-11T23:41:23.944-04:00",
            "moderator":{  
               "avatar":"https://cdn.discordapp.com/avatars/172003405399719936/38626cd029f8acc81d92df44901c3e09.webp",
               "id":"172003405399719936",
               "tag":"Lovinity#8580"
            },
            "otherDiscipline":null,
            "reason":"Bad bot",
            "type":"mute",
            "user":{  
               "id":"478062812623798282",
               "tag":"Om Shanti#8987"
            },
            "valid":false
         }
      ],
      "profile":[  

      ],
      "reports":[  

      ],
      "roles":[  
         "478072662200025088",
         "478434146096775168",
         "477041102432501771"
      ],
      "spamscore":0,
      "xp":0,
      "yang":0
   }
}`);

        for (var userID in data)
        {
            if (data.hasOwnProperty(userID))
            {
                var user = await this.client.users.get(userID);
                for (var setting in data[userID])
                {
                    if (data[userID].hasOwnProperty(setting))
                    {
                        user.guildSettings(message.guild.id).update(setting, data[userID][setting]);
                    }
                }
            }
        }
        
        return message.send('DONE');
    }

};


