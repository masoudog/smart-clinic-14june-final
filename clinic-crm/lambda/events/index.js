const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.EVENTS_TABLE;

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const clinicId = event.queryStringParameters?.clinicId;

    if (!clinicId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'clinicId required' }) };
    }

    let response;

    if (method === 'GET') {
      response = await listEvents(clinicId);
    } else if (method === 'POST') {
      response = await createEvent(clinicId, JSON.parse(event.body));
    } else if (method === 'PATCH') {
      const eventId = event.path.split('/').pop();
      response = await updateEvent(clinicId, eventId, JSON.parse(event.body));
    } else if (method === 'DELETE') {
      const eventId = event.path.split('/').pop();
      response = await deleteEvent(clinicId, eventId);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

async function listEvents(clinicId) {
  const result = await dynamodb
    .query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'clinicId = :clinicId',
      ExpressionAttributeValues: { ':clinicId': clinicId },
    })
    .promise();
  return result.Items;
}

async function createEvent(clinicId, event) {
  const id = `e-${Date.now()}`;
  const item = { ...event, clinicId, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await dynamodb.put({ TableName: TABLE_NAME, Item: item }).promise();
  return item;
}

async function updateEvent(clinicId, eventId, updates) {
  const result = await dynamodb
    .update({
      TableName: TABLE_NAME,
      Key: { clinicId, id: eventId },
      UpdateExpression: `SET updatedAt = :updatedAt`,
      ExpressionAttributeValues: { ':updatedAt': new Date().toISOString() },
      ReturnValues: 'ALL_NEW',
    })
    .promise();
  return result.Attributes;
}

async function deleteEvent(clinicId, eventId) {
  await dynamodb.delete({ TableName: TABLE_NAME, Key: { clinicId, id: eventId } }).promise();
  return { success: true };
}
