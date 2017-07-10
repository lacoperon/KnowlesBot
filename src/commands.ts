import * as redis from 'redis';
import * as _ from 'lodash';
var client = redis.createClient(process.env.REDISCLOUD_URL);
import {Sender, Recipient, Event, Message, QuickReply, Referral, Postback}
        from './messenger_types';
import {sendTextMessage, callSendAPI, sendHelpMessage, sendYoutubeMessage,
        sendPictureMessage, sendLinkWithSplash, toState, toRights, setState,
        setRights}
        from './messenger';

const APP_SECRET        = (process.env.APP_SECRET),
      VALIDATION_TOKEN  = (process.env.MESSENGER_VALIDATION_TOKEN),
      PAGE_ACCESS_TOKEN = (process.env.FB_PAGE_ACCESS_TOKEN),
      SERVER_URL        = (process.env.SERVER_URL);


var sender : Sender ;


interface Command {
  alts? : string[];
  description : string;
  is_secret : boolean; // only accessible to admin
  do(messageText : string, sender : Sender) : void;
}

interface CommandList {
  bot_name : string;
  description : string;
  commands : {[name : string] : Command};
}

export var CommandList : CommandList = {
  bot_name : "KnowlesBot",
  description : "a bot for 102 Knowles Avenue",
  /* This 'commands' property contains a list of all possible commands within
     the chat bot. Simply add a command to the 'commands' property object,
     conforming to the Command interface above, and the bot will automatically
     have access to that command's functionality, assuming said functionality
     satisfies Facebook's API Documentation.

     I thought this was a better / more modular approach than just tacking on
     strings into an ever-lengthening switch statement.

     -@lacoperon */
  commands :
    { "babadook" : {
        description: "promotes to DJ (#BILAND)",
        is_secret: true,
        do: function(messageText : string, sender : Sender) {
          sendTextMessage(sender.id, "You now have Music/Video Privileges!");
          setRights(sender, "dj");
        }
      },
      "darmok" : {
        description: "promotes to admin (good episode!)",
        is_secret : true,
        do : function(messageText : string, sender : Sender) {
          sendTextMessage(sender.id, "You now have Admin Privileges!");
          setRights(sender, "admin");
        }
      },
      "forget" : {
        description: "makes the bot 'forget' you",
        is_secret : false,
        do : function(messageText : string, sender : Sender) {
          sendTextMessage(sender.id, "Consider yourself forgotten!");
          setState(sender, "new");
        }
      },
      "github": {
        description: "sends link to GitHub repo",
        is_secret : false,
        do : function(messageText : string, sender : Sender) {

          var info = {
            title: "KnowlesBot on GitHub",
            link_url: "https://github.com/lacoperon/KnowlesBot",
            subtitle: "Check it out!",
            image_url : "https://camo.githubusercontent.com/a51e8d412f84a4aa7b4ba9ac6d6731548ddd1caa/68747470733a2f2f63646e2e706978616261792e636f6d2f70686f746f2f323031372f30362f31352f31382f32332f706c756d6265722d323430363235345f3936305f3732302e706e67"
          };

          sendLinkWithSplash(sender, info , "open");
        }
      },
      "help" : {
        description: "sends help message",
        is_secret : false,
        do : function(messageText : string, sender : Sender) {

          var listOfCommands = _.map(Object.keys(CommandList.commands), function(command) {
            if (CommandList.commands[command].is_secret == false) {
              return command;
            }
          } ).sort();

          listOfCommands = _.without(listOfCommands, undefined);
          listOfCommands = _.without(listOfCommands, "");
          console.log(listOfCommands.toString());



          var helpDocs : string = `Command List:\n\n`;
          for (var commandIndex in listOfCommands) {
            var command = listOfCommands[commandIndex];
            console.log(command);

            if(CommandList.commands[command] && CommandList.commands[command].description) {
              console.log("Description");
              console.log(`Adding ${CommandList.commands[command].description} to helpDocs`);
              helpDocs += `${command}: ${CommandList.commands[command].description}\n`;
              if(helpDocs.length > 500) {
                sendTextMessage(sender.id, helpDocs);
                helpDocs = '';
              }
            }
          }
          //
          sendTextMessage(sender.id, helpDocs);
          // sendTextMessage(sender.id, listOfCommands.toString());
          sendHelpMessage(sender);
        }
      },
      "hey" : {
        description: "sends you greetings (for fuzzy feels)",
        is_secret : false,
        alts: ['hi','hello','howdy','heyy','heyyy','sup'],
        do : function(messageText : string, sender: Sender) {
          client.get(toState(sender), function(err, reply) {
            if (!err) {
              if (reply != null) {
                console.log(`User with id ${sender.id} has state ${reply}`);
                if (reply == "default") {
                  sendTextMessage(sender.id, "Welcome back, friend! Remember you can type 'help' to see an updated list of commands");
                } else if (reply == "new") {
                  sendTextMessage(sender.id, "Welcome, newcomer! Type 'help' to see a list of commands");
                  setState(sender, "default");
                }
              } else {
                console.log(`User with id ${sender.id} appears to be new`);
                sendTextMessage(sender.id, "Welcome, newcomer! Type 'help' to see a list of commands.'");
                setState(sender, "default");
              }
            }
          });
        }
      },
      "kitty" : {
        description: "sends kitty meme",
        is_secret : false,
        alts: ['kitty','kitties','cat','cats', 'show me the cat','show me the cats','show me the kitty', 'show me the kitties'],
        do : function(messageText : string, sender : Sender) {
          sendPictureMessage(sender, 'http://thecatapi.com/api/images/get?format=src&type=gif');
        }
      },
      "play" : {
        description: "Plays music on Spotify (not currently implemented)",
        is_secret : false,
        do : function(messageText : string, sender : Sender) {
          client.get(toRights(sender), function(err, reply) {
            if (!err) {
              if (reply != null) {
                switch (reply.trim().toLowerCase()) {
                  case "dj":
                  case "admin":
                    {
                      sendTextMessage(sender.id, "Sorry DJ, Music isn't yet implemented");
                    }
                    break;
                  case "user":
                  default:
                    {
                      sendTextMessage(sender.id, "Sorry, you don't have music privileges");
                    }
                    break;
                }
              } else {
                setRights(sender, "user");
              }
            }
          });
        }
      },
      "pleb" : {
        description: "demotes user to pleb",
        is_secret : true,
        do : function(messageText : string, sender : Sender) {
          sendTextMessage(sender.id, "You have been demoted to pleb status");
          setRights(sender, "user");
        }
      },
      "wesley" : {
        description : "sends WC meme",
        is_secret : false,
        alts: ['wc'],
        do : function(messageText : string, sender : Sender) {
          sendYoutubeMessage(sender, {
            title: "Wesley Crusher gets Destroyed",
            image_url: "https://s-media-cache-ak0.pinimg.com/736x/2f/d1/6f/2fd16f6aa3e5721215d335dff48fdf34--wesley-crusher-star-wars.jpg",
            subtitle: "Truly a christmas miracle",
            link_url : "https://youtu.be/sZt6eU5REN8"
          });
        }
      },
      "whoami" : {
        description: "returns user params",
        is_secret : false,
        do : function(messageText : string, sender : Sender) {
          client.get(toState(sender), function(err, reply) {
            if (!err) {
              var state = "";
              if (reply) {
                state = reply.trim();
              } else {
                state = "default";
              }

              client.get(toRights(sender), function(err, reply) {
                if (!err) {
                  var position = "";
                  if (reply) {
                    position = reply.trim();
                  } else {
                    position = "default";
                  }
                  sendTextMessage(sender.id, `You have Role: ${position}, State: ${state}, Sender ID ${sender.id}`);
                }
              });
            }
          });
      }}
    }
}
