"use strict";
exports.__esModule = true;
var redis = require("redis");
var client = redis.createClient(process.env.REDISCLOUD_URL);
var messenger_1 = require("./messenger");
var sender;
exports.CommandList = {
    bot_name: "KnowlesBot",
    description: "A bot for 102 Knowles Avenue",
    commands: {
        "wesley": {
            name: "wesley",
            description: "Sends Wesley Crusher meme",
            is_secret: false,
            messenger_actions: function (messageText, sender) {
                var messageData = {
                    "recipient": {
                        "id": sender.id
                    }, "message": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "list",
                                "elements": [
                                    {
                                        "title": "Wesley Crusher gets Destroyed in Christmas Song",
                                        "image_url": "https://s-media-cache-ak0.pinimg.com/736x/2f/d1/6f/2fd16f6aa3e5721215d335dff48fdf34--wesley-crusher-star-wars.jpg",
                                        "subtitle": "Click for Accompanying Jingle",
                                        "default_action": {
                                            "type": "web_url",
                                            "url": "https://youtu.be/sZt6eU5REN8",
                                            "messenger_extensions": true,
                                            "webview_height_ratio": "tall",
                                            "fallback_url": "https://youtu.be/sZt6eU5REN8"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                };
                messenger_1.callSendAPI(messageData);
            }
        }
    }
};
