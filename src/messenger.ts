// This file contains all of the functions necessary to interact with the Facebook Messenger API. - @lacoperon

import * as crypto from 'crypto';
import * as request from 'request';
import * as redis from 'redis';
var client = redis.createClient(process.env.REDISCLOUD_URL);
import {CommandList} from './commands';
var commands = CommandList.commands;

import {Sender, Recipient, Event, Message, QuickReply, Referral, Postback,
        Splash} from './messenger_types';

const APP_SECRET        = (process.env.APP_SECRET),
      VALIDATION_TOKEN  = (process.env.MESSENGER_VALIDATION_TOKEN),
      PAGE_ACCESS_TOKEN = (process.env.FB_PAGE_ACCESS_TOKEN),
      SERVER_URL        = (process.env.SERVER_URL);

/*
 *The verifyRequestSignature function is used to verify that the data recieved
 *to our server really comes from Facebook, using the crypto module.
 */


// Function that converts a Sender object to its corresponding State string (for Redis)
export function toState(sender: Sender): string {
  return `STATE_${sender.id}`;
}

// Function that converts a Sender object to its corresponding Rights string (for Redis)
export function toRights(sender: Sender): string {
  return `RIGHTS_${sender.id}`;
}

/*
* Call the Send API. The message data goes in the body. If successful, we'll
* get the message id in a response
*
*/
export function callSendAPI(messageData: any) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData
  }, function(error: any, response: any, body: any) {
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

export function verifyRequestSignature(req: any, res: any, buf: any): void {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
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

export function parseMessage(messageText: string, sender: Sender): void {
  // //Splits messages on ;, allowing for multiple commands at once
  // if(messageText.indexOf(";") !== -1) {
  //   var messageArray = messageText.split(";");
  //   for (var message in messageArray) {
  //     parseMessage(message, sender);
  //   }
  //   return;
  // }

  if (messageText && messageText != "") {
    messageText = messageText.trim().toLowerCase();
    /*Checks to see if the message itself is an idiomatic expression out of
      The CommandLine. If it is, then it is executed. */
    if(commands.hasOwnProperty(messageText)) {
      commands[messageText].do(messageText, sender);
      return;
    }
    /*Checks to see if the command entered is an valid 'alternative' way of
      entering the normal command name
      (IE contained within command.commands.<NORMAL_NAME>.alts ),
      and if so, executes it */
    else {
      console.log('touch');
      for (var command in commands) {
        console.log(`touch1 for ${command}`);
        if(command && command != "")  {
          console.log(`touch2 for ${command} (parsed as not empty and not undef)`);
          if(commands[command].hasOwnProperty('alts')) {
            console.log(`touch3 for ${command} has alts`);
            console.log(`Alts contains ${JSON.stringify(commands[command].alts)}`);
            for( var i in commands[command].alts)  {
              console.log(`touch3.5 for alt at index ${i}`);
              if(commands[command].alts[i] == messageText.trim().toLowerCase()) {
                console.log(`touch4 for ${command} has alt at index ${i} which is ${messageText}`);
                commands[command].do(messageText, sender);
                return;
              }
            }
          }
        }
      }
    }
    sendTextMessage(sender.id, "Sorry, I didn't understand what you were saying. Type 'help' to see a list of commands");
    return;
  }
}

export function receivedMessage(event: Event): void {
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  // console.log("Received message for user %d and page %d at %d with message:",
  //   sender.id, recipientID, timeOfMessage);
  // console.log(JSON.stringify(message));
  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;
  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply: QuickReply = message.quick_reply;

  parseMessage(message.text, event.sender);
}

export function setState(sender: Sender, state: string): void {
  client.set(toState(sender), state, function() {
    console.log("Set the state of user " + sender.id + "to be " + state);
  });
}

export function setRights(sender: Sender, position: string): void {
  client.set(toRights(sender), position, function() {
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
export function receivedPostback(event: Event): void {
  var sender = event.sender;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;
  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;
  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", sender.id, recipientID, payload, timeOfPostback);
  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(sender.id, "Postback called");
}

/*
* Send a text message using the Send API.
*
*/
export function sendTextMessage(recipientId: string, messageText: string): void {
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


export function sendPictureMessage(sender: Sender, url: string) {
  var messageData = {
    recipient: {
      id: sender.id
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: url
        }
      }
    }
  };

  callSendAPI(messageData);
}


export function sendLinkWithSplash(sender: Sender, info : Splash, verbiage : string) {

  var subtitle = info.subtitle || "",
      title = info.title || "",
      fallback_url = info.fallback_url || "";

  var messageData =
  {
  "recipient":{
      "id": sender.id
    },
    "message":{
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements":[
             {
              "title": title,
              "image_url": info.image_url,
              "subtitle": subtitle,
              "default_action": {
                "type": "web_url",
                "url": info.link_url,
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": info.fallback_url
              },
              "buttons":[
                {
                  "type":"web_url",
                  "url":info.link_url,
                  "title": verbiage
                }
              ]
            }
          ]
        }
      }
    }
  }
  callSendAPI(messageData);
}


export function sendYoutubeMessage(sender: Sender, info : Splash) {
  sendLinkWithSplash(sender, info, "Watch");
}
