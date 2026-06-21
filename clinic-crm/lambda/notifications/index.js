const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.NOTIFICATIONS_TABLE;

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const clinicId = event.queryStringParameters?.clinicId;

    if (!clinicId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'clinicId required' }) };
    }

    let response;

    if (method === 'GET') {
      response = await listNotifications(clinicId);
    } else if (method === 'PATCH') {
      const path = event.path;
      if (path.includes('mark-all-read')) {
        response = await markAllRead(clinicId);
      } else {
        const notificationId = path.split('/')[path.split('/').length - 2];
        response = await markNotificationRead(clinicId, notificationId);
      }
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

async function listNotifications(clinicId) {
  const result = await dynamodb
    .query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'clinicId = :clinicId',
      ExpressionAttributeValues: { ':clinicId': clinicId },
      ScanIndexForward: false,
    })
    .promise();
  return result.Items;
}

async function markNotificationRead(clinicId, notificationId) {
  const result = await dynamodb
    .update({
      TableName: TABLE_NAME,
      Key: { clinicId, id: notificationId },
      UpdateExpression: 'SET #read = :true',
      ExpressionAttributeNames: { '#read': 'read' },
      ExpressionAttributeValues: { ':true': true },
      ReturnValues: 'ALL_NEW',
    })
    .promise();
  return result.Attributes;
}

async function markAllRead(clinicId) {
  const items = await listNotifications(clinicId);
  const promises = items.map(item =>
    dynamodb
      .update({
        TableName: TABLE_NAME,
        Key: { clinicId, id: item.id },
        UpdateExpression: 'SET #read = :true',
        ExpressionAttributeNames: { '#read': 'read' },
        ExpressionAttributeValues: { ':true': true },
      })
      .promise()
  );

  await Promise.all(promises);
  return { success: true };
}
