import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceIds = {
  pro: process.env.STRIPE_PRICE_PRO_ID,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_ID,
} as const;

const stripe =
  stripeSecretKey !== undefined
    ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
    : null;

function getAppUrl(request: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const origin = request.headers.get('origin');
  if (origin) return origin;
  return 'http://localhost:3000';
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Billing is not configured' }, { status: 500 });
  }

  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const plan = (body as { plan?: unknown }).plan === 'enterprise' ? 'enterprise' : 'pro';
  const priceId = priceIds[plan];

  if (!priceId) {
    return NextResponse.json({ error: `${plan} plan not available` }, { status: 400 });
  }

  const successPath =
    typeof (body as { successPath?: unknown }).successPath === 'string' &&
    (body as { successPath?: unknown }).successPath?.toString().startsWith('/')
      ? (body as { successPath?: string }).successPath
      : '/dashboard';

  const appUrl = getAppUrl(request);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=1`,
      client_reference_id: userId,
      customer_email: user.primaryEmailAddress?.emailAddress ?? undefined,
      metadata: {
        plan,
        userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
