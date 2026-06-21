const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.SETTINGS_TABLE;

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const clinicId = event.queryStringParameters?.clinicId;

    if (!clinicId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'clinicId required' }) };
    }

    let response;

    if (method === 'GET') {
      response = await getSettings(clinicId);
    } else if (method === 'PATCH') {
      response = await updateSettings(clinicId, JSON.parse(event.body));
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

async function getSettings(clinicId) {
  const result = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: { clinicId },
    })
    .promise();

  if (!result.Item) {
    // Return default settings
    return {
      clinicId,
      clinicName: 'کلینیک آرامش',
      onlineBookingEnabled: true,
      sessionBuffer: 15,
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: 9, end: 18 },
      blockedSlots: [],
      updatedAt: new Date().toISOString(),
    };
  }

  return result.Item;
}

async function updateSettings(clinicId, updates) {
  const updateExpressions = [];
  const expressionAttributeValues = {};
  let counter = 0;

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'clinicId') {
      updateExpressions.push(`${key} = :val${counter}`);
      expressionAttributeValues[`:val${counter}`] = value;
      counter++;
    }
  }

  updateExpressions.push(`updatedAt = :updatedAt`);
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const result = await dynamodb
    .update({
      TableName: TABLE_NAME,
      Key: { clinicId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
    .promise();

  return result.Attributes || { clinicId, ...updates, updatedAt: new Date().toISOString() };
}
