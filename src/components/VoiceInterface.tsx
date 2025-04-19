
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, Square } from 'lucide-react';

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
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    if (event.type === 'response.audio.delta') {
      onSpeakingChange(true);
    } else if (event.type === 'response.audio.done') {
      onSpeakingChange(false);
    } else if (event.type === 'response.audio_transcript.delta') {
      setTranscript(prev => prev + event.delta);
    }
  };

  const startConversation = async () => {
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    onSpeakingChange(false);
    setTranscript("");
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/30">
        <h3 className="font-medium mb-2">Your Speech Transcript:</h3>
        <p className="text-muted-foreground">{transcript || "Start speaking to see your transcript..."}</p>
      </div>

      <div className="flex justify-center">
        {!isConnected ? (
          <Button 
            onClick={startConversation}
            className="bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Speaking
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
