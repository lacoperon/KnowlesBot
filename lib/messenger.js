// This file contains all of the functions necessary to interact with the Facebook Messenger API. - @lacoperon
"use strict";
exports.__esModule = true;
var crypto = require("crypto");
var request = require("request");
var redis = require("redis");
var client = redis.createClient(process.env.REDISCLOUD_URL);
var APP_SECRET = (process.env.APP_SECRET), VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN), PAGE_ACCESS_TOKEN = (process.env.FB_PAGE_ACCESS_TOKEN), SERVER_URL = (process.env.SERVER_URL);
/*
 *The verifyRequestSignature function is used to verify that the data recieved
 *to our server really comes from Facebook, using the crypto module.
 */
function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];
    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    }
    else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];
        var expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');
        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}
exports.verifyRequestSignature = verifyRequestSignature;
function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    // console.log("Received message for user %d and page %d at %d with message:",
    //   senderID, recipientID, timeOfMessage);
    // console.log(JSON.stringify(message));
    var isEcho = message.is_echo;
    var messageId = message.mid;
    var appId = message.app_id;
    var metadata = message.metadata;
    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    var quickReply = message.quick_reply;
    if (messageText) {
        switch (messageText.trim().toLowerCase()) {
            case "help":
                {
                    sendHelpMessage(senderID);
                }
                break;
            case "forget":
                {
                    sendTextMessage(senderID, "Consider yourself forgotten!");
                    setState(event.sender, "new");
                }
                break;
            case "babadook":
                {
                    sendTextMessage(senderID, "You now have Music/Video Privileges!");
                    setRights(event.sender, "dj");
                }
                break;
            case "darmok":
                {
                    sendTextMessage(senderID, "You now have Admin Privileges!");
                    setRights(event.sender, "admin");
                }
                break;
            case "play":
                {
                    client.get(toRights(event.sender), function (err, reply) {
                        if (!err) {
                            if (reply != null) {
                                switch (reply.trim().toLowerCase()) {
                                    case "dj":
                                    case "admin":
                                        {
                                            sendTextMessage(senderID, "Sorry DJ, Music isn't yet implemented");
                                        }
                                        break;
                                    case "user":
                                    default:
                                        {
                                            sendTextMessage(senderID, "Sorry, you don't have music privileges");
                                        }
                                        break;
                                }
                            }
                            else {
                                setRights(event.sender, "user");
                            }
                        }
                    });
                }
                break;
            case "hey":
                {
                    client.get(toState(event.sender), function (err, reply) {
                        if (!err) {
                            if (reply != null) {
                                console.log("User with id " + senderID + " has state " + reply);
                                if (reply == "default") {
                                    sendTextMessage(senderID, "Welcome back, friend!");
                                }
                                else if (reply == "new") {
                                    sendTextMessage(senderID, "Welcome, newcomer!");
                                    setState(event.sender, "default");
                                }
                            }
                        }
                        else {
                            console.log("User with id " + senderID + " appears to be new");
                            sendTextMessage(senderID, "Welcome, newcomer!");
                            setState(event.sender, "default");
                        }
                    });
                }
                break;
            default:
                {
                    sendTextMessage(senderID, "Sorry, I didn't understand what you were saying");
                }
        }
    }
}
exports.receivedMessage = receivedMessage;
function setState(sender, state) {
    client.set(toState(sender), state, function () {
        console.log("Set the state of user " + sender.id + "to be " + state);
    });
}
function setRights(sender, position) {
    client.set(toRights(sender), position, function () {
        console.log("Set the rights of user " + sender.id + "to be " + position);
    });
}
/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;
    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;
    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);
    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
    sendTextMessage(senderID, "Postback called");
}
exports.receivedPostback = receivedPostback;
/*
* Send a text message using the Send API.
*
*/
function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };
    callSendAPI(messageData);
}
exports.sendTextMessage = sendTextMessage;
/*
 * Send a Structured Message using the Send API.
 *
 */
function sendHelpMessage(recipientId) {
    var messageTextUser = "The currently supported commands are:\n\n   forget : makes the bot think you're a new user (for that welcome feeling)\n   help   : returns a list of all supported commands";
    var messageText = "Admin Commands:\n      ";
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": messageTextUser,
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": "forget",
                    "payload": "forget"
                },
                {
                    "content_type": "text",
                    "title": "help",
                    "payload": "help"
                }
            ]
        }
    };
    callSendAPI(messageData);
}
/*
* Call the Send API. The message data goes in the body. If successful, we'll
* get the message id in a response
*
*/
function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            if (messageId) {
                console.log("Successfully sent message with id %s to recipient %s", messageId, recipientId);
            }
            else {
                console.log("Successfully called Send API for recipient %s", recipientId);
            }
        }
        else {
            console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    });
}
exports.callSendAPI = callSendAPI;
function toState(sender) {
    return "STATE_" + sender.id;
}
function toRights(sender) {
    return "RIGHTS_" + sender.id;
}
