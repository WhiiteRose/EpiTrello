import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey !== undefined ? new Stripe(stripeSecretKey) : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const sessionId = (body as { sessionId?: unknown }).sessionId;
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'session_id requis' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.client_reference_id !== userId) {
      return NextResponse.json({ error: 'Cette session ne correspond pas à votre compte.' }, { status: 403 });
    }

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Le paiement n’est pas encore validé.' }, { status: 400 });
    }

    const plan = (session.metadata?.plan as string | undefined)?.toLowerCase();
    if (!plan) {
      return NextResponse.json({ error: 'Aucun plan trouvé pour cette session.' }, { status: 400 });
    }

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { plan },
      privateMetadata: { plan, lastPlanUpdate: new Date().toISOString() },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de valider la session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
