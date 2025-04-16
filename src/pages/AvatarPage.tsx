
import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { generateAvatar } from "@/services/mockApi";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const avatarOptions = [
  { id: "linguabot", name: "LinguaBot", style: "futuristic" },
  { id: "professor", name: "Professor Lang", style: "academic" },
  { id: "traveler", name: "Traveler", style: "casual" }
];

const styleOptions = [
  { id: "futuristic", name: "Futuristic" },
  { id: "academic", name: "Academic" },
  { id: "casual", name: "Casual" }
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
  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const handleGenerateAvatar = async () => {
    setIsGenerating(true);
    
    try {
      const url = await generateAvatar(selectedAvatar.id, selectedStyle.id);
      setAvatarUrl(url);
    } catch (error) {
      console.error("Error generating avatar:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Avatar Generation" 
            subtitle="Create custom AI language tutors with different personalities"
          />
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="varna-card p-6"
              >
                <h3 className="text-xl font-bold mb-4">Customize Your Avatar</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Avatar Character
                  </label>
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
                        <p className="text-sm">{avatar.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Visual Style
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {styleOptions.map((style) => (
                      <div 
                        key={style.id}
                        className={`p-3 border rounded-lg text-center cursor-pointer transition-all duration-200 ${
                          selectedStyle.id === style.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary'
                        }`}
                        onClick={() => setSelectedStyle(style)}
                      >
                        <p className="text-sm">{style.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleGenerateAvatar}
                  disabled={isGenerating}
                  className="varna-button-primary w-full"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent border-primary-foreground rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <span>Generate Avatar</span>
                  )}
                </button>
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
                      {selectedAvatar.name} - {selectedStyle.name} Style
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">Avatar Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-1">Custom Teaching Style</h4>
                  <p className="text-sm text-muted-foreground">Each avatar adapts its teaching approach to suit your learning preferences.</p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-1">Personality Variations</h4>
                  <p className="text-sm text-muted-foreground">From motivational to detail-oriented, choose the personality that works for you.</p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-1">Visual Customization</h4>
                  <p className="text-sm text-muted-foreground">Personalize your language tutor with different visual styles.</p>
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
