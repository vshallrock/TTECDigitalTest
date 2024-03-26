import * as cdk from '@aws-cdk/core';
import { VanityNumberConverterStack } from '../lib/src-stack';

const app = new cdk.App();
new VanityNumberConverterStack(app, 'VanityNumberConverterStack');
