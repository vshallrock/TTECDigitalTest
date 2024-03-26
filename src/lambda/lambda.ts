import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from './lib/src-stack';

// Initialize DynamoDB DocumentClient
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = 'VanityNumbersTable';

// Function to generate vanity numbers from the phone number
function generateVanityNumbers(phoneNumber: string): string[] {
    // Your logic to generate vanity numbers from the phone number
}

// Scoring mechanism to determine the "best" vanity number
function scoreVanityNumber(vanityNumber: string): number {
    // Example scoring mechanism: prioritize shorter vanity numbers
    return vanityNumber.length;
}

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    // Extract caller's number from the event
    const callerNumber = event.queryStringParameters?.caller_number;

    // Generate vanity numbers for the caller's number
    const vanityNumbers = generateVanityNumbers(callerNumber);

    // Score vanity numbers and select the top 5
    const bestVanityNumbers = vanityNumbers.sort((a, b) => scoreVanityNumber(a) - scoreVanityNumber(b)).slice(0, 5);

    // Save best vanity numbers along with caller's number in DynamoDB
    const putPromises = bestVanityNumbers.map(vanityNumber => {
        const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
            TableName: tableName,
            Item: {
                caller_number: callerNumber,
                vanity_number: vanityNumber
            }
        };
        return dynamodb.put(params).promise();
    });

    await Promise.all(putPromises);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Vanity numbers saved successfully',
            bestVanityNumbers: bestVanityNumbers
        })
    };
};
