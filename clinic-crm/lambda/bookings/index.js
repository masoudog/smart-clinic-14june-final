const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE;

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const clinicId = event.queryStringParameters?.clinicId;

    if (!clinicId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'clinicId required' }) };
    }

    let response;

    if (method === 'GET') {
      response = await listBookings(clinicId, event.queryStringParameters?.status);
    } else if (method === 'POST') {
      response = await createBooking(clinicId, JSON.parse(event.body));
    } else if (method === 'PATCH') {
      const bookingId = event.path.split('/').pop();
      response = await updateBooking(clinicId, bookingId, JSON.parse(event.body));
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

async function listBookings(clinicId, status) {
  const result = await dynamodb
    .query({
      TableName: BOOKINGS_TABLE,
      KeyConditionExpression: 'clinicId = :clinicId',
      ExpressionAttributeValues: { ':clinicId': clinicId },
      FilterExpression: status ? 'statusCode = :status' : undefined,
      ExpressionAttributeValues: status
        ? { ':clinicId': clinicId, ':status': status }
        : { ':clinicId': clinicId },
    })
    .promise();
  return result.Items;
}

async function createBooking(clinicId, booking) {
  const id = `br-${Date.now()}`;
  const item = { ...booking, clinicId, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  await dynamodb.put({ TableName: BOOKINGS_TABLE, Item: item }).promise();

  // Create notification
  const notification = {
    id: `n-${Date.now()}`,
    clinicId,
    type: 'booking',
    title: 'درخواست رزرو جدید',
    body: `${booking.firstName} ${booking.lastName} — درخواست جدید`,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await dynamodb.put({ TableName: NOTIFICATIONS_TABLE, Item: notification }).promise();

  return item;
}

async function updateBooking(clinicId, bookingId, updates) {
  const result = await dynamodb
    .update({
      TableName: BOOKINGS_TABLE,
      Key: { clinicId, id: bookingId },
      UpdateExpression: `SET updatedAt = :updatedAt`,
      ExpressionAttributeValues: { ':updatedAt': new Date().toISOString() },
      ReturnValues: 'ALL_NEW',
    })
    .promise();
  return result.Attributes;
}
