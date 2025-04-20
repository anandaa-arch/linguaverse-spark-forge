
import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import VoiceInterface from "@/components/VoiceInterface";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { AIChatInterface } from "@/components/ui/ai-chat-interface";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const avatarOptions = [
  { id: "linguabot", name: "LinguaBot", style: "futuristic", specialty: "general" },
  { id: "professor", name: "Professor Lang", style: "academic", specialty: "grammar" },
  { id: "traveler", name: "Traveler", style: "casual", specialty: "pronunciation" }
];

const FuturisticAvatar = ({ pulse = false }) => {
  return (
    <group>
      {/* Simple robot/futuristic avatar */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#7E69AB" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -1.7, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 1.5, 32]} />
        <meshStandardMaterial color="#6E59A5" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color="#0EA5E9" 
          emissive="#0EA5E9" 
          emissiveIntensity={pulse ? 3 : 2} 
        />
      </mesh>
      <mesh position={[-0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color="#0EA5E9" 
          emissive="#0EA5E9" 
          emissiveIntensity={pulse ? 3 : 2} 
        />
      </mesh>
      {/* Circuitry */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[1.2, 0.05, 16, 32, Math.PI * 1.5]} />
        <meshStandardMaterial 
          color="#0EA5E9" 
          emissive="#0EA5E9" 
          emissiveIntensity={pulse ? 2 : 1} 
        />
      </mesh>
    </group>
  );
};

const AvatarPage = () => {
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [useVoice, setUseVoice] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<'operational' | 'degraded' | 'unknown'>('unknown');
  
  // Generate appropriate welcome message based on avatar
  const getWelcomeMessage = () => {
    switch(selectedAvatar.specialty) {
      case "grammar":
        return "Welcome! I'm Professor Lang, your grammar expert. I'll help analyze your grammar and provide detailed corrections. Click 'Start Speaking' when you're ready.";
      case "pronunciation":
        return "Hi there! I'm Traveler, your pronunciation coach. I'll help you improve your pronunciation with practical tips. Click 'Start Speaking' when you're ready to begin.";
      default:
        return "Hello! I'm LinguaBot, your AI language tutor. I can help with various language skills. Click 'Start Speaking' when you're ready to start our conversation.";
    }
  };
  
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Interactive Language Avatar" 
            subtitle="Have a real conversation with your AI language tutor"
          />
          
          <div className="max-w-5xl mx-auto">
            {serviceStatus === 'degraded' && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Voice Service Degraded</AlertTitle>
                <AlertDescription>
                  Our voice service is currently experiencing issues. You may want to use text chat instead, or try again later.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="varna-card p-6"
              >
                <h3 className="text-xl font-bold mb-4">Choose Your Language Tutor</h3>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {avatarOptions.map((avatar) => (
                    <div 
                      key={avatar.id}
                      className={`p-3 border rounded-lg text-center cursor-pointer transition-all duration-200 ${
                        selectedAvatar.id === avatar.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary'
                      }`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-sm font-medium">{avatar.name.charAt(0)}</span>
                      </div>
                      <p className="text-sm font-medium">{avatar.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{avatar.specialty} Expert</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 mb-6">
                  <button 
                    className={`flex-1 py-2 px-4 rounded-lg border transition ${useVoice ? 'bg-primary/10 border-primary' : 'border-border'}`}
                    onClick={() => setUseVoice(true)}
                  >
                    Voice Interaction
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 rounded-lg border transition ${!useVoice ? 'bg-primary/10 border-primary' : 'border-border'}`}
                    onClick={() => setUseVoice(false)}
                  >
                    Text Chat
                  </button>
                </div>
                
                {useVoice ? (
                  <VoiceInterface 
                    selectedAvatar={selectedAvatar}
                    onSpeakingChange={setIsSpeaking}
                  />
                ) : (
                  <AIChatInterface 
                    botName={`${selectedAvatar.name} - ${selectedAvatar.specialty} Expert`}
                    initialMessage={getWelcomeMessage()}
                  />
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="varna-glow"
              >
                <div className="varna-avatar-container">
                  <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />
                    <directionalLight position={[-10, -10, -10]} intensity={0.2} color="#0EA5E9" />
                    <FuturisticAvatar pulse={isSpeaking} />
                    <OrbitControls enableZoom={false} />
                  </Canvas>
                  
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className={`font-medium text-sm bg-background/80 backdrop-blur-sm mx-auto py-1 px-4 rounded-full inline-block ${
                      isSpeaking ? 'text-primary' : ''
                    }`}>
                      {isSpeaking ? `${selectedAvatar.name} is speaking...` : `${selectedAvatar.name} - ${selectedAvatar.specialty} Expert`}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AvatarPage;
