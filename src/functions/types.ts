// Define the types for the brief extractor

export type BriefSource = {
  title: string; // string type ensures title is always text
  url: string; // string type ensures URL is always text
  author?: string; // optional string with ? modifier allows this field to be undefined
  date?: string; // optional string with ? modifier allows this field to be undefined
};

export type ConversationTurn = {
  index: number;
  userMessage: string;
  assistantMessage: string;
  timestamp?: Date;
};

export type BriefData = {
  title: string;
  response: string;  // Changed from 'content' to match database schema
  abstract: string;
  sources: BriefSource[];
  thinking?: string; // Optional thinking
  prompt?: string;   // Add this new field
  model: "openai" | "perplexity" | "anthropic" | "other";
  rawHtml?: string;
  references?: string;

  // Quality metrics (added in Phase 2)
  confidence?: 'high' | 'medium' | 'low';
  warnings?: string[];

  // Conversation support (Phase 3)
  conversationTurns?: ConversationTurn[];
  selectedTurnIndex?: number;

  // Category tagging
  categoryIds?: string[];
};
