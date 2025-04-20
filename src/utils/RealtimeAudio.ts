
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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 1000; // Start with 1 second delay

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(specialty: string = "general") {
    try {
      this.reconnectAttempts = 0;
      await this.connect(specialty);
    } catch (error) {
      console.error("Error initializing chat:", error);
      
      // Try to reconnect automatically with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        this.onMessage({ type: 'connection.reconnect', attempt: this.reconnectAttempts, maxAttempts: this.maxReconnectAttempts });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.init(specialty);
      }
      
      throw error;
    }
  }

  private async connect(specialty: string) {
    // Create WebSocket connection with specialty parameter
    const wsUrl = `wss://mxdxmxzszgzgmohvemoz.functions.supabase.co/realtime-chat?specialty=${encodeURIComponent(specialty)}`;
    console.log(`Connecting to WebSocket at: ${wsUrl}`);
    
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      
      // Set a shorter timeout (5 seconds)
      this.connectionTimeout = window.setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          this.ws?.close();
          reject(new Error("Connection timeout"));
        }
      }, 5000);
      
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message from server:', data);
          
          // Check for errors
          if (data.error) {
            console.error('Server error:', data.error);
            this.onMessage({ error: data.error });
            return;
          }
          
          // Store client secret when we receive the session token
          if (data.client_secret?.value && !this.clientSecret) {
            console.log('Received client secret, starting recorder');
            this.clientSecret = data.client_secret.value;
            this.connectionReady = true;
            
            if (this.connectionTimeout !== null) {
              clearTimeout(this.connectionTimeout);
              this.connectionTimeout = null;
            }
            
            this.startRecorder();
          }
          
          // Forward all messages to the callback handler
          this.onMessage(data);
        } catch (error) {
          console.error('Error handling websocket message:', error);
          this.onMessage({ error: 'Error processing server message' });
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.connectionTimeout !== null) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        reject(new Error("WebSocket connection error"));
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.connectionReady = false;
        if (this.connectionTimeout !== null) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        // Only try to auto-reconnect if the connection was previously established
        if (this.clientSecret && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`Connection closed. Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
          
          this.onMessage({ 
            type: 'connection.reconnect', 
            attempt: this.reconnectAttempts, 
            maxAttempts: this.maxReconnectAttempts 
          });
          
          setTimeout(() => this.connect(specialty), delay);
        }
      };
    });
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
