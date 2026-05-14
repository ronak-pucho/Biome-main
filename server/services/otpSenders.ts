type EmailSenderInput = {
  to: string;
  code: string;
};

type SmsSenderInput = {
  to: string;
  code: string;
};

export interface EmailSender {
  send(input: EmailSenderInput): Promise<void>;
}

export interface SmsSender {
  send(input: SmsSenderInput): Promise<void>;
}

export class DevEmailSender implements EmailSender {
  async send(_input: EmailSenderInput) {
    return;
  }
}

export class DevSmsSender implements SmsSender {
  async send(_input: SmsSenderInput) {
    return;
  }
}

export class SendGridEmailSender implements EmailSender {
  constructor(private config: { apiKey: string; from: string }) {}

  async send(input: EmailSenderInput) {
    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: input.to }],
            subject: "Your Deepenk OTP",
          },
        ],
        from: { email: this.config.from },
        content: [
          {
            type: "text/plain",
            value: `Your Deepenk OTP is ${input.code}. It expires in 10 minutes.`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      throw new Error(`SENDGRID_FAILED_${resp.status}`);
    }
  }
}

export class TwilioSmsSender implements SmsSender {
  constructor(private config: { accountSid: string; authToken: string; from: string }) {}

  async send(input: SmsSenderInput) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
    const body = new URLSearchParams({
      From: this.config.from,
      To: input.to,
      Body: `Your Deepenk OTP is ${input.code}. It expires in 10 minutes.`,
    });

    const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString("base64");
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!resp.ok) {
      throw new Error(`TWILIO_FAILED_${resp.status}`);
    }
  }
}

export function createEmailSender(): EmailSender {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM;
  if (apiKey && from) {
    return new SendGridEmailSender({ apiKey, from });
  }
  return new DevEmailSender();
}

export function createSmsSender(): SmsSender {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (accountSid && authToken && from) {
    return new TwilioSmsSender({ accountSid, authToken, from });
  }
  return new DevSmsSender();
}

export function isEmailSenderConfigured() {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM);
}

export function isSmsSenderConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}
