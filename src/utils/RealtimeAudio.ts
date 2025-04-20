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
  private audioContext: AudioContext | null = null;
  private audioQueue: Uint8Array[] = [];
  private isPlaying: boolean = false;
  private pingInterval: number | null = null;

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.audioContext = new AudioContext();
  }

  async init(specialty: string = "general") {
    try {
      this.reconnectAttempts = 0;
      await this.connect(specialty);
      
      // Send a ping every 30 seconds to keep the connection alive
      this.pingInterval = window.setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
      
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
    // Use the exact project ID to avoid env variables
    const wsUrl = `wss://mxdxmxzszgzgmohvemoz.functions.supabase.co/realtime-chat?specialty=${encodeURIComponent(specialty)}`;
    console.log(`Connecting to WebSocket at: ${wsUrl}`);
    
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      
      // Set a shorter timeout (5 seconds)
      this.connectionTimeout = window.setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          if (this.ws) {
            // Only close if we haven't already closed
            if (this.ws.readyState !== WebSocket.CLOSED) {
              this.ws.close();
            }
          }
          reject(new Error("Connection timeout - server might be unavailable"));
        }
      }, 5000);
      
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        window.clearTimeout(this.connectionTimeout!);
        this.connectionTimeout = null;
        resolve();
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message from server:', data.type || 'unknown type');
          
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
          
          // Handle pong to confirm server is alive
          if (data.type === 'pong') {
            console.log('Received pong from server');
            return;
          }
          
          // Handle audio data from the server
          if (data.type === 'response.audio.delta' && data.delta) {
            try {
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              await this.addToAudioQueue(bytes);
            } catch (error) {
              console.error('Error processing audio data:', error);
            }
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
        reject(new Error("WebSocket connection error - server might be unavailable"));
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.connectionReady = false;
        
        if (this.pingInterval !== null) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        
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

  private async addToAudioQueue(audioData: Uint8Array) {
    if (!this.audioContext) return;
    
    this.audioQueue.push(audioData);
    if (!this.isPlaying) {
      await this.playNextAudio();
    }
  }

  private async playNextAudio() {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;

    try {
      // Convert PCM to WAV for browser playback
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNextAudio();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNextAudio(); // Continue with next segment even if current fails
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Convert bytes to 16-bit samples
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    // Create WAV header
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header parameters
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // PCM format code
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    // Combine header and data
    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
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
      
      try {
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
      } catch (error) {
        console.error('Error finalizing session:', error);
      }
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
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.connectionTimeout !== null) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Clear audio
    this.audioQueue = [];
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
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
