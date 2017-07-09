"use strict";
exports.__esModule = true;
var redis = require("redis");
var client = redis.createClient(process.env.REDISCLOUD_URL);
var messenger_1 = require("./messenger");
var APP_SECRET = (process.env.APP_SECRET), VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN), PAGE_ACCESS_TOKEN = (process.env.FB_PAGE_ACCESS_TOKEN), SERVER_URL = (process.env.SERVER_URL);
var sender;
exports.CommandList = {
    bot_name: "KnowlesBot",
    description: "a bot for 102 Knowles Avenue",
    /* This 'commands' property contains a list of all possible commands within
       the chat bot. Simply add a command to the 'commands' property object,
       conforming to the Command interface above, and the bot will automatically
       have access to that command's functionality, assuming said functionality
       satisfies Facebook's API Documentation.
  
       I thought this was a better / more modular approach than just tacking on
       strings into an ever-lengthening switch statement.
  
       -@lacoperon */
    commands: { "forget": {
            description: "'forgets' user ever messaged the bot",
            is_secret: false,
            "do": function (messageText, sender) {
                messenger_1.sendTextMessage(sender.id, "Consider yourself forgotten!");
                messenger_1.setState(sender, "new");
            }
        },
        "help": {
            description: "sends help message",
            is_secret: false,
            "do": function (messageText, sender) {
                messenger_1.sendHelpMessage(sender);
            }
        },
        "wesley": {
            description: "sends Wesley Crusher meme",
            is_secret: false,
            alts: ['wc'],
            "do": function (messageText, sender) {
                messenger_1.sendYoutubeMessage(sender, {
                    title: "Wesley Crusher gets Destroyed",
                    image_url: "https://s-media-cache-ak0.pinimg.com/736x/2f/d1/6f/2fd16f6aa3e5721215d335dff48fdf34--wesley-crusher-star-wars.jpg",
                    subtitle: "Truly a christmas miracle",
                    youtube_url: "https://youtu.be/sZt6eU5REN8"
                });
            }
        },
        "whoami": {
            description: "sends user their State, FB UserID and Role",
            is_secret: false,
            "do": function (messageText, sender) {
                client.get(messenger_1.toState(sender), function (err, reply) {
                    if (!err) {
                        var state = "";
                        if (reply) {
                            state = reply.trim();
                        }
                        else {
                            state = "default";
                        }
                        messenger_1.sendTextMessage(sender.id, "You have State: " + state);
                    }
                });
                client.get(messenger_1.toRights(sender), function (err, reply) {
                    if (!err) {
                        var position = "";
                        if (reply) {
                            position = reply.trim();
                        }
                        else {
                            position = "default";
                        }
                        messenger_1.sendTextMessage(sender.id, "You have Role: " + position);
                    }
                });
                messenger_1.sendTextMessage(sender.id, "You have Sender ID: " + sender.id);
            }
        }
    }
};
