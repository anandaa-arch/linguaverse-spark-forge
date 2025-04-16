
import { useState, useRef, useEffect } from "react";
import { Send, Mic, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface AIChatInterfaceProps {
  placeholder?: string;
  botName?: string;
  onSendMessage?: (message: string) => Promise<string>;
  className?: string;
  initialMessage?: string;
}

export function AIChatInterface({
  placeholder = "Type your message here...",
  botName = "Varnanetra AI",
  onSendMessage,
  className,
  initialMessage
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessage ? [
    {
      id: "initial",
      text: initialMessage,
      sender: "ai",
      timestamp: new Date()
    }
  ] : []);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Simulate API call
      let responseText = "I'm sorry, I'm currently in demo mode and can't process that request.";
      
      if (onSendMessage) {
        responseText = await onSendMessage(inputValue);
      } else {
        // Mock responses for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (inputValue.toLowerCase().includes("hello") || inputValue.toLowerCase().includes("hi")) {
          responseText = "Hello! How can I help you with your language learning today?";
        } else if (inputValue.toLowerCase().includes("language")) {
          responseText = "I can help you learn various languages including English, Spanish, French, German, and many more!";
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "ai",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error processing your request. Please try again.",
        sender: "ai",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-[600px] rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      {/* Chat header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-varna-purple to-varna-teal rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <h3 className="font-medium">{botName}</h3>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 break-words",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none"
                )}
              >
                {message.text}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted text-foreground rounded-tl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 rounded-full text-white bg-primary hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
