
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { analyzePronunciation, PronunciationResponse } from "@/services/mockApi";
import { Mic, Square, Play, Volume2 } from "lucide-react";

const PronunciationPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PronunciationResponse | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState("The quick brown fox jumps over the lazy dog.");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        // Automatically analyze after recording
        handleAnalyze(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please ensure you have given permission.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const handleAnalyze = async (blob: Blob) => {
    setIsAnalyzing(true);
    
    try {
      const response = await analyzePronunciation(blob);
      setResult(response);
    } catch (error) {
      console.error("Error analyzing pronunciation:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const phrases = [
    "The quick brown fox jumps over the lazy dog.",
    "She sells seashells by the seashore.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    "Peter Piper picked a peck of pickled peppers.",
    "I scream, you scream, we all scream for ice cream.",
  ];

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Pronunciation Coaching" 
            subtitle="Improve your accent with real-time AI feedback on your pronunciation"
          />
          
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="varna-card p-6"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">Practice Phrases</h3>
                <div className="space-y-3">
                  {phrases.map((phrase, index) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedPhrase === phrase 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary'
                      }`}
                      onClick={() => setSelectedPhrase(phrase)}
                    >
                      <p>{phrase}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Selected Phrase:</h4>
                <p className="text-xl">{selectedPhrase}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`varna-button flex items-center gap-2 ${
                    isRecording 
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-5 h-5" />
                      <span>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Start Recording</span>
                    </>
                  )}
                </button>
                
                {audioUrl && (
                  <div className="flex items-center gap-2">
                    <audio src={audioUrl} controls className="w-full" />
                  </div>
                )}
              </div>
            </motion.div>
            
            {isAnalyzing && (
              <div className="mt-8 text-center p-6">
                <div className="inline-block w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-lg">Analyzing your pronunciation...</p>
              </div>
            )}
            
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 varna-card p-6"
              >
                <h3 className="text-xl font-bold mb-4">Pronunciation Analysis</h3>
                
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-4">
                  <span className="text-lg font-medium">Overall Score</span>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold varna-gradient-text">{result.score}</span>
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg mb-6">
                  <h4 className="font-medium mb-2">Feedback:</h4>
                  <p>{result.feedback}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Breakdown by Area:</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Rhythm</span>
                        <span className="font-medium">{result.areas.rhythm}/100</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full">
                        <div 
                          className="h-full bg-gradient-to-r from-varna-purple to-varna-teal rounded-full" 
                          style={{ width: `${result.areas.rhythm}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Intonation</span>
                        <span className="font-medium">{result.areas.intonation}/100</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full">
                        <div 
                          className="h-full bg-gradient-to-r from-varna-purple to-varna-teal rounded-full" 
                          style={{ width: `${result.areas.intonation}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Accuracy</span>
                        <span className="font-medium">{result.areas.accuracy}/100</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full">
                        <div 
                          className="h-full bg-gradient-to-r from-varna-purple to-varna-teal rounded-full" 
                          style={{ width: `${result.areas.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">Tips for Better Pronunciation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-5 h-5 text-primary" />
                    <h4 className="font-medium">Listen and Repeat</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Listen to native speakers and practice imitating their rhythm and intonation.</p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-5 h-5 text-primary" />
                    <h4 className="font-medium">Record Yourself</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Record your speech and compare it with native pronunciations to identify differences.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PronunciationPage;
