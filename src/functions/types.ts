// Define the types for the brief extractor

export type BriefSource = {
  title: string; // string type ensures title is always text
  url: string; // string type ensures URL is always text
  author?: string; // optional string with ? modifier allows this field to be undefined
  date?: string; // optional string with ? modifier allows this field to be undefined
};

export type BriefData = {
  title: string; // string type ensures title is always text
  content: string; // string type ensures content is always text
  abstract: string; // string type ensures abstract is always text
  sources: BriefSource[]; // Array of BriefSource objects to store all sources
  thinking: string; // string type ensures thinking notes are always text
  model: "openai" | "perplexity" | "anthropic" | "other"; // Union type restricts model to only these specific string values (lowercase to match database)
  rawHtml?: string; // optional string with ? modifier allows this field to be undefined
  references?: string; // optional string with ? modifier allows this field to be undefined
};
