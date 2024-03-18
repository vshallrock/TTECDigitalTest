import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as connect from '@aws-cdk/aws-connect';
import * as customResources from '@aws-cdk/custom-resources';

export class VanityNumberConverterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table to store best vanity numbers and caller's number
    const vanityNumbersTable = new dynamodb.Table(this, 'VanityNumbersTable', {
      partitionKey: { name: 'callerNumber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'vanityNumber', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Only for demo purposes, consider using a different policy in production
    });

    // Lambda function to convert phone numbers to vanity numbers and save to DynamoDB
    const vanityNumberConverterLambda = new lambda.Function(this, 'VanityNumberConverterLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'), // Assuming your Lambda code is in a directory named 'lambda'
      environment: {
        TABLE_NAME: vanityNumbersTable.tableName,
      },
    });

    vanityNumbersTable.grantWriteData(vanityNumberConverterLambda);

    // Custom resource to deploy contact flow with Lambda ARN
    const customResourceProvider = new customResources.Provider(this, 'CustomResourceProvider', {
      onEventHandler: vanityNumberConverterLambda,
    });

    // CloudFormation Custom Resource to publish contact flow to Connect instance
    const publishContactFlowResource = new cdk.CustomResource(this, 'PublishContactFlowResource', {
      serviceToken: customResourceProvider.serviceToken,
      properties: {
        InstanceId: 'CONNECT_INSTANCE_ID', // Replace with Connect instance ID
        ContactFlowId: 'CONTACT_FLOW_ID', // Replace with  Contact Flow ID
        LambdaArn: vanityNumberConverterLambda.functionArn,
      },
    });

    // Amazon Connect contact flow to say the 3 vanity possibilities
    const contactFlow = new connect.CfnContactFlow(this, 'VanityNumberContactFlow', {
      instanceId: 'CONNECT_INSTANCE_ID', // Replace with  Connect instance ID
      name: 'VanityNumberContactFlow',
      type: 'CONTACT_FLOW',
      content: {
        contactFlow: {
          modules: [
            {
              id: 'sayHello',
              type: 'PlayPrompt',
              parameters: {
                PromptId: 'YOUR_PROMPT_ID', // Replace with your prompt ID
              },
            },
            {
              id: 'sayVanityNumbers',
              type: 'PlayPrompt',
              parameters: {
                PromptId: 'YOUR_VANITY_NUMBERS_PROMPT_ID', // Replace with your vanity numbers prompt ID
              },
            },
          ],
          edges: [
            {
              source: 'sayHello',
              destination: 'sayVanityNumbers',
              condition: 'Always',
            },
          ],
        },
      },
    });
  }
}

const app = new cdk.App();
new VanityNumberConverterStack(app, 'VanityNumberConverterStack');
