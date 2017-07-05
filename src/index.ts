import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as https from 'https';
import * as Messenger from './messenger';
import * as RedisInteraction from './redis_interaction';

const APP_SECRET = (process.env.APP_SECRET),
      VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN),
      PAGE_ACCESS_TOKEN = (process.env.FB_PAGE_ACCESS_TOKEN),
      SERVER_URL = (process.env.SERVER_URL);


var app : any = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: Messenger.verifyRequestSignature }));

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
    console.error("Missing config values");
    process.exit(1);
}
/*
    Verifies webhook via Facebook Messenger Dev Platform's verification script
 */
app.get('/messenger', function (req: any, res : any) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    }
    else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

app.post('/messenger', function (req : any, res : any) {
    var data : any = req.body;
    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function (pageEntry : any) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;
            // Iterate over each messaging event
            pageEntry.messaging.forEach(function (messagingEvent : any) {
                if (messagingEvent.message) {
                    Messenger.receivedMessage(messagingEvent);
                }
                else if (messagingEvent.postback) {
                    Messenger.receivedPostback(messagingEvent);
                }
                else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
                //Sends back that all worked A-OK
                //(Protip: don't forget this part, or you'll be awake all night with
                // annoying barrages of identical messages)
                res.sendStatus(200);
            });
        });
    }
    ;
});
// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
RedisInteraction.setKeyValue("key","value");
module.exports = app;
