
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const { headers } = req
  const upgradeHeader = headers.get("upgrade") || ""

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 })
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    // Get ephemeral token from OpenAI
    const tokenResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: "You are an AI language tutor. Analyze user's speech for grammar and pronunciation issues, and provide helpful feedback."
      }),
    })

    const data = await tokenResponse.json()
    socket.send(JSON.stringify(data))

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data)
      console.log("Received message:", message)
      
      if (message.type === 'input_audio_buffer.append') {
        // Forward audio data to OpenAI
        const response = await fetch("https://api.openai.com/v1/realtime/audio", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${data.client_secret.value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        })
        
        const responseData = await response.json()
        socket.send(JSON.stringify(responseData))
      }
    }

    return response
  } catch (error) {
    console.error("Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
