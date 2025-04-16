
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Mic, MessageSquare, User, BarChart3 } from "lucide-react";

import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { FeatureCard } from "@/components/ui/feature-card";

const Index = () => {
  useEffect(() => {
    document.title = "Varnanetra - AI-Powered Language Learning";
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-varna-light-purple/30 via-background to-background -z-10"></div>
        
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-6xl font-bold mb-6"
              >
                Master Languages with <span className="varna-gradient-text">AI-Powered</span> Learning
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl mb-8 text-muted-foreground md:pr-12"
              >
                Varnanetra uses advanced AI to provide personalized language learning experiences with immediate feedback on grammar, pronunciation, and conversation skills.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/grammar" className="varna-button-primary">
                  Start Learning Now
                </Link>
                <Link to="/dashboard" className="varna-button-outline">
                  View Dashboard
                </Link>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="varna-glow"
            >
              <div className="rounded-xl overflow-hidden border border-border shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1517216030388-6e92a11a1b55?w=800&auto=format&fit=crop"
                  alt="AI Language Learning" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Powerful Learning Features"
            subtitle="Explore our suite of AI-powered tools designed to accelerate your language learning journey"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Grammar Correction"
              description="Receive instant feedback on grammar mistakes with detailed explanations and improvement suggestions."
              delay={1}
            />
            
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Pronunciation Coaching"
              description="Get real-time pronunciation feedback with visualizations of your speech patterns and areas for improvement."
              delay={2}
            />
            
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Roleplay Scenarios"
              description="Practice real-life conversations with AI that adapts to your skill level and provides contextual guidance."
              delay={3}
            />
            
            <FeatureCard
              icon={<User className="w-6 h-6" />}
              title="Avatar Generation"
              description="Create custom AI language tutors with different personalities and teaching styles to suit your preferences."
              delay={4}
            />
            
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Progress Tracking"
              description="Monitor your learning journey with detailed analytics on accuracy, fluency, and areas for improvement."
              delay={5}
            />
            
            <div className="varna-feature-card bg-gradient-to-br from-varna-purple to-varna-teal text-white">
              <div className="p-3 rounded-full bg-white/20 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold">AI-Powered Learning</h3>
              <p className="text-white/80">Our adaptive learning system adjusts to your pace and learning style for optimal results.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to improve your language skills?</h2>
            <p className="text-xl mb-8 text-muted-foreground">Start your journey with Varnanetra's AI-powered learning platform today.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/grammar" className="varna-button-primary">
                Start Learning Now
              </Link>
              <Link to="/dashboard" className="varna-button-outline">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
