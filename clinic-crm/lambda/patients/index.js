const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.PATIENTS_TABLE;

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const clinicId = event.queryStringParameters?.clinicId;

    if (!clinicId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'clinicId is required' }),
      };
    }

    let response;

    if (method === 'GET') {
      if (path.includes('/patients/')) {
        // Get single patient
        const patientId = path.split('/').pop();
        response = await getPatient(clinicId, patientId);
      } else {
        // List all patients
        response = await listPatients(clinicId);
      }
    } else if (method === 'POST') {
      response = await createPatient(clinicId, JSON.parse(event.body));
    } else if (method === 'PATCH') {
      const patientId = path.split('/').pop();
      response = await updatePatient(clinicId, patientId, JSON.parse(event.body));
    } else if (method === 'DELETE') {
      const patientId = path.split('/').pop();
      response = await deletePatient(clinicId, patientId);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function listPatients(clinicId) {
  const result = await dynamodb
    .query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'clinicId = :clinicId',
      ExpressionAttributeValues: {
        ':clinicId': clinicId,
      },
    })
    .promise();

  return result.Items;
}

async function getPatient(clinicId, patientId) {
  const result = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: {
        clinicId,
        id: patientId,
      },
    })
    .promise();

  if (!result.Item) {
    throw new Error('Patient not found');
  }

  return result.Item;
}

async function createPatient(clinicId, patient) {
  const id = `p-${Date.now()}`;
  const item = {
    ...patient,
    clinicId,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dynamodb
    .put({
      TableName: TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
}

async function updatePatient(clinicId, patientId, updates) {
  const updateExpressions = [];
  const expressionAttributeValues = {};
  let counter = 0;

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'clinicId' && key !== 'id') {
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
      Key: { clinicId, id: patientId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
    .promise();

  return result.Attributes;
}

async function deletePatient(clinicId, patientId) {
  await dynamodb
    .delete({
      TableName: TABLE_NAME,
      Key: { clinicId, id: patientId },
    })
    .promise();

  return { success: true };
}
