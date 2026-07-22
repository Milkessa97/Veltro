const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

// Parse .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const apiKey = env['RESEND_API_KEY'];
if (!apiKey) {
  console.error('RESEND_API_KEY is not defined in .env');
  process.exit(1);
}

console.log('Using Resend API Key:', apiKey.substring(0, 10) + '...');

const resend = new Resend(apiKey);

async function test() {
  console.log('Sending test email to milkessahabtamukebu@gmail.com...');
  try {
    const { data, error } = await resend.emails.send({
      from: env['RESEND_FROM_EMAIL'] || 'onboarding@resend.dev',
      to: 'milkessahabtamukebu@gmail.com',
      subject: 'Veltro Resend Test Diagnostics',
      html: '<p>If you see this, your Resend API integration is working correctly!</p>'
    });
    
    if (error) {
      console.error('Resend Error:', error);
    } else {
      console.log('Resend Success!', data);
    }
  } catch (err) {
    console.error('Execution Error:', err);
  }
}

test();
