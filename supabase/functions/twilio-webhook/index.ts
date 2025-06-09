import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const twilioResponse = await req.json()
    
    // Log mensaje recibido
    console.log('Received message:', twilioResponse)

    // Aquí puedes manejar diferentes estados del mensaje
    const messageStatus = twilioResponse.MessageStatus
    const to = twilioResponse.To
    const from = twilioResponse.From

    // Actualizar estado en base de datos si es necesario
    if (messageStatus === 'delivered') {
      // Actualizar estado del mensaje como entregado
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})