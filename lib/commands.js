"use strict";
exports.__esModule = true;
var redis = require("redis");
var client = redis.createClient(process.env.REDISCLOUD_URL);
var messenger_1 = require("./messenger");
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
    commands: {
        "wesley": {
            description: "sends Wesley Crusher meme",
            is_secret: false,
            "do": function (messageText, sender) {
                messenger_1.sendYoutubeMessage(sender, {
                    title: "Wesley Crusher gets Destroyed",
                    image_url: "https://s-media-cache-ak0.pinimg.com/736x/2f/d1/6f/2fd16f6aa3e5721215d335dff48fdf34--wesley-crusher-star-wars.jpg",
                    subtitle: "Truly a christmas miracle",
                    youtube_url: "https://youtu.be/sZt6eU5REN8"
                });
                var messageData = {
                    "recipient": {
                        "id": sender.id
                    },
                    "message": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "generic",
                                "elements": [
                                    {
                                        "title": "Wesley Crusher gets Destroyed",
                                        "image_url": "https://s-media-cache-ak0.pinimg.com/736x/2f/d1/6f/2fd16f6aa3e5721215d335dff48fdf34--wesley-crusher-star-wars.jpg",
                                        "subtitle": "Truly a Christmas Miracle",
                                        "default_action": {
                                            "type": "web_url",
                                            "url": "https://youtu.be/sZt6eU5REN8",
                                            "messenger_extensions": true,
                                            "webview_height_ratio": "tall",
                                            "fallback_url": "https://youtu.be/sZt6eU5REN8"
                                        },
                                        "buttons": [
                                            {
                                                "type": "web_url",
                                                "url": "https://youtu.be/sZt6eU5REN8",
                                                "title": "Watch"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                };
                messenger_1.callSendAPI(messageData);
            }
        },
        "help": {
            description: "sends help message",
            is_secret: false,
            "do": function (messageText, sender) {
                messenger_1.sendHelpMessage(sender);
            }
        }
    }
};
