import { Logger } from '@nestjs/common';
import { NotificationChannel } from '@clinic/shared-types';

/**
 * Outbound messaging providers. Selection is environment-driven:
 *   SMS_PROVIDER       = console | twilio        (default: console)
 *   WHATSAPP_PROVIDER  = console | meta | twilio (default: console)
 *
 * 'console' is the demo driver — it logs the message and reports success,
 * so the full reminder pipeline works with zero credentials. Twilio/Meta
 * drivers perform real HTTP delivery when credentials are configured.
 */

export interface OutboundMessage {
  to: string;
  body: string;
  channel: NotificationChannel;
}

export interface SendResult {
  providerMessageId?: string;
}

export interface MessagingProvider {
  readonly name: string;
  send(message: OutboundMessage): Promise<SendResult>;
}

const logger = new Logger('Messaging');

/** Dev/demo provider — logs the message and reports success (no network). */
export class ConsoleMessagingProvider implements MessagingProvider {
  readonly name = 'console';

  async send(message: OutboundMessage): Promise<SendResult> {
    logger.log(`[${message.channel}] -> ${message.to}: ${message.body}`);
    return {
      providerMessageId: `console-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}

/** Twilio REST API — SMS, or WhatsApp via Twilio's whatsapp: prefix. */
export class TwilioMessagingProvider implements MessagingProvider {
  readonly name = 'twilio';

  async send(message: OutboundMessage): Promise<SendResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const rawFrom =
      message.channel === 'whatsapp'
        ? process.env.TWILIO_WHATSAPP_FROM
        : process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !rawFrom) {
      throw new Error(
        'Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / from number)',
      );
    }

    const to = message.channel === 'whatsapp' ? `whatsapp:${message.to}` : message.to;
    const from = message.channel === 'whatsapp' ? `whatsapp:${rawFrom}` : rawFrom;

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: message.body }).toString(),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Twilio ${res.status}: ${data.message ?? res.statusText}`);
    }
    return { providerMessageId: data.sid };
  }
}

/** Meta WhatsApp Cloud API — text messages. */
export class MetaWhatsAppMessagingProvider implements MessagingProvider {
  readonly name = 'meta';

  async send(message: OutboundMessage): Promise<SendResult> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;
    if (!phoneNumberId || !token) {
      throw new Error(
        'WhatsApp Cloud API is not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_TOKEN)',
      );
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.to.replace(/^\+/, ''),
        type: 'text',
        text: { preview_url: false, body: message.body },
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`WhatsApp Cloud API ${res.status}: ${data.error?.message ?? res.statusText}`);
    }
    return { providerMessageId: data.messages?.[0]?.id };
  }
}

const consoleProvider = new ConsoleMessagingProvider();
const twilioProvider = new TwilioMessagingProvider();
const metaProvider = new MetaWhatsAppMessagingProvider();

export function resolveProvider(channel: NotificationChannel): MessagingProvider {
  const choice =
    (channel === 'sms' ? process.env.SMS_PROVIDER : process.env.WHATSAPP_PROVIDER) ?? 'console';
  switch (choice) {
    case 'console':
      return consoleProvider;
    case 'twilio':
      return twilioProvider;
    case 'meta':
      if (channel === 'sms') {
        throw new Error("Provider 'meta' only supports the whatsapp channel");
      }
      return metaProvider;
    default:
      throw new Error(
        `Unknown ${channel} provider '${choice}' (expected console | twilio${channel === 'whatsapp' ? ' | meta' : ''})`,
      );
  }
}
