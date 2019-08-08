# Contact Service
Sample application to demonstrate building a small application using [AWS CDK](https://docs.aws.amazon.com/cdk/api/latest/). The application uses Dynamo DB, Lambda, and API Gateway.

* DynamoDB - A single table that saves all contact requests.
* Lambda
  * Create (src/create.ts) function serves as a Restful API and creates the contact record.
  * Slack (src/slack.ts) function is triggered via DynamoDB event stream and posts a message to Slack channel of your choice using a webhook.
* API Gateway serves as the entry point to create Lambda function.

## Requirements
* Node/NPM
* AWS CDK - `npm install -g aws-cdk`
* Typescript - `npm install -g typescript`

## Deploying
* `npm install`
* `cdk bootstrap` - This is only needed the first time and includes resources that are needed for the toolkit’s operation.
* Update the properties in `environments/enviroment.ts` to values for your environment.
* `npm run deploy`

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run deploy`  builds and deploys stack
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
