
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, Square, AlertTriangle, RotateCw, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'failed' | 'connected'>('idle');
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
      setConnectionStatus('connecting');
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
      const delta = event.delta || "";
      setAiResponse(prev => prev + delta);
    } else if (event.type === 'input_audio_transcript.delta') {
      const delta = event.delta || "";
      setTranscript(prev => prev + delta);
    }
  };

  const startConversation = async () => {
    setIsLoading(true);
    setError(null);
    setTranscript("");
    setAiResponse("");
    setConnectionStatus('connecting');
    
    try {
      if (chatRef.current) {
        chatRef.current.disconnect();
      }
      
      // Create a timeout that will set the connection status to failed after 10 seconds
      const timeoutId = setTimeout(() => {
        if (connectionStatus === 'connecting') {
          setConnectionStatus('failed');
          setError("Connection timed out. Please try again or switch to text chat.");
          setIsLoading(false);
        }
      }, 10000);
      
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(selectedAvatar.specialty);
      
      // Clear the timeout if we successfully connected
      clearTimeout(timeoutId);
      
      setIsConnected(true);
      setConnectionStatus('connected');
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
      setConnectionStatus('failed');
      
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
          setConnectionStatus('idle');
          setTranscript("");
          setAiResponse("");
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

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <div className="flex items-center justify-center text-amber-500">
            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center justify-center text-green-500">
            <Wifi className="mr-2 h-4 w-4" />
            <span>Connected</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center justify-center text-red-500">
            <WifiOff className="mr-2 h-4 w-4" />
            <span>Connection Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionButton = () => {
    if (isConnected) {
      return (
        <Button 
          onClick={endConversation}
          variant="secondary"
          size="lg"
        >
          <Square className="w-5 h-5 mr-2" />
          Stop Recording
        </Button>
      );
    }
    
    return (
      <Button 
        onClick={startConversation}
        className="bg-primary hover:bg-primary/90 text-white"
        size="lg"
        disabled={isLoading || connectionStatus === 'connecting'}
      >
        {isLoading || connectionStatus === 'connecting' ? (
          <>
            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2" />
            Start Speaking
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-muted/30">
          <h3 className="font-medium mb-2">Your Speech:</h3>
          <p className="text-muted-foreground min-h-[80px]">{transcript || "Start speaking to see your transcript..."}</p>
        </div>
        
        <div className="p-4 border rounded-lg bg-muted/30">
          <h3 className="font-medium mb-2">{selectedAvatar.name}'s Response:</h3>
          <p className="text-muted-foreground min-h-[80px]">{aiResponse || "Waiting for AI response..."}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <p className="text-sm">Try switching to text chat or try again later.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center gap-4">
        {renderConnectionStatus()}
        
        <div className="flex justify-center">
          {renderActionButton()}
        </div>

        {connectionStatus === 'failed' && retryCount >= maxRetries && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                onClick={() => {
                  setRetryCount(0);
                  setError(null);
                  startConversation();
                }}
                className="mt-2"
              >
                Try Again
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Reset connection attempts and try again
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;
