// Mock API service for simulating backend interactions
import { delay } from "@/lib/utils";

// Sample data for the dashboard
export const userProgressData = [
  { day: "Mon", score: 65 },
  { day: "Tue", score: 75 },
  { day: "Wed", score: 68 },
  { day: "Thu", score: 82 },
  { day: "Fri", score: 85 },
  { day: "Sat", score: 90 },
  { day: "Sun", score: 88 },
];

export const userStats = {
  lessonsCompleted: 24,
  currentStreak: 7,
  totalTime: "12h 30m",
  accuracy: 86,
  fluency: 78,
  vocabulary: 342,
};

export interface GrammarResponse {
  correctedText: string;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
    type: string;
  }>;
}

export interface PronunciationResponse {
  score: number;
  feedback: string;
  areas: {
    rhythm: number;
    intonation: number;
    accuracy: number;
  };
}

export const initMockApi = () => {
  console.log("Mock API initialized");
};

// Grammar correction API
export const correctGrammar = async (text: string): Promise<GrammarResponse> => {
  await delay(1500);
  
  // Example corrections
  if (text.toLowerCase().includes("me go")) {
    return {
      correctedText: text.replace("me go", "I go"),
      corrections: [
        {
          original: "me go",
          corrected: "I go",
          explanation: "Use the subject pronoun 'I' instead of 'me' when it's the subject of a sentence.",
          type: "grammar"
        }
      ]
    };
  }
  
  if (text.toLowerCase().includes("i has")) {
    return {
      correctedText: text.replace("i has", "I have"),
      corrections: [
        {
          original: "i has",
          corrected: "I have",
          explanation: "The verb 'have' should be used with the subject 'I', not 'has'.",
          type: "grammar"
        }
      ]
    };
  }
  
  return {
    correctedText: text,
    corrections: []
  };
};

// Pronunciation analysis API
export const analyzePronunciation = async (audioBlob: Blob): Promise<PronunciationResponse> => {
  await delay(2000);
  
  return {
    score: 85,
    feedback: "Good pronunciation overall. Work on word stress and linking sounds between words.",
    areas: {
      rhythm: 80,
      intonation: 85,
      accuracy: 90
    }
  };
};

// Roleplay API
export const getRoleplayResponse = async (scenario: string, message: string, conversationContext?: any): Promise<string> => {
  await delay(1000);
  
  if (scenario === "restaurant") {
    // Convert message to lowercase for easier matching
    const lowerMessage = message.toLowerCase().trim();

    // Track conversation context (this would typically be managed by the frontend)
    if (lowerMessage.includes("burger") || lowerMessage.includes("food")) {
      return "Great choice! Would you like a classic burger or one with extra toppings? We also have fries and a drink to go with it.";
    }

    if (lowerMessage.includes("classic burger")) {
      return "Perfect! One classic burger coming up. Would you like fries or a drink with that?";
    }

    if (lowerMessage.includes("fries") || lowerMessage.includes("drink")) {
      return "Excellent! Would you like to choose from our beverage menu or select a side? We have soft drinks, milkshakes, and a variety of sides.";
    }

    if (lowerMessage.includes("beverage") || lowerMessage.includes("menu")) {
      return "Here are our drink options: Coca-Cola, Sprite, Iced Tea, Milkshake (Chocolate, Vanilla, or Strawberry), or Water. What would you like?";
    }

    if (lowerMessage.includes("order")) {
      return "I'd be happy to take your order. What would you like to have today?";
    }

    // Fallback for unclear messages
    return "I'm sorry, could you please clarify your request? I'm here to help you order delicious food.";
  }
  
  if (scenario === "doctor") {
    if (message.toLowerCase().includes("appointment")) {
      return "Yes, we can schedule an appointment for you. When would be a convenient time?";
    }
    
    if (message.toLowerCase().includes("symptom") || message.toLowerCase().includes("pain")) {
      return "I understand you're not feeling well. Could you describe your symptoms in more detail so I can better assist you?";
    }
    
    return "Hello, I'm Dr. Smith. What brings you in today?";
  }
  
  return "I'm here to help you practice your conversation skills. What would you like to talk about?";
};

// Avatar API
export const generateAvatar = async (character: string, style: string): Promise<string> => {
  await delay(2000);
  
  // In a real implementation, this would return a URL or base64 data of the generated avatar
  return "avatar_placeholder.png";
};

// Dashboard API
export const getUserProgress = async () => {
  await delay(800);
  return userProgressData;
};

export const getUserStats = async () => {
  await delay(600);
  return userStats;
};
