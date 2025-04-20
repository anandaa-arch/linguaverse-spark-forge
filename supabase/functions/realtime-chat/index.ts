
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Simple in-memory service monitoring
let serviceStatus = {
  isHealthy: true,
  lastCheck: Date.now(),
  errorCount: 0,
  lastError: null as string | null,
  maxErrorCount: 5,
  resetIntervalMs: 60000 // Reset error count after 1 minute
};

// Health check interval
setInterval(() => {
  const now = Date.now();
  if (now - serviceStatus.lastCheck > serviceStatus.resetIntervalMs) {
    serviceStatus.errorCount = 0;
    serviceStatus.isHealthy = true;
  }
}, 30000);

// Function to log errors and track service health
const logError = (error: any) => {
  console.error('Error:', error);
  serviceStatus.errorCount++;
  serviceStatus.lastError = error instanceof Error ? error.message : String(error);
  serviceStatus.lastCheck = Date.now();
  
  if (serviceStatus.errorCount >= serviceStatus.maxErrorCount) {
    serviceStatus.isHealthy = false;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Service health check endpoint
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) {
    return new Response(JSON.stringify({
      status: serviceStatus.isHealthy ? 'healthy' : 'degraded',
      errors: serviceStatus.errorCount,
      lastError: serviceStatus.lastError
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Handle ping requests
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (body.type === 'ping') {
        return new Response(JSON.stringify({ type: 'pong' }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e) {
      // Continue if not a ping request
    }
  }

  const { headers } = req
  const upgradeHeader = headers.get("upgrade") || ""

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 })
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req)

    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not found in environment variables");
      socket.send(JSON.stringify({ error: "OpenAI API key not configured" }));
      socket.close(1011, "Server configuration error");
      return response;
    }

    // Track client state
    let clientSecret: string | null = null;
    let hasInitialSessionUpdate = false;
    
    // Extract avatar specialty from the URL
    const url = new URL(req.url);
    const avatarSpecialty = url.searchParams.get('specialty') || "general";
    console.log(`Connection requested for avatar specialty: ${avatarSpecialty}`);

    socket.onopen = async () => {
      console.log("Client connected to WebSocket server");
      
      try {
        // Customize prompt based on avatar specialty
        let instructions = "You are an AI language tutor named LinguaBot. Be friendly, helpful and engage in conversation about language learning topics. Ask questions about the user's language learning goals and offer personalized advice. Keep responses concise.";
        
        if (avatarSpecialty === "grammar") {
          instructions = "You are Professor Lang, a grammar expert. Focus on identifying grammar mistakes in the user's speech and explain how to correct them with examples. Be professional but encouraging. Keep responses concise and educational.";
        } else if (avatarSpecialty === "pronunciation") {
          instructions = "You are Traveler, a pronunciation coach. Help users improve their speech by identifying pronunciation issues and providing exercises to practice. Be enthusiastic and supportive. Share tips from different regions where the language is spoken. Keep responses brief and practical.";
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
          logError(`OpenAI API error: ${errorText}`);
          socket.send(JSON.stringify({ error: `OpenAI API error: ${errorText}` }));
          socket.close(1011, `OpenAI API error: ${errorText}`);
          return;
        }

        const data = await tokenResponse.json();
        clientSecret = data.client_secret?.value;
        
        if (!clientSecret) {
          logError("No client secret received from OpenAI");
          socket.send(JSON.stringify({ error: "Failed to get client secret from OpenAI" }));
          socket.close(1011, "Failed to get client secret");
          return;
        }
        
        console.log("Sending session data to client");
        socket.send(JSON.stringify(data));
        
        // Send session.update to configure additional settings immediately after sending session data
        if (clientSecret) {
          console.log("Updating session configuration");
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
          
          try {
            const updateResponse = await fetch("https://api.openai.com/v1/realtime", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${clientSecret}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updateMessage),
            });
            
            if (!updateResponse.ok) {
              const errorMsg = `Error in session.update: ${updateResponse.status}`;
              logError(errorMsg);
              socket.send(JSON.stringify({ error: `Session update failed: ${updateResponse.status}` }));
            } else {
              console.log("Session updated successfully");
              hasInitialSessionUpdate = true;
              
              // Send a welcome message to trigger the first response from the AI
              const welcomeMessage = {
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [
                    {
                      type: 'input_text',
                      text: 'Hello, I\'d like to practice my language skills with you. Please introduce yourself briefly.'
                    }
                  ]
                },
                client_secret: { value: clientSecret }
              };
              
              try {
                const welcomeResponse = await fetch("https://api.openai.com/v1/realtime", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${clientSecret}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(welcomeMessage),
                });
                
                if (!welcomeResponse.ok) {
                  console.error(`Error sending welcome message: ${welcomeResponse.status}`);
                } else {
                  console.log("Welcome message sent successfully");
                  
                  // Create response
                  const responseCreate = {
                    type: 'response.create',
                    client_secret: { value: clientSecret }
                  };
                  
                  const createResponse = await fetch("https://api.openai.com/v1/realtime", {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${clientSecret}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(responseCreate),
                  });
                  
                  if (!createResponse.ok) {
                    console.error(`Error creating response: ${createResponse.status}`);
                  } else {
                    console.log("Response created successfully");
                  }
                }
              } catch (err) {
                logError(`Failed to send welcome message: ${err}`);
                socket.send(JSON.stringify({ error: `Welcome message failed: ${err.message}` }));
              }
            }
          } catch (err) {
            logError(`Failed to update session: ${err}`);
            socket.send(JSON.stringify({ error: `Failed to update session: ${err.message}` }));
          }
        }
      } catch (error) {
        logError(`Error getting session token: ${error}`);
        socket.send(JSON.stringify({ error: `Error getting session token: ${error.message}` }));
        socket.close(1011, `Error getting session token: ${error.message}`);
      }
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message from client:", message.type);
        
        if (message.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        
        if (message.type === 'input_audio_buffer.append' && message.audio) {
          // Forward audio data to OpenAI using client_secret 
          const secretToUse = message.client_secret?.value || clientSecret;
          if (!secretToUse) {
            console.error("No client secret provided for audio forwarding");
            socket.send(JSON.stringify({ error: "No client secret available" }));
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
            logError(`Error forwarding audio to OpenAI: ${error}`);
            socket.send(JSON.stringify({ error: `Error forwarding audio: ${error}` }));
            return;
          }
          
          // No need to forward response for audio buffer
        } 
        // Handle session finalization with text input or response creation
        else if (message.type === 'conversation.item.create' || message.type === 'response.create') {
          const secretToUse = message.client_secret?.value || clientSecret;
          if (!secretToUse) {
            console.error("No client secret provided for message forwarding");
            socket.send(JSON.stringify({ error: "No client secret available" }));
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
            logError(`Error sending message to OpenAI: ${error}`);
            socket.send(JSON.stringify({ error: `Error sending message: ${error}` }));
            return;
          }
          
          // Process and forward the response data to the client
          const responseData = await response.json();
          console.log(`Received response for ${message.type}:`, responseData.type);
          socket.send(JSON.stringify(responseData));
          
          // Continue monitoring for additional responses from OpenAI after response.create
          if (message.type === 'response.create') {
            console.log("Monitoring for streaming responses after response.create");
          }
        }
      } catch (error) {
        logError(`Error handling websocket message: ${error}`);
        socket.send(JSON.stringify({ error: `Error handling message: ${error.message}` }));
      }
    };

    socket.onerror = (error) => {
      logError(`WebSocket server error: ${error}`);
      try {
        socket.send(JSON.stringify({ error: "WebSocket server error occurred" }));
      } catch (e) {
        console.error("Could not send error message to client:", e);
      }
    };

    socket.onclose = (event) => {
      console.log("Client disconnected:", event.code, event.reason);
    };

    return response;
  } catch (error) {
    logError(`Error handling connection: ${error}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
