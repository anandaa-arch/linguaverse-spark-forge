
import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { AIChatInterface } from "@/components/ui/ai-chat-interface";
import { correctGrammar } from "@/services/mockApi";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const avatarOptions = [
  { id: "linguabot", name: "LinguaBot", style: "futuristic", specialty: "general" },
  { id: "professor", name: "Professor Lang", style: "academic", specialty: "grammar" },
  { id: "traveler", name: "Traveler", style: "casual", specialty: "pronunciation" }
];

const FuturisticAvatar = () => {
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
        <meshStandardMaterial color="#0EA5E9" emissive="#0EA5E9" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#0EA5E9" emissive="#0EA5E9" emissiveIntensity={2} />
      </mesh>
      {/* Circuitry */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[1.2, 0.05, 16, 32, Math.PI * 1.5]} />
        <meshStandardMaterial color="#0EA5E9" emissive="#0EA5E9" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

const AvatarPage = () => {
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Function to handle AI responses based on avatar specialty
  const handleSendMessage = async (message: string): Promise<string> => {
    setIsTyping(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate response based on avatar specialty
      if (selectedAvatar.specialty === "grammar") {
        const grammarResponse = await correctGrammar(message);
        
        if (grammarResponse.corrections.length > 0) {
          let response = "I found some grammar issues:\n\n";
          response += `Corrected: "${grammarResponse.correctedText}"\n\n`;
          
          grammarResponse.corrections.forEach(correction => {
            response += `• "${correction.original}" → "${correction.corrected}": ${correction.explanation}\n`;
          });
          
          return response;
        } else {
          return "Your grammar looks perfect! Well done.";
        }
      } 
      else if (selectedAvatar.specialty === "pronunciation") {
        return "To practice pronunciation, I recommend saying this phrase aloud: \"The quick brown fox jumps over the lazy dog.\" Pay attention to your 'th' sounds and word linking.";
      }
      else {
        // Handle general language learning questions
        if (message.toLowerCase().includes("learn") || message.toLowerCase().includes("study")) {
          return "I recommend spending 20-30 minutes daily on focused practice. What specific area would you like to improve?";
        } else if (message.toLowerCase().includes("vocabulary")) {
          return "Building vocabulary works best with spaced repetition. Try learning 5-10 new words daily and review them regularly.";
        } else if (message.toLowerCase().includes("grammar")) {
          return "For grammar practice, I suggest switching to Professor Lang, our grammar specialist!";
        } else if (message.toLowerCase().includes("pronunciation")) {
          return "For pronunciation practice, I suggest switching to Traveler, our pronunciation expert!";
        } else {
          return "I'm here to help with your language learning journey! Feel free to ask about grammar, pronunciation, vocabulary, or learning strategies.";
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      return "I'm sorry, I couldn't process your request. Please try again.";
    } finally {
      setIsTyping(false);
    }
  };

  const getInitialMessage = () => {
    switch(selectedAvatar.specialty) {
      case "grammar":
        return "Welcome! I'm Professor Lang, your grammar expert. Send me any text, and I'll check it for grammar issues and provide corrections.";
      case "pronunciation":
        return "Hello! I'm Traveler, your pronunciation guide. I can help you practice sounds that are challenging for language learners.";
      default:
        return "Welcome to your AI language tutor! I'm here to help you with your language learning journey. What would you like to work on today?";
    }
  };

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Interactive Language Avatar" 
            subtitle="Chat with your AI language tutor for real-time assistance"
          />
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="varna-card p-6"
              >
                <h3 className="text-xl font-bold mb-4">Choose Your Language Tutor</h3>
                
                <div className="mb-6">
                  <div className="grid grid-cols-3 gap-3">
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
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-1">Current Avatar: {selectedAvatar.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAvatar.specialty === "grammar" && "Specialized in grammar corrections and writing improvement"}
                      {selectedAvatar.specialty === "pronunciation" && "Helps with accent reduction and speech clarity"}
                      {selectedAvatar.specialty === "general" && "A versatile language learning assistant"}
                    </p>
                  </div>
                </div>
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
                    <FuturisticAvatar />
                    <OrbitControls enableZoom={false} />
                  </Canvas>
                  
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="font-medium text-sm bg-background/80 backdrop-blur-sm mx-auto py-1 px-4 rounded-full inline-block">
                      {selectedAvatar.name} - {selectedAvatar.specialty.charAt(0).toUpperCase() + selectedAvatar.specialty.slice(1)} Expert
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-8">
              <AIChatInterface 
                botName={`${selectedAvatar.name} (${selectedAvatar.specialty.charAt(0).toUpperCase() + selectedAvatar.specialty.slice(1)} Tutor)`}
                onSendMessage={handleSendMessage}
                placeholder="Ask for help with language learning..."
                initialMessage={getInitialMessage()}
              />
            </div>
            
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">How To Use Your Language Tutor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-1">Grammar Help</h4>
                  <p className="text-sm text-muted-foreground">Send text to Professor Lang for instant grammar corrections and explanations.</p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-1">Pronunciation Practice</h4>
                  <p className="text-sm text-muted-foreground">Chat with Traveler to get tips for improving your pronunciation and accent.</p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-1">Learning Strategies</h4>
                  <p className="text-sm text-muted-foreground">Ask LinguaBot for personalized language learning advice and resources.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AvatarPage;
