
import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { correctGrammar, GrammarResponse } from "@/services/mockApi";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const GrammarPage = () => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GrammarResponse | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await correctGrammar(text);
      setResult(response);
      
      if (response.corrections.length === 0) {
        toast({
          title: "Perfect Grammar!",
          description: "No issues found in your text. Great job!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error correcting grammar:", error);
      toast({
        title: "Error",
        description: "Failed to analyze text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExampleClick = (exampleText: string) => {
    setText(exampleText);
    // Automatically analyze when an example is clicked
    const form = document.getElementById("grammar-form");
    if (form) {
      setTimeout(() => {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }, 100);
    }
  };

  const examples = [
    "Me go to the store yesterday.",
    "I has three cats in my house.",
    "She dont like ice cream.",
    "They was playing in the park.",
    "He have a big car.",
    "I runned to the bus stop.",
    "She goed to the movies last night."
  ];

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Grammar Correction" 
            subtitle="Get instant feedback on your writing with our AI-powered grammar checker"
          />
          
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="varna-card p-6"
            >
              <form id="grammar-form" onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="text" className="block text-sm font-medium mb-2">
                    Enter your text
                  </label>
                  <Textarea
                    id="text"
                    rows={6}
                    className="w-full p-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Type or paste your text here to check for grammar issues..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isAnalyzing || !text.trim()}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <span>Check Grammar</span>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
            
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 varna-card p-6"
              >
                <h3 className="text-xl font-bold mb-4">Analysis Results</h3>
                
                {result.corrections.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-6 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <span className="font-medium text-destructive">Grammar issues found</span>
                    </div>
                  
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Corrected Text:</h4>
                      <p className="p-4 bg-muted/50 rounded-md border border-border">{result.correctedText}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Corrections Explained:</h4>
                      <div className="space-y-4">
                        {result.corrections.map((correction, index) => (
                          <div key={index} className="p-4 border border-border rounded-lg bg-card shadow-sm">
                            <div className="flex items-start gap-2 mb-3">
                              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                              <div>
                                <span className="font-medium text-destructive line-through">{correction.original}</span>
                                {" → "}
                                <span className="font-medium text-primary">{correction.corrected}</span>
                              </div>
                            </div>
                            <div className="pl-7">
                              <p className="text-sm text-muted-foreground">{correction.explanation}</p>
                              <span className="text-xs px-2 py-1 mt-2 inline-block rounded-full bg-muted/50 text-muted-foreground capitalize">{correction.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-4 rounded-md bg-success/10 border border-success/20">
                    <Check className="w-5 h-5 text-success" />
                    <span className="font-medium text-success">No grammar issues found. Great job!</span>
                  </div>
                )}
              </motion.div>
            )}
            
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">Practice Examples</h3>
              <p className="text-muted-foreground mb-4">Click on any example to see how our grammar checker works:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examples.map((example, index) => (
                  <button 
                    key={index}
                    className="p-4 text-left border border-border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors duration-200"
                    onClick={() => handleExampleClick(example)}
                  >
                    <p className="font-medium">Example {index + 1}</p>
                    <p className="text-sm text-muted-foreground">{example}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GrammarPage;
