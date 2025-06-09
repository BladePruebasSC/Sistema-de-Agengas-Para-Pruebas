import { Handler } from '@netlify/functions';
import twilio from 'twilio';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const { to, from, body } = JSON.parse(event.body || '{}');

    const client = twilio(
      process.env.VITE_TWILIO_ACCOUNT_SID,
      process.env.VITE_TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      to,
      from,
      body
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(message)
    };
  } catch (error) {
    console.error('SMS Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS' })
    };
  }
};

export { handler };