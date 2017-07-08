// This file contains all of the functions necessary to interact with the Facebook Messenger API. - @lacoperon

import * as crypto from 'crypto';
import * as request from 'request';
import * as redis from 'redis';
var client = redis.createClient(process.env.REDISCLOUD_URL);

import {Sender, Recipient, Event, Message, QuickReply, Referral, Postback} from './messenger_types';

const APP_SECRET = (process.env.APP_SECRET),
  VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN),
  PAGE_ACCESS_TOKEN = (process.env.FB_PAGE_ACCESS_TOKEN),
  SERVER_URL = (process.env.SERVER_URL);

/*
 *The verifyRequestSignature function is used to verify that the data recieved
 *to our server really comes from Facebook, using the crypto module.
 */


 // Function that converts a Sender object to its corresponding State string (for Redis)
 function toState(sender: Sender) : string {
   return `STATE_${sender.id}`;
 }

 // Function that converts a Sender object to its corresponding Rights string (for Redis)
 function toRights(sender: Sender) : string {
   return `RIGHTS_${sender.id}`;
 }

 /*
  * Send a Structured Message using the Send API.
  *
  */
 function sendHelpMessage(sender : Sender) : void {
   var messageTextUser =
     `Common Commands Include:

    hey   : Sends you a hello message (for the warm fuzzy feels)
    play  : Plays the specified Spotify Playlists (unimplemented)
    whoami: Returns your current state and rights status

    forget : makes the bot think you're a new user (for that welcome feeling)
    help   : returns a list of all supported commands`

   var messageTextAdmin =
     `Admin Commands:

     darmok  : sets oneself as admin (good episode!)
     babadook: sets oneself as DJ (play music/video as you please)
     pleb    : demotes oneself to pleb status (no more admin/DJ access)


     `;

   var messageData = {
     recipient: {
       id: sender.id
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

   client.get(toRights(sender), function(err, reply) {
     if (!err) {
       if(reply) {
         switch(reply.trim().toLowerCase()) {
           case "admin":
             sendTextMessage(sender.id, messageTextAdmin);
             break;
           default:
             break;
         }
       }
       callSendAPI(messageData);
     }
   });
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

export function parseMessage(messageText: string, sender: Sender) : void {
  if (messageText) {
    switch (messageText.trim().toLowerCase()) {
      case "help":
        {
          sendHelpMessage(sender);
        }
        break;
      case "whoami":
        {
          client.get(toState(sender), function(err, reply) {
            if(!err) {
              var state = "";
              if(reply) {
                state = reply.trim();
              } else {
                state = "default";
              }
              sendTextMessage(sender.id, `You have State: ${state}`);
            }
          });

          client.get(toRights(sender), function(err, reply) {
            if(!err) {
              var position = "";
              if(reply) {
                position = reply.trim();
              } else {
                position = "default";
              }
              sendTextMessage(sender.id, `You have Role: ${position}`);
            }
          });
          sendTextMessage(sender.id, `You have Sender ID: ${sender.id}`);
        }
        break;
      case "forget":
        {
          sendTextMessage(sender.id, "Consider yourself forgotten!");
          setState(sender, "new");
        }
        break;
      case "babadook":
        {
          sendTextMessage(sender.id, "You now have Music/Video Privileges!");
          setRights(sender, "dj");
        }
        break;
      case "darmok":
        {
          sendTextMessage(sender.id, "You now have Admin Privileges!");
          setRights(sender, "admin");
        }
        break;
      case "wesley":
        {
          sendVideoMessage(sender, "https://www.youtube.com/watch?v=OAqsU-BY58w");
        }
        break;
      case "pleb":
        {
          sendTextMessage(sender.id, "You have been demoted to pleb status");
          setRights(sender, "user");
        }
        break;
      case "play":
        {
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
        break;
      case "hey":
        {
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
        break;
      default:
        {
          sendTextMessage(sender.id, "Sorry, I didn't understand what you were saying. Type 'help' to see a list of commands");
        }
    }
  }
}

export function receivedMessage(event: Event) : void {
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

function setState(sender: Sender, state: string): void {
  client.set(toState(sender), state, function() {
    console.log("Set the state of user " + sender.id + "to be " + state);
  });
}

function setRights(sender: Sender, position: string): void {
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
export function receivedPostback(event: Event) : void {
  var sender= event.sender;
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
export function sendTextMessage(recipientId: string, messageText: string) : void {
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


function sendVideoMessage(sender : Sender, url : string) {
  var messageData = {
    recipient: {
      id: sender.id
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: url
        }
      }
    }
  };

  callSendAPI(messageData);
}
