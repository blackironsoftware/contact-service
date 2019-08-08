#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { ContactServiceStack } from '../lib/contact-service-stack';
import { environment } from '../environments/environment';

const app = new cdk.App();
new ContactServiceStack(app, 'ContactServiceStack', { env: { account: environment.awsAccount, region: environment.awsRegion } });
