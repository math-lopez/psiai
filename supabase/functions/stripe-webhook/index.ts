import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Stripe from 'https://esm.sh/stripe@14.14.0'

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const signature = req.headers.get('stripe-signature');

  if (!signature || !endpointSecret) return new Response('Erro', { status: 400 });

  const body = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  // 1. Quando o checkout é concluído pela primeira vez
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, tier } = session.metadata;
    const customerId = session.customer;

    await supabase
      .from('profiles')
      .update({ subscription_tier: tier, stripe_customer_id: customerId })
      .eq('id', userId);
  }

  // 2. Quando o plano é alterado via Portal (Downgrade/Upgrade/Cancelamento)
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    
    // Pegamos o ID do preço atual da assinatura
    const priceId = subscription.items.data[0].price.id;
    
    // Mapeamos o priceId de volta para o tier (aqui você precisaria de um mapa se quisesse precisão total)
    // Para simplificar, vamos avisar que o plano mudou. 
    // Dica: O ideal é que o Webhook busque qual Tier corresponde a esse priceId.
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
})