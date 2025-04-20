
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class RealtimeChat {
  private ws: WebSocket | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private clientSecret: string | null = null;
  private connectionReady: boolean = false;
  private connectionTimeout: number | null = null;

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(specialty: string = "general") {
    try {
      // Create WebSocket connection with specialty parameter
      const wsUrl = `wss://mxdxmxzszgzgmohvemoz.functions.supabase.co/realtime-chat?specialty=${encodeURIComponent(specialty)}`;
      console.log(`Connecting to WebSocket at: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message from server:', data);
          
          // Check for errors
          if (data.error) {
            console.error('Server error:', data.error);
            throw new Error(data.error);
          }
          
          // Store client secret when we receive the session token
          if (data.client_secret?.value && !this.clientSecret) {
            console.log('Received client secret, starting recorder');
            this.clientSecret = data.client_secret.value;
            this.connectionReady = true;
            this.startRecorder();
            
            // Clear timeout since connection is successful
            if (this.connectionTimeout !== null) {
              clearTimeout(this.connectionTimeout);
              this.connectionTimeout = null;
            }
          }
          
          // Forward all messages to the callback handler
          this.onMessage(data);
        } catch (error) {
          console.error('Error handling websocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.connectionReady = false;
      };

      // Set a timeout to reject the promise if connection isn't established
      return new Promise<void>((resolve, reject) => {
        // Set a shorter timeout (8 seconds)
        this.connectionTimeout = window.setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 8000);
        
        const checkInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            if (this.connectionTimeout !== null) {
              clearTimeout(this.connectionTimeout);
              this.connectionTimeout = null;
            }
            resolve();
          } else if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING) {
            clearInterval(checkInterval);
            if (this.connectionTimeout !== null) {
              clearTimeout(this.connectionTimeout);
              this.connectionTimeout = null;
            }
            reject(new Error("Connection failed"));
          }
        }, 100);
      });

    } catch (error) {
      console.error("Error initializing chat:", error);
      throw error;
    }
  }

  private async startRecorder() {
    // Start recording audio once we have the client secret
    this.recorder = new AudioRecorder((audioData) => {
      if (this.ws?.readyState === WebSocket.OPEN && this.connectionReady) {
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: this.encodeAudioData(audioData),
          client_secret: { value: this.clientSecret }
        }));
      }
    });
    await this.recorder.start();
  }

  // Add this new method to finalize the session when user stops recording
  finalizeSession() {
    if (this.ws?.readyState === WebSocket.OPEN && this.connectionReady) {
      console.log("Finalizing session, triggering response.create");
      
      // Create a conversation item to prompt the AI to respond
      this.ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Please analyze what I said and respond accordingly.'
            }
          ]
        },
        client_secret: { value: this.clientSecret }
      }));
      
      // Explicitly request a response
      this.ws.send(JSON.stringify({
        type: 'response.create',
        client_secret: { value: this.clientSecret }
      }));
    }
  }

  private encodeAudioData(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  disconnect() {
    if (this.connectionTimeout !== null) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.recorder?.stop();
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.clientSecret = null;
    this.connectionReady = false;
  }
}
