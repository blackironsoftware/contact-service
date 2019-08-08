import https = require('https');
import url = require('url');
import { DynamoDBStreamEvent } from 'aws-lambda';

const slackURL = url.parse(process.env.SLACK_URL || '');

export const handler = async (event: DynamoDBStreamEvent): Promise<any> => {
    for (const record of event.Records) {
        const contact =  record.dynamodb && record.dynamodb.NewImage ? record.dynamodb.NewImage : {};
        const name = contact['name'] && contact['name'].S ? contact['name'].S : '';
        const email = contact['email'] && contact['email'].S ? contact['email'].S : '';
        const subject = contact['subject'] && contact['subject'].S ? contact['subject'].S : '';
        const message = contact['message'] && contact['message'].S ? contact['message'].S : '';
        
        try {
            await sendMessage(name, email, subject, message);
            return;
        } catch(error) {
            console.log(error);
            return;
        }
    }
}

function sendMessage(name: string, email: string, subject: string, message: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const slackMessage = { "type": "mrkdwn", "text": `*You have a new contact:* ${name}\n*email:* ${email}\n*subject:* ${subject}\n*message:* ${message}` };
        const data = JSON.stringify(slackMessage);

        const options = {
                    hostname: slackURL.host,
                    port: 443,
                    path: slackURL.path,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk.toString()));
            res.on('error', reject);
            res.on('end', () => {
                if (res && res.statusCode && res.statusCode >= 200 && res.statusCode <= 299) {
                    resolve({statusCode: res.statusCode, headers: res.headers, body: body});
                } else {
                    reject('Request failed. status: ' + res.statusCode + ', body: ' + body);
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
