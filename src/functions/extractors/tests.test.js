import { extractFromChatGPTHtml } =require('./chatgpt';

// Mock the console.error to prevent test output pollution
console.error = jest.fn();
console.warn = jest.fn();

// Note: This test suite assumes that some functionality in html-extractor.ts 
// is not yet implemented or has naming issues

describe('extractFromChatGPTHtml', () => {
  // Test 1: Standard case with complex content structure
  test('extracts content from a complex ChatGPT conversation with multiple sections', async () => {
    const html = `
      <html>
        <head><title>Neural Networks in Healthcare - ChatGPT</title></head>
        <body>
          <div class="markdown">
            <h1>Neural Networks in Healthcare</h1>
            <p>Artificial neural networks have transformed medical diagnostics in recent years.</p>
            <h2>Key Applications</h2>
            <p>Some important applications include:</p>
            <ul>
              <li>Medical image recognition for tumor detection</li>
              <li>Patient outcome prediction based on clinical data</li>
              <li>Drug discovery and development</li>
            </ul>
            <h2>Technical Challenges</h2>
            <p>Despite advances, several challenges remain:</p>
            <ul>
              <li>Limited availability of high-quality medical datasets</li>
              <li>Interpretability issues with black-box models</li>
              <li>Regulatory hurdles for clinical deployment</li>
            </ul>
            <h2>Conclusion</h2>
            <p>Neural networks offer tremendous potential for improving healthcare outcomes, 
            but require careful validation and transparent reporting of limitations.</p>
            <p>Ongoing research is focused on developing more explainable AI systems that can 
            gain the trust of healthcare professionals.</p>
            <h3>References</h3>
            <p>1. Smith et al. (2023). "Deep Learning in Medical Imaging." Medical AI Journal, 45(2), 112-134.</p>
            <p>2. <a href="https://www.nature.com/articles/s41591-020-0850-3">Nature Medicine: Clinical applications of deep learning</a></p>
            <p>3. <a href="https://www.biorxiv.org/content/10.1101/2023.01.15.123456v1">BioRxiv: Neural networks for protein folding prediction</a></p>
          </div>
        </body>
      </html>
    `;

    const result = await extractFromChatGPTHtml(html);

    // Test correct extraction of main components
    expect(result.title).toBe('Neural Networks in Healthcare - ChatGPT');
    expect(result.content).toContain('Artificial neural networks have transformed medical diagnostics');
    expect(result.content).toContain('Key Applications');
    expect(result.content).toContain('Technical Challenges');
    
    // Test abstract extraction
    expect(result.abstract).toContain('tremendous potential for improving healthcare outcomes');
    expect(result.abstract).toContain('explainable AI systems');
    
    // Test reference extraction and formatting
    expect(result.references).toContain('• 1. Smith et al.');
    expect(result.references).toContain('• 2.');
    expect(result.references).toContain('• 3.');
    
    // Test source extraction
    expect(result.sources).toHaveLength(2);
    expect(result.sources[0].url).toBe('https://www.nature.com/articles/s41591-020-0850-3');
    expect(result.sources[0].title).toBe('Nature Medicine: Clinical applications of deep learning');
    expect(result.sources[1].url).toBe('https://www.biorxiv.org/content/10.1101/2023.01.15.123456v1');
  });

  // Test 2: Has a naming issue - the HTML uses "Executive Summary" instead of "Conclusion" or "Abstract",
  // which our extractor might not recognize as an abstract section
  test('recognizes alternative names for the abstract/conclusion section', async () => {
    const html = `
      <html>
        <head><title>Research Report - ChatGPT</title></head>
        <body>
          <div class="deep-research-result">
            <h1>Advanced Materials for Battery Technology</h1>
            <p>This report examines recent developments in materials science relevant to battery technology.</p>
            <p>Innovations in electrode materials have shown significant promise for improving energy density.</p>
            
            <h2>Key Findings</h2>
            <ul>
              <li>Silicon-carbon composite anodes demonstrate up to 40% higher capacity</li>
              <li>Solid-state electrolytes show improved safety characteristics</li>
              <li>Novel cathode materials extend cycle life by approximately 30%</li>
            </ul>
            
            <h2>Executive Summary</h2>
            <p>Battery technology continues to evolve rapidly, with new materials enabling higher energy density,
            improved safety, and longer lifespans compared to conventional lithium-ion designs.</p>
            <p>While challenges remain in scaling production and reducing costs, the trajectory suggests
            commercial viability for several of these technologies within the next 3-5 years.</p>
            
            <h2>References</h2>
            <p>1. Zhang et al. (2023). "Advancements in Battery Materials." Energy Storage Materials, 45, 102-118.</p>
            <p>2. <a href="https://www.nature.com/articles/s41563-022-01354-7">Nature Materials: Solid-state battery progress</a></p>
            <p>3. <a href="https://iopscience.iop.org/article/10.1149/1945-7111/ac8b5a">Journal of The Electrochemical Society: Silicon anode development</a></p>
          </div>
        </body>
      </html>
    `;

    const result = await extractFromChatGPTHtml(html);
    
    // This test will fail if the implementation doesn't recognize "Executive Summary" as equivalent to
    // "Abstract" or "Conclusion" and doesn't extract it properly
    
    // Test that abstract is properly extracted despite different naming
    expect(result.abstract).toContain('Battery technology continues to evolve rapidly');
    expect(result.abstract).toContain('commercial viability for several of these technologies');
    
    // Main content should not include the executive summary
    expect(result.content).toContain('This report examines recent developments');
    expect(result.content).toContain('Key Findings');
    expect(result.content).not.toContain('Battery technology continues to evolve rapidly');
    
    // Check references and sources
    expect(result.references).toContain('• 1. Zhang et al.');
    expect(result.sources).toHaveLength(2);
    expect(result.sources[0].url).toBe('https://www.nature.com/articles/s41563-022-01354-7');
  });

  // Test 3: Has another implementation issue - the function might not properly handle 
  // nested content structures where abstract is inside a blockquote
  test('extracts abstract from nested blockquote structure and handles special characters', async () => {
    const html = `
      <html>
        <head><title>Research Summary - ChatGPT</title></head>
        <body>
          <div class="markdown">
            <h1>Quantum Computing: Current State & Future</h1>
            <p>This comprehensive overview covers recent advances in quantum computing hardware and algorithms.</p>
            <p>The field has seen significant progress in error correction and qubit stability.</p>
            
            <h2>Hardware Platforms</h2>
            <p>Several competing platforms exist:</p>
            <ul>
              <li>Superconducting circuits</li>
              <li>Trapped ions</li>
              <li>Photonic systems</li>
              <li>Topological qubits</li>
            </ul>
            
            <h2>Conclusion</h2>
            <blockquote>
              <p>The quantum computing field is progressing rapidly, but significant challenges remain before practical quantum advantage can be realized for most applications.</p>
              <p>Continued investment in both hardware and algorithm development is essential for capitalizing on the technology's potential.</p>
            </blockquote>
            
            <h2>References</h2>
            <p>1. Quantum & Company (2023). "State of Quantum Report 2023"</p>
            <p>2. <a href="https://quantum-journal.org/papers/q-2023-01-20-123/">Advances in Error Correction</a></p>
            <p>3. <a href="https://www.science.org/doi/10.1126/science.abc1234">Practical Quantum Advantage: Prospects and Timeline</a></p>
          </div>
        </body>
      </html>
    `;

    const result = await extractFromChatGPTHtml(html);
    
    // This test may fail if the implementation doesn't correctly handle blockquote elements
    // containing the abstract/conclusion
    
    // Test that abstract is properly extracted from the blockquote
    expect(result.abstract).toContain('quantum computing field is progressing rapidly');
    expect(result.abstract).toContain('Continued investment in both hardware');
    
    // Also check general content extraction
    expect(result.content).toContain('comprehensive overview covers recent advances');
    expect(result.content).toContain('Several competing platforms exist');
    
    // References should be correctly formatted with bullets
    expect(result.references).toContain('• 1. Quantum & Company');
    expect(result.references).toContain('• 2.');
    expect(result.references).toContain('• 3.');
    
    // Check sources
    expect(result.sources).toHaveLength(2);
    expect(result.sources[0].url).toBe('https://quantum-journal.org/papers/q-2023-01-20-123/');
    expect(result.sources[1].url).toBe('https://www.science.org/doi/10.1126/science.abc1234');
  });
});