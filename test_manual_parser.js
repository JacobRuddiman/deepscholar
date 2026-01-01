// Quick test for manual parser
// Run with: node test_manual_parser.js

const sampleContent = `# AI Trends in 2026

Question: What are the major AI trends expected in 2026?

Artificial Intelligence continues to evolve at an unprecedented pace. In 2026, we're seeing several key developments that are reshaping the technology landscape.

## Deep Learning Advances

Deep learning models have become more efficient, requiring less computational power while delivering better results. New architectures like Transformers 3.0 have enabled models to understand context better than ever before.

## Multimodal AI Systems

Modern AI systems can now seamlessly integrate text, images, video, and audio processing. This has led to breakthrough applications in healthcare, education, and creative industries.

## Conclusion

The AI landscape in 2026 is characterized by greater efficiency, multimodal capabilities, and ethical considerations. These trends suggest that AI will become even more integrated into our daily lives while maintaining responsible development practices.

## References

- [Nature AI Report 2026](https://nature.com/ai-2026)
- [OpenAI Research](https://openai.com/research)
- [Stanford AI Index](https://stanford.edu/ai-index)
`;

console.log("Testing manual parser with sample content...\n");
console.log("Sample content:");
console.log("=" .repeat(80));
console.log(sampleContent);
console.log("=" .repeat(80));

// Note: Actual parsing would be done by parseManualBriefContent function
// This test file is just for manual verification

console.log("\nExpected parsing results:");
console.log("- Title: AI Trends in 2026");
console.log("- Prompt: What are the major AI trends expected in 2026?");
console.log("- Content: Should include Deep Learning Advances and Multimodal AI Systems sections");
console.log("- Abstract: Should include the Conclusion section");
console.log("- References: Should include the References section");
console.log("- Sources: Should extract 3 URLs");
