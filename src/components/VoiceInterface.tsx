
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, Square, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VoiceInterfaceProps {
  onSpeakingChange: (speaking: boolean) => void;
  selectedAvatar: {
    id: string;
    name: string;
    specialty: string;
  };
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onSpeakingChange, selectedAvatar }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const chatRef = useRef<RealtimeChat | null>(null);
  const maxRetries = 3;

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    if (event.error) {
      setError(event.error);
      toast({
        title: "Error",
        description: event.error,
        variant: "destructive",
      });
      return;
    }
    
    if (event.type === 'connection.reconnect') {
      setRetryCount(event.attempt);
      toast({
        title: "Reconnecting",
        description: `Attempt ${event.attempt}/${event.maxAttempts}`,
      });
      return;
    }
    
    if (event.type === 'response.audio.delta') {
      onSpeakingChange(true);
    } else if (event.type === 'response.audio.done') {
      onSpeakingChange(false);
    } else if (event.type === 'response.audio_transcript.delta') {
      setTranscript(prev => prev + (event.delta || ""));
    }
  };

  const startConversation = async () => {
    setIsLoading(true);
    setError(null);
    setTranscript("");
    
    try {
      if (chatRef.current) {
        chatRef.current.disconnect();
      }
      
      // Pass the specialty to the RealtimeChat constructor
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(selectedAvatar.specialty);
      setIsConnected(true);
      setRetryCount(0);
      
      toast({
        title: "Connected",
        description: `${selectedAvatar.name} is listening...`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start conversation';
      setError(errorMessage);
      setIsConnected(false);
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Only show automatic retry if under max retries
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        toast({
          title: "Retrying",
          description: `Retrying connection (${retryCount + 1}/${maxRetries})...`,
        });
        
        // Retry after a delay with exponential backoff
        const delay = 1000 * Math.pow(2, retryCount);
        setTimeout(() => startConversation(), delay);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = () => {
    if (chatRef.current) {
      // Important: Send a message to trigger response before disconnecting
      chatRef.current.finalizeSession();
      
      // Short delay before disconnecting to allow for response processing
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.disconnect();
          chatRef.current = null;
          setIsConnected(false);
        }
      }, 500);
    }
  };

  useEffect(() => {
    return () => {
      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/30">
        <h3 className="font-medium mb-2">Your Speech Transcript:</h3>
        <p className="text-muted-foreground">{transcript || "Start speaking to see your transcript..."}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        {!isConnected ? (
          <Button 
            onClick={startConversation}
            className="bg-primary hover:bg-primary/90 text-white"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Connecting...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Speaking
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={endConversation}
            variant="secondary"
            size="lg"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;
