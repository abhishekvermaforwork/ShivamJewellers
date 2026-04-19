import Stripe from 'stripe';
import { Invoice } from '../models/Invoice.model.js';
import { Payment } from '../models/Payment.model.js';
import { logger } from '../config/logger.js';

/**
 * Stripe webhook — mirrors payments/views.stripe_webhook_view (raw body required).
 */
export async function handleStripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(400).send('Webhook not configured');
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(400).send('Stripe not configured');
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    logger.warn('Stripe webhook signature failed', { message: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const piId = pi.id;
    const amount = (pi.amount ?? 0) / 100;
    const invoiceId = pi.metadata?.invoice_id;

    if (invoiceId) {
      try {
        const invoice = await Invoice.findById(invoiceId);
        if (invoice) {
          await Payment.create({
            invoice: invoice._id,
            amountPaid: amount,
            paymentMethod: 'stripe',
            stripePaymentIntentId: piId,
            notes: 'Paid via Stripe',
          });
        }
      } catch (e) {
        logger.error('Stripe webhook invoice handling failed', { err: e });
      }
    }
  }

  return res.status(200).json({ received: true });
}
