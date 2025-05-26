# Email and SMS Integration Setup

This document outlines how to set up the email and SMS integration for the MachineryMax lead verification system.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Email configuration
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=charles@machinerymaxglobal.com
MAIL_PASSWORD=Y^889118973162ab
MAIL_FROM="Charles Machinery Max <charles@machinerymaxglobal.com>"

# SMS configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
SMS_ENABLED=false

# Frontend URL for verification links
APP_URL=https://app.machinerymax.com
```

## Email Service

The system uses Nodemailer with an Outlook SMTP server to send verification emails. The default configuration is already set up for the provided email account.

## SMS Service

The system can also send SMS verification links using Twilio. To enable this feature:

1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token from the Twilio dashboard
3. Purchase a phone number through Twilio
4. Update the `.env` file with your Twilio credentials
5. Set `SMS_ENABLED=true` to enable SMS sending

## Website Integration

To integrate the verification form with machinerymax.com:

1. Add an iframe pointing to the form URL:

```html
<iframe 
  src="https://app.machinerymax.com/embedded-form" 
  width="100%" 
  height="650px" 
  frameborder="0"
  style="border: none; overflow: hidden;">
</iframe>
```

2. Replace the existing form in the "Request a Free Confidential Consultation" section with this iframe.

## Migration

To create the verification tokens table, run:

```bash
npm run migration:run
```

## Testing

To test the email verification:

1. Start the backend: `npm run start:dev`
2. Start the frontend: `cd ../machinery-max-automation && npm run dev`
3. Use the `/verification/send` endpoint to generate a verification token:

```bash
curl -X POST http://localhost:3000/verification/send \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "firstName": "John", "lastName": "Doe"}'
```

4. Check the console for the verification link (when in development mode)
5. Open the link in your browser to test the form 