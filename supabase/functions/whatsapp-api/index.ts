import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WhatsAppRequest {
  to: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message }: WhatsAppRequest = await req.json()

    // Aquí integrarías con la API de WhatsApp Business
    // Por ahora, simularemos el envío exitoso
    console.log(`Enviando WhatsApp a ${to}: ${message}`)

    // En producción, aquí harías la llamada real a la API de WhatsApp
    // const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: to.replace(/\D/g, ''), // Solo números
    //     type: 'text',
    //     text: { body: message }
    //   })
    // })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensaje enviado exitosamente',
        to,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})