import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Stripe from 'https://esm.sh/stripe@14.14.0'

// Mapeamento de IDs de Preço do Stripe para os Tiers do nosso App
// IMPORTANTE: Devem ser os mesmos IDs usados na tela de Subscription
const PRICE_TO_TIER: Record<string, string> = {
  "price_1TCriP2LdLLLIxeHYXAtYEFW": "basic",
  "price_1TCrkm2LdLLLIxeHJcrSxfam": "pro",
  "price_1TCrm22LdLLLIxeH8tvbj2Nb": "ultra",
};

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const signature = req.headers.get('stripe-signature');

  if (!signature || !endpointSecret) {
    return new Response('Configuração de assinatura ausente', { status: 400 });
  }

  const body = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    console.error(`[webhook] Erro de assinatura: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '', 
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log(`[webhook] Evento recebido: ${event.type}`);

  try {
    // 1. Checkout concluído (Primeira compra)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, tier } = session.metadata;
      const customerId = session.customer;

      console.log(`[webhook] Finalizando checkout para user ${userId} no tier ${tier}`);
      
      await supabase
        .from('profiles')
        .update({ 
          subscription_tier: tier, 
          stripe_customer_id: customerId 
        })
        .eq('id', userId);
    }

    // 2. Assinatura Deletada (Cancelamento efetivo após o fim do período pago)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      console.log(`[webhook] Assinatura encerrada para o cliente ${customerId}. Voltando para FREE.`);

      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('stripe_customer_id', customerId);
    }

    // 3. Assinatura Atualizada (Upgrade ou Downgrade via Portal)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const priceId = subscription.items.data[0].price.id;
      const newTier = PRICE_TO_TIER[priceId] || 'free';

      // Se a assinatura foi cancelada mas ainda está no período de carência (trial ou cancel_at_period_end)
      // o Stripe envia um update. Se 'cancel_at' existir, não mudamos para free ainda.
      // A mudança para free só acontece no evento 'deleted' acima.
      
      console.log(`[webhook] Assinatura atualizada para o cliente ${customerId}. Novo Tier: ${newTier}`);

      await supabase
        .from('profiles')
        .update({ subscription_tier: newTier })
        .eq('stripe_customer_id', customerId);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (dbError) {
    console.error(`[webhook] Erro ao atualizar banco de dados: ${dbError.message}`);
    return new Response('Erro interno', { status: 500 });
  }
})