// Define the types for the brief extractor

export type BriefSource = {
  title: string; // string type ensures title is always text
  url: string; // string type ensures URL is always text
  author?: string; // optional string with ? modifier allows this field to be undefined
  date?: string; // optional string with ? modifier allows this field to be undefined
};

export type BriefData = {
  title: string;
  content: string;
  abstract: string;
  sources: BriefSource[];
  thinking?: string; // Optional thinking
  prompt?: string;   // Add this new field
  model: "openai" | "perplexity" | "anthropic" | "other";
  rawHtml?: string;
  references?: string;
};