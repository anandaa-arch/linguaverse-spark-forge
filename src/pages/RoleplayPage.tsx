
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { AIChatInterface } from "@/components/ui/ai-chat-interface";
import { getRoleplayResponse } from "@/services/mockApi";
import { motion } from "framer-motion";

const scenarioOptions = [
  {
    id: "restaurant",
    name: "Restaurant",
    description: "Practice ordering food and making reservations at a restaurant.",
    initialMessage: "Welcome to our restaurant! How can I help you today?"
  },
  {
    id: "doctor",
    name: "Doctor's Office",
    description: "Practice explaining symptoms and discussing health concerns.",
    initialMessage: "Hello, I'm Dr. Smith. What brings you in today?"
  },
  {
    id: "interview",
    name: "Job Interview",
    description: "Practice answering common interview questions.",
    initialMessage: "Thanks for coming in today. Can you tell me a little about yourself?"
  }
];

const RoleplayPage = () => {
  const [selectedScenario, setSelectedScenario] = useState(scenarioOptions[0]);
  const [conversationContext, setConversationContext] = useState<any>({});

  const handleSendMessage = async (message: string) => {
    try {
      const response = await getRoleplayResponse(
        selectedScenario.id, 
        message, 
        conversationContext
      );
      
      // Update conversation context based on response logic
      // (This is a simple example and can be expanded)
      setConversationContext(prev => ({
        ...prev,
        lastMessage: message
      }));
      
      return response;
    } catch (error) {
      console.error("Error sending message:", error);
      return "Sorry, I'm having trouble responding. Please try again.";
    }
  };

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Conversation Roleplay" 
            subtitle="Practice real-life conversations with our AI language partners"
          />
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-1"
              >
                <div className="varna-card p-6">
                  <h3 className="text-xl font-bold mb-4">Choose a Scenario</h3>
                  <div className="space-y-3">
                    {scenarioOptions.map((scenario) => (
                      <div 
                        key={scenario.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedScenario.id === scenario.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary'
                        }`}
                        onClick={() => setSelectedScenario(scenario)}
                      >
                        <h4 className="font-medium">{scenario.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Try to keep the conversation flowing naturally</li>
                      <li>• Practice different ways to ask the same question</li>
                      <li>• Don't worry about making mistakes - that's how we learn!</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-2"
              >
                <AIChatInterface
                  botName={`AI Partner (${selectedScenario.name} Scenario)`}
                  placeholder="Type your message here..."
                  initialMessage={selectedScenario.initialMessage}
                  onSendMessage={handleSendMessage}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default RoleplayPage;

