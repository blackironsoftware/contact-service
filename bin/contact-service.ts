#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { ContactServiceStack } from '../lib/contact-service-stack';

const app = new cdk.App();
new ContactServiceStack(app, 'ContactServiceStack');
