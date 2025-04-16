
import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { correctGrammar, GrammarResponse } from "@/services/mockApi";
import { Check, AlertCircle } from "lucide-react";

const GrammarPage = () => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GrammarResponse | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await correctGrammar(text);
      setResult(response);
    } catch (error) {
      console.error("Error correcting grammar:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="text" className="block text-sm font-medium mb-2">
                    Enter your text
                  </label>
                  <textarea
                    id="text"
                    rows={6}
                    className="w-full p-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Type or paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAnalyzing || !text.trim()}
                    className="varna-button-primary flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-primary-foreground rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <span>Check Grammar</span>
                    )}
                  </button>
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
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Corrected Text:</h4>
                      <p className="p-3 bg-muted/50 rounded-md">{result.correctedText}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Corrections:</h4>
                      <div className="space-y-4">
                        {result.corrections.map((correction, index) => (
                          <div key={index} className="p-4 border border-border rounded-lg bg-muted/30">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                              <div>
                                <span className="font-medium line-through">{correction.original}</span>
                                {" → "}
                                <span className="font-medium text-primary">{correction.corrected}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{correction.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span>No grammar issues found. Great job!</span>
                  </div>
                )}
              </motion.div>
            )}
            
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">Practice Examples</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="p-4 border border-border rounded-lg hover:border-primary cursor-pointer transition-colors duration-200"
                  onClick={() => setText("Me go to the store yesterday.")}
                >
                  <p className="font-medium">Example 1</p>
                  <p className="text-sm text-muted-foreground">Me go to the store yesterday.</p>
                </div>
                
                <div 
                  className="p-4 border border-border rounded-lg hover:border-primary cursor-pointer transition-colors duration-200"
                  onClick={() => setText("I has three cats in my house.")}
                >
                  <p className="font-medium">Example 2</p>
                  <p className="text-sm text-muted-foreground">I has three cats in my house.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GrammarPage;
