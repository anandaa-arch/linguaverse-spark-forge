
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

    // Track client state
    let clientSecret: string | null = null;
    
    // Extract avatar specialty from the URL
    const url = new URL(req.url);
    const avatarSpecialty = url.searchParams.get('specialty') || "general";
    console.log(`Connection requested for avatar specialty: ${avatarSpecialty}`);

    socket.onopen = async () => {
      console.log("Client connected");
      
      try {
        // Customize prompt based on avatar specialty
        let instructions = "You are an AI language tutor. Analyze user's speech for grammar and pronunciation issues, and provide helpful feedback.";
        
        if (avatarSpecialty === "grammar") {
          instructions = "You are a grammar expert. Focus on identifying grammar mistakes in the user's speech and explain how to correct them with examples.";
        } else if (avatarSpecialty === "pronunciation") {
          instructions = "You are a pronunciation coach. Help users improve their speech by identifying pronunciation issues and providing exercises to practice.";
        }
        
        console.log(`Using specialty: ${avatarSpecialty} with instructions: ${instructions}`);

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
            instructions
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("Error from OpenAI:", errorText);
          socket.send(JSON.stringify({ error: `OpenAI API error: ${errorText}` }));
          return;
        }

        const data = await tokenResponse.json();
        clientSecret = data.client_secret?.value;
        
        if (!clientSecret) {
          console.error("No client secret received from OpenAI");
          socket.send(JSON.stringify({ error: "Failed to get client secret from OpenAI" }));
          return;
        }
        
        console.log("Sending session data to client");
        socket.send(JSON.stringify(data));
        
        // Send session.update to configure additional settings
        if (clientSecret) {
          setTimeout(() => {
            try {
              const updateMessage = {
                type: "session.update",
                session: {
                  modalities: ["text", "audio"],
                  voice: "alloy",
                  input_audio_format: "pcm16",
                  output_audio_format: "pcm16",
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 1000
                  }
                },
                client_secret: { value: clientSecret }
              };
              
              fetch("https://api.openai.com/v1/realtime", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${clientSecret}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updateMessage),
              })
              .then(resp => {
                if (!resp.ok) {
                  console.error(`Error in session.update: ${resp.status}`);
                } else {
                  console.log("Session updated successfully");
                }
              })
              .catch(err => {
                console.error("Failed to update session:", err);
              });
            } catch (error) {
              console.error("Error sending session update:", error);
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error getting session token:", error);
        socket.send(JSON.stringify({ error: `Error getting session token: ${error.message}` }));
      }
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message from client:", message.type);
        
        if (message.type === 'input_audio_buffer.append' && message.audio) {
          // Forward audio data to OpenAI using client_secret 
          const secretToUse = message.client_secret?.value || clientSecret;
          if (!secretToUse) {
            console.error("No client secret provided for audio forwarding");
            return;
          }
          
          const response = await fetch("https://api.openai.com/v1/realtime/audio", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${secretToUse}`,
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
        // Handle session finalization with text input or response creation
        else if (message.type === 'conversation.item.create' || message.type === 'response.create') {
          const secretToUse = message.client_secret?.value || clientSecret;
          if (!secretToUse) {
            console.error("No client secret provided for message forwarding");
            return;
          }
          
          console.log(`Sending ${message.type} to OpenAI`);
          const response = await fetch("https://api.openai.com/v1/realtime", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${secretToUse}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          });
          
          if (!response.ok) {
            const error = await response.text();
            console.error("Error sending message to OpenAI:", error);
            socket.send(JSON.stringify({ error: `Error sending message: ${error}` }));
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
