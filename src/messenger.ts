// This file contains all of the functions necessary to interact with the Facebook Messenger API. - @lacoperon

import * as crypto from 'crypto';
import * as request from 'request';

import {Sender, Recipient, Event, Message, QuickReply, Referral, Postback} from './messenger_types';

const APP_SECRET = (process.env.APP_SECRET),
      VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN),
      PAGE_ACCESS_TOKEN = (process.env.FB_PAGE_ACCESS_TOKEN),
      SERVER_URL = (process.env.SERVER_URL);

/*
 *The verifyRequestSignature function is used to verify that the data recieved
 *to our server really comes from Facebook, using the crypto module.
 */

export function verifyRequestSignature(req : any, res : any, buf : any) : void {
    var signature = req.headers["x-hub-signature"];

    if(!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
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


export function receivedMessage(event : Event) {
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
    var quickReply : QuickReply = message.quick_reply;
    if (isEcho) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
        return;
    }
    else if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        sendTextMessage(senderID, "Quick reply tapped");
        return;
    }
    if (messageText) {
        // sendTextMessage(senderID, "Note: This bot is under construction");
        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        sendTextMessage(senderID, messageText);
    }
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
export function receivedPostback(event : Event) {
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

 /*
 * Send a text message using the Send API.
 *
 */
export function sendTextMessage(recipientId : string, messageText : string) {
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

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId : string) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "This is test text",
                    buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/rift/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Trigger Postback",
                            payload: "DEVELOPER_DEFINED_PAYLOAD"
                        }, {
                            type: "phone_number",
                            title: "Call Phone Number",
                            payload: "+16505551234"
                        }]
                }
            }
        }
    };
    callSendAPI(messageData);
}
/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId : string) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                            title: "rift",
                            subtitle: "Next-generation virtual reality",
                            item_url: "https://www.oculus.com/en-us/rift/",
                            image_url: SERVER_URL + "/assets/rift.png",
                            buttons: [{
                                    type: "web_url",
                                    url: "https://www.oculus.com/en-us/rift/",
                                    title: "Open Web URL"
                                }, {
                                    type: "postback",
                                    title: "Call Postback",
                                    payload: "Payload for first bubble"
                                }]
                        }, {
                            title: "touch",
                            subtitle: "Your Hands, Now in VR",
                            item_url: "https://www.oculus.com/en-us/touch/",
                            image_url: SERVER_URL + "/assets/touch.png",
                            buttons: [{
                                    type: "web_url",
                                    url: "https://www.oculus.com/en-us/touch/",
                                    title: "Open Web URL"
                                }, {
                                    type: "postback",
                                    title: "Call Postback",
                                    payload: "Payload for second bubble"
                                }]
                        }]
                }
            }
        }
    };
    callSendAPI(messageData);
}

 /*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
export function callSendAPI(messageData : any) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData
    }, function (error : any, response : any, body : any) {
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
