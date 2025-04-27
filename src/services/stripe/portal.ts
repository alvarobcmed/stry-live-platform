import { Stripe } from 'stripe';

// Use environment variable for Stripe API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key_here', {
  apiVersion: '2023-10-16',
});

// Configure portal settings once
export async function configurePortalSettings() {
  try {
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Stry Live - Gerenciamento de Assinatura',
        privacy_policy_url: 'https://stry.live/privacy',
        terms_of_service_url: 'https://stry.live/terms'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          products: [
            {
              product: process.env.STRIPE_MONTHLY_PRODUCT_ID || 'your_monthly_product_id', 
              prices: [process.env.STRIPE_MONTHLY_PRICE_ID || 'your_monthly_price_id']
            },
            {
              product: process.env.STRIPE_ANNUAL_PRODUCT_ID || 'your_annual_product_id',
              prices: [process.env.STRIPE_ANNUAL_PRICE_ID || 'your_annual_price_id']
            }
          ]
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          proration_behavior: 'none',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features', 
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address', 'tax_id'],
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true }
      }
    });

    return configuration;
  } catch (error) {
    console.error('Error configuring portal:', error);
    throw error;
  }
}
export async function createPortalSession(customerId: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.SITE_URL || 'https://stry.live/admin',
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}
