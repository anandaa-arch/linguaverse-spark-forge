
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

// Enhanced Grammar correction API
export const correctGrammar = async (text: string): Promise<GrammarResponse> => {
  await delay(1500);
  
  // More comprehensive grammar correction logic
  const corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
    type: string;
  }> = [];

  // Convert to lowercase for easier matching but preserve original for display
  const lowerText = text.toLowerCase();
  let correctedText = text;

  // Subject-verb agreement errors
  if (lowerText.match(/\bi (is|are|am not|was|were)\b/) && !lowerText.includes("i am")) {
    const match = text.match(/\bI (is|are|am not|was|were)\b/i);
    if (match) {
      corrections.push({
        original: match[0],
        corrected: "I am",
        explanation: "Subject-verb agreement: The pronoun 'I' requires the verb 'am' in the present tense.",
        type: 'grammar'
      });
      correctedText = correctedText.replace(match[0], "I am");
    }
  }

  // Wrong pronoun case
  if (lowerText.match(/\bme (am|is|are|go|went|have|has|do|does|did)\b/)) {
    const match = text.match(/\bme (am|is|are|go|went|have|has|do|does|did)\b/i);
    if (match) {
      const verb = match[1];
      corrections.push({
        original: match[0],
        corrected: "I " + verb,
        explanation: "Wrong pronoun case: 'Me' is an object pronoun, but you need the subject pronoun 'I' as the subject of the verb.",
        type: 'grammar'
      });
      correctedText = correctedText.replace(match[0], "I " + verb);
    }
  }
  
  // Third person singular in present tense
  if (lowerText.match(/\b(he|she|it|name) (go|do|make|try|have)\b/) && !lowerText.includes("they")) {
    const matches = text.match(/\b(he|she|it|[A-Z][a-z]+) (go|do|make|try|have)\b/ig) || [];
    matches.forEach(match => {
      const parts = match.split(" ");
      let correctedVerb = parts[1];
      
      if (correctedVerb === "go") correctedVerb = "goes";
      else if (correctedVerb === "do") correctedVerb = "does";
      else if (correctedVerb === "make") correctedVerb = "makes";
      else if (correctedVerb === "try") correctedVerb = "tries";
      else if (correctedVerb === "have") correctedVerb = "has";
      
      corrections.push({
        original: match,
        corrected: `${parts[0]} ${correctedVerb}`,
        explanation: `Third-person singular requires the verb to end with 's' or 'es' in present tense: '${parts[1]}' should be '${correctedVerb}'.`,
        type: 'grammar'
      });
      
      correctedText = correctedText.replace(match, `${parts[0]} ${correctedVerb}`);
    });
  }

  // Incorrect irregular past tense
  const irregularPastMapping: Record<string, string> = {
    "goed": "went",
    "taked": "took", 
    "maked": "made",
    "runned": "ran",
    "bringed": "brought",
    "teached": "taught",
    "buyed": "bought",
    "catched": "caught",
    "fighted": "fought",
    "thinked": "thought"
  };

  Object.keys(irregularPastMapping).forEach(incorrect => {
    if (lowerText.includes(incorrect)) {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'i');
      const match = text.match(regex);
      if (match) {
        corrections.push({
          original: match[0],
          corrected: irregularPastMapping[incorrect],
          explanation: `Irregular past tense: '${match[0]}' should be '${irregularPastMapping[incorrect]}'. This verb has an irregular past tense form.`,
          type: 'grammar'
        });
        correctedText = correctedText.replace(match[0], irregularPastMapping[incorrect]);
      }
    }
  });

  // Common spelling errors
  const spellingErrors: Record<string, string> = {
    "tommorow": "tomorrow",
    "definately": "definitely",
    "alot": "a lot",
    "occured": "occurred",
    "seperate": "separate",
    "wierd": "weird",
    "recieve": "receive",
    "freind": "friend",
    "beleive": "believe"
  };
  
  Object.keys(spellingErrors).forEach(misspelled => {
    if (lowerText.includes(misspelled)) {
      const regex = new RegExp(`\\b${misspelled}\\b`, 'i');
      const match = text.match(regex);
      if (match) {
        corrections.push({
          original: match[0],
          corrected: spellingErrors[misspelled],
          explanation: `Spelling error: '${match[0]}' should be spelled as '${spellingErrors[misspelled]}'.`,
          type: 'spelling'
        });
        correctedText = correctedText.replace(match[0], spellingErrors[misspelled]);
      }
    }
  });

  // Incorrect articles
  const vowelSounds = ['a', 'e', 'i', 'o', 'u'];
  const articleMatches = text.match(/\b(a|an) ([a-zA-Z]+)\b/g) || [];
  
  articleMatches.forEach(match => {
    const parts = match.split(" ");
    const article = parts[0].toLowerCase();
    const nextWord = parts[1];
    const startsWithVowelSound = vowelSounds.includes(nextWord[0].toLowerCase());
    
    if ((article === "a" && startsWithVowelSound) || (article === "an" && !startsWithVowelSound)) {
      const correctArticle = startsWithVowelSound ? "an" : "a";
      corrections.push({
        original: match,
        corrected: `${correctArticle} ${nextWord}`,
        explanation: `Article usage: Use '${correctArticle}' before words that start with ${startsWithVowelSound ? 'vowel sounds' : 'consonant sounds'}.`,
        type: 'grammar'
      });
      correctedText = correctedText.replace(match, `${correctArticle} ${nextWord}`);
    }
  });

  // Double negatives
  if (lowerText.match(/\b(don't|do not|doesn't|does not|didn't|did not|can't|cannot|won't|will not).*\b(no|none|nothing|nowhere|nobody|never|neither)\b/) ||
      lowerText.match(/\b(no|none|nothing|nowhere|nobody|never|neither).*\b(don't|do not|doesn't|does not|didn't|did not|can't|cannot|won't|will not)\b/)) {
    
    corrections.push({
      original: text,
      corrected: "Sentence contains a double negative",
      explanation: "Double negative: In standard English, two negative words create a positive meaning or cancel each other out. Rewrite using only one negative.",
      type: 'grammar'
    });
    // We'll let the user fix this one manually as it requires more context
  }

  // Specific cases from the screenshot
  if (lowerText.includes("me go to the store yesterday")) {
    corrections.push({
      original: "Me go to the store yesterday",
      corrected: "I went to the store yesterday",
      explanation: "1. 'Me' should be 'I' (subject pronoun instead of object pronoun). 2. 'Go' should be 'went' (past tense of 'go').",
      type: 'grammar'
    });
    correctedText = correctedText.replace(/me go to the store yesterday/i, "I went to the store yesterday");
  }
  
  if (lowerText.includes("i has three cats")) {
    corrections.push({
      original: "I has three cats",
      corrected: "I have three cats",
      explanation: "Subject-verb agreement: First-person singular subject 'I' requires the verb form 'have', not 'has' (which is used with third-person singular subjects).",
      type: 'grammar'
    });
    correctedText = correctedText.replace(/i has three cats/i, "I have three cats");
  }

  return {
    correctedText: correctedText,
    corrections: corrections
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
