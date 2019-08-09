import * as AWS from 'aws-sdk';
import * as uuidv4 from 'uuid/v4';

const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`;
const DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error,
please take a look at your CloudWatch Logs.`;

const requiredProperties = ['email', 'message', 'name', 'subject'];

interface Contact {
  email: string;
  message: string;
  name: string;
  subject: string;
  [key: string]: string;
}

export const handler = async (event: any = {}): Promise<any> => {

  if (!event.body) {
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }

  const contact: Contact = typeof event.body === 'object' ? event.body : JSON.parse(event.body);

  contact[PRIMARY_KEY] = uuidv4();

  const params = {
    Item: contact,
    TableName: TABLE_NAME,
  };

  try {
    await db.put(params).promise();
    return { 
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
      },
      body: ''
    };
  } catch (dbError) {
    const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
    DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
    return { statusCode: 500, body: errorResponse };
  }
};
