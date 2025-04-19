
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, Square } from 'lucide-react';
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
  const chatRef = useRef<RealtimeChat | null>(null);

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
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);
      
      toast({
        title: "Connected",
        description: `${selectedAvatar.name} is listening...`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start conversation');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
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
        chatRef.current?.disconnect();
        chatRef.current = null;
        setIsConnected(false);
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
          <AlertTitle>Error</AlertTitle>
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
