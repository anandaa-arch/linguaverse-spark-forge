
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req
  const upgradeHeader = headers.get("upgrade") || ""

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 })
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not found in environment variables");
      socket.send(JSON.stringify({ error: "OpenAI API key not configured" }));
      socket.close(1011, "Server configuration error");
      return response;
    }

    socket.onopen = async () => {
      console.log("Client connected");
      
      try {
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
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.error("Error from OpenAI:", error);
          socket.send(JSON.stringify({ error: `OpenAI API error: ${error}` }));
          return;
        }

        const data = await tokenResponse.json();
        socket.send(JSON.stringify(data));
      } catch (error) {
        console.error("Error getting session token:", error);
        socket.send(JSON.stringify({ error: `Error getting session token: ${error.message}` }));
      }
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message from client:", message);
        
        if (message.type === 'input_audio_buffer.append' && message.audio) {
          // Forward audio data to OpenAI using client_secret from initial token response
          const clientSecret = message.client_secret?.value;
          if (!clientSecret) {
            console.error("No client secret provided for audio forwarding");
            return;
          }
          
          const response = await fetch("https://api.openai.com/v1/realtime/audio", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${clientSecret}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: message.audio
            }),
          });
          
          if (!response.ok) {
            const error = await response.text();
            console.error("Error forwarding audio to OpenAI:", error);
            socket.send(JSON.stringify({ error: `Error forwarding audio: ${error}` }));
            return;
          }
          
          const responseData = await response.json();
          socket.send(JSON.stringify(responseData));
        }
      } catch (error) {
        console.error("Error handling websocket message:", error);
        socket.send(JSON.stringify({ error: `Error handling message: ${error.message}` }));
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log("Client disconnected:", event.code, event.reason);
    };

    return response;
  } catch (error) {
    console.error("Error handling connection:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
