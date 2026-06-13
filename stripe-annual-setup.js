/**
 * stripe-annual-setup.js
 *
 * Creates 3 annual recurring price products in Stripe for CyberShield.
 * Run once: STRIPE_SECRET_KEY=sk_live_xxx node stripe-annual-setup.js
 *
 * Outputs the 3 price IDs — give these to your Railway backend as env vars:
 *   STRIPE_ANNUAL_STARTER_PRICE_ID
 *   STRIPE_ANNUAL_BUSINESS_PRICE_ID
 *   STRIPE_ANNUAL_ENTERPRISE_PRICE_ID
 */

const Stripe = require('stripe');

const PLANS = [
  {
    key: 'starter',
    name: 'CyberShield Starter — Annual',
    description: '10 seats · AI security training · Breach monitoring · 5 vulnerability scans/mo · Email alerts',
    monthlyEquivalent: 39,   // $39/mo displayed
    annualTotal: 46800,      // $468.00 in cents (39 × 12 = 468)
  },
  {
    key: 'business',
    name: 'CyberShield Business — Annual',
    description: '50 seats · Unlimited scans · Email + Slack alerts · Bulk breach checking · Monthly PDF reports',
    monthlyEquivalent: 159,
    annualTotal: 191000,     // $1,910.00 in cents
  },
  {
    key: 'enterprise',
    name: 'CyberShield Enterprise — Annual',
    description: 'Unlimited seats · White-label branding · Custom integrations · Dedicated account manager · Priority 24/7 support',
    monthlyEquivalent: 479,
    annualTotal: 575000,     // $5,750.00 in cents
  },
];

async function run() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('Set STRIPE_SECRET_KEY env var before running.');
    process.exit(1);
  }

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  const results = {};

  for (const plan of PLANS) {
    console.log(`\nCreating: ${plan.name}`);

    // Create the product
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { plan: plan.key, billing: 'annual' },
    });
    console.log(`  Product ID: ${product.id}`);

    // Create the annual recurring price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.annualTotal,
      currency: 'usd',
      recurring: { interval: 'year' },
      nickname: `${plan.key}_annual`,
      metadata: { plan: plan.key, billing: 'annual' },
    });
    console.log(`  Price ID:   ${price.id}  ← use this`);

    results[plan.key] = { productId: product.id, priceId: price.id };
  }

  console.log('\n─────────────────────────────────────────────────────');
  console.log('Add these to your Railway backend environment variables:');
  console.log('─────────────────────────────────────────────────────');
  for (const [key, val] of Object.entries(results)) {
    const envKey = `STRIPE_ANNUAL_${key.toUpperCase()}_PRICE_ID`;
    console.log(`${envKey}=${val.priceId}`);
  }
  console.log('─────────────────────────────────────────────────────');
  console.log('\nBackend: when billing==="annual" in /auth/register,');
  console.log('use the annual price ID in your Stripe checkout session');
  console.log('with subscription_data: { trial_period_days: 0 } (no trial).\n');
}

run().catch(err => { console.error(err.message); process.exit(1); });
