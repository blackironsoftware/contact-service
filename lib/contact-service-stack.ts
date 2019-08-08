import cdk = require('@aws-cdk/core');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import apigateway = require('@aws-cdk/aws-apigateway');
import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { environment } from '../environments/environment';
import certificatemanager = require('@aws-cdk/aws-certificatemanager');
import route53 = require('@aws-cdk/aws-route53');

export class ContactServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const contactTable = new dynamodb.Table(this, 'Table', {
      tableName: environment.tableName,
      partitionKey: { 
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE
    });

    const createContact = new lambda.Function(this, 'createContactFunction', {
      code: new lambda.AssetCode('src'),
      handler: 'create.handler',
      runtime: lambda.Runtime.NODEJS_8_10,
      environment: {
        TABLE_NAME: contactTable.tableName,
        PRIMARY_KEY: 'id'
      }
    });

    contactTable.grantReadWriteData(createContact);

    const api = new apigateway.RestApi(this, 'contactApi', {
      restApiName: environment.restAPIName
    });

    const contacts = api.root.addResource(environment.apiRootResource);

    const createContactIntegration = new apigateway.LambdaIntegration(createContact);
    contacts.addMethod('POST', createContactIntegration);
    addCorsOptions(contacts);

    const certificate = certificatemanager.Certificate.fromCertificateArn(this, 'Certificate', environment.certificateARN);
    const apiDomainName = api.addDomainName('contactApiDomain', { domainName: `${environment.subdomainName}.${environment.domainName}`, certificate: certificate });
    
    const zone = route53.HostedZone.fromLookup(this, 'MyZone', { domainName: environment.hostedZoneName });
    
    new route53.CnameRecord(this, 'CNAME', {domainName: apiDomainName.domainNameAliasDomainName, zone: zone, recordName: environment.subdomainName});

    const createSlackMessage = new lambda.Function(this, 'createSlackMessage', {
      code: new lambda.AssetCode('src'),
      handler: 'slack.handler',
      runtime: lambda.Runtime.NODEJS_8_10,
      environment: {
        SLACK_URL: environment.slackURL
      }
    });

    createSlackMessage.addEventSource(new DynamoEventSource(contactTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON
    }));
  }
}

function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },  
    }]
  })
}
