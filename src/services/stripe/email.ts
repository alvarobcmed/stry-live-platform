import { Stripe } from 'stripe';

// Use environment variable for Stripe API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key_here', {
  apiVersion: '2023-10-16',
});

export async function configureEmailSettings() {
  try {
    // Configure branding settings
    // Replace with your actual Stripe account ID from environment variable
    const accountId = process.env.STRIPE_ACCOUNT_ID || 'your_stripe_account_id';
    
    await stripe.accounts.update(accountId, {
      settings: {
        branding: {
          logo: 'https://stry.live/logo.png',
          icon: 'https://stry.live/favicon.png',
          primary_color: '#6B0F6C',
          secondary_color: '#FF0A7B'
        },
        emails: {
          enabled: true,
          from_name: 'Stry Live',
          from_address: 'contato@stry.live',
          reply_to: 'suporte@stry.live',
          footer: {
            social_links: {
              twitter: 'https://twitter.com/strylive',
              facebook: 'https://facebook.com/strylive',
              instagram: 'https://instagram.com/strylive'
            },
            business_name: 'Stry Live',
            business_address: {
              line1: 'Rua Exemplo, 123',
              line2: 'Sala 45',
              city: 'São Paulo',
              state: 'SP',
              postal_code: '01234-567',
              country: 'BR'
            }
          }
        }
      }
    });

    // Configure email templates
    await stripe.accounts.update(accountId, {
      settings: {
        payments: {
          statement_descriptor: 'STRY LIVE',
          statement_descriptor_kana: null,
          statement_descriptor_kanji: null
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error configuring email settings:', error);
    throw error;
  }
}

export async function verifyEmailDomain() {
  try {
    // Verify domain ownership
    // Replace with your actual Stripe account ID from environment variable
    const accountId = process.env.STRIPE_ACCOUNT_ID || 'your_stripe_account_id';
    
    const verification = await stripe.accounts.createLoginLink(accountId, {
      collect: 'eventually_due'
    });

    return {
      success: true,
      verificationUrl: verification.url
    };
  } catch (error) {
    console.error('Error verifying email domain:', error);
    throw error;
  }
}
