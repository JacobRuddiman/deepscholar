/**
 * DOCX Generator
 * 
 * Generates Microsoft Word documents from data structures using the docx library
 */

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  UnderlineType
} from 'docx';
import { Generator } from './index';
import { BriefExportData, UserProfileExportData, SearchResultsExportData } from '../types';

export class DocxGenerator implements Generator {
  getMimeType(): string {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  getFileExtension(): string {
    return '.docx';
  }

  async generate(data: any, options?: any): Promise<Buffer> {
    let sections;
    
    if (this.isBriefData(data)) {
      sections = this.generateBriefDocument(data, options);
    } else if (this.isUserProfileData(data)) {
      sections = this.generateUserProfileDocument(data, options);
    } else if (this.isSearchResultsData(data)) {
      sections = this.generateSearchResultsDocument(data, options);
    } else {
      sections = this.generateGenericDocument(data, options);
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    });
    
    return await Packer.toBuffer(doc);
  }

  private isBriefData(data: any): data is BriefExportData {
    return data && typeof data.title === 'string' && typeof data.content === 'string';
  }

  private isUserProfileData(data: any): data is UserProfileExportData {
    return data && typeof data.name === 'string' && data.statistics;
  }

  private isSearchResultsData(data: any): data is SearchResultsExportData {
    return data && typeof data.query === 'string' && Array.isArray(data.results);
  }

  private generateBriefDocument(data: BriefExportData, options?: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Title
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 32
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER
    }));

    // Metadata section
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Document Information',
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1
    }));

    // Author
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: 'Author: ', bold: true }),
        new TextRun(data.author.name)
      ]
    }));

    // Model
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: 'AI Model: ', bold: true }),
        new TextRun(`${data.model.name} (${data.model.provider})`)
      ]
    }));

    // Created date
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: 'Created: ', bold: true }),
        new TextRun(new Date(data.statistics.createdAt).toLocaleDateString())
      ]
    }));

    // Categories
    if (data.categories.length > 0) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: 'Categories: ', bold: true }),
          new TextRun(data.categories.join(', '))
        ]
      }));
    }

    // Statistics
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: 'Views: ', bold: true }),
        new TextRun(data.statistics.viewCount.toString()),
        new TextRun({ text: ' | Upvotes: ', bold: true }),
        new TextRun(data.statistics.upvotes.toString())
      ]
    }));

    // Abstract
    if (data.abstract) {
      paragraphs.push(new Paragraph({ text: '' })); // Spacer
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: 'Abstract',
            bold: true,
            size: 24
          })
        ],
        heading: HeadingLevel.HEADING_1
      }));

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: data.abstract,
            italics: true
          })
        ]
      }));
    }

    // Main content
    paragraphs.push(new Paragraph({ text: '' })); // Spacer
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Content',
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1
    }));

    // Split content into paragraphs
    const contentParagraphs = data.content.split('\n\n');
    contentParagraphs.forEach(para => {
      if (para.trim()) {
        paragraphs.push(new Paragraph({
          children: [new TextRun(para.trim())]
        }));
      }
    });

    // Thinking process (if available)
    if (data.thinking && options?.includeMetadata) {
      paragraphs.push(new Paragraph({ text: '' })); // Spacer
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: 'AI Thinking Process',
            bold: true,
            size: 24
          })
        ],
        heading: HeadingLevel.HEADING_1
      }));

      const thinkingParagraphs = data.thinking.split('\n\n');
      thinkingParagraphs.forEach(para => {
        if (para.trim()) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                color: '666666'
              })
            ]
          }));
        }
      });
    }

    // References
    if (data.references.length > 0 && options?.includeReferences) {
      paragraphs.push(new Paragraph({ text: '' })); // Spacer
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: 'References',
            bold: true,
            size: 24
          })
        ],
        heading: HeadingLevel.HEADING_1
      }));

      data.references.forEach((ref, index) => {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun({ text: `"${ref.highlightedText}"`, italics: true }),
            new TextRun({ text: ` - ${ref.source.title}` })
          ]
        }));

        if (ref.context) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: `   Context: ${ref.context}`,
                color: '666666',
                size: 20
              })
            ]
          }));
        }
      });
    }

    // Sources
    if (data.sources.length > 0) {
      paragraphs.push(new Paragraph({ text: '' })); // Spacer
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: 'Sources',
            bold: true,
            size: 24
          })
        ],
        heading: HeadingLevel.HEADING_1
      }));

      data.sources.forEach((source, index) => {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun({ text: source.title }),
            new TextRun({ text: ` (${source.url})`, color: '0066CC', underline: { type: UnderlineType.SINGLE } })
          ]
        }));
      });
    }

    return paragraphs;
  }

  private generateUserProfileDocument(data: UserProfileExportData, options?: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Title
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: `User Profile: ${data.name}`,
          bold: true,
          size: 32
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER
    }));

    // Basic Information
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Basic Information',
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1
    }));

    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: 'Name: ', bold: true }),
        new TextRun(data.name)
      ]
    }));

    if (data.email) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: 'Email: ', bold: true }),
          new TextRun(data.email)
        ]
      }));
    }

    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: 'Member Since: ', bold: true }),
        new TextRun(new Date(data.joinedAt).toLocaleDateString())
      ]
    }));

    // Statistics
    paragraphs.push(new Paragraph({ text: '' })); // Spacer
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Statistics',
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1
    }));

    // Create statistics table
    const statsTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true })] })],
              width: { size: 50, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Value', bold: true })] })],
              width: { size: 50, type: WidthType.PERCENTAGE }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('Briefs Created')]
            }),
            new TableCell({
              children: [new Paragraph(data.statistics.briefsCreated.toString())]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('Reviews Written')]
            }),
            new TableCell({
              children: [new Paragraph(data.statistics.reviewsWritten.toString())]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('Upvotes Received')]
            }),
            new TableCell({
              children: [new Paragraph(data.statistics.upvotesReceived.toString())]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('Token Balance')]
            }),
            new TableCell({
              children: [new Paragraph(data.statistics.tokenBalance.toString())]
            })
          ]
        })
      ]
    });

    paragraphs.push(new Paragraph({ children: [] })); // Table placeholder
    // Note: Tables need to be added differently in the document structure

    // Recent Briefs
    if (data.briefs.length > 0) {
      paragraphs.push(new Paragraph({ text: '' })); // Spacer
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: 'Recent Briefs',
            bold: true,
            size: 24
          })
        ],
        heading: HeadingLevel.HEADING_1
      }));

      data.briefs.forEach((brief, index) => {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun({ text: brief.title, bold: true })
          ]
        }));

        if (brief.abstract) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: `   ${brief.abstract}`,
                italics: true,
                color: '666666'
              })
            ]
          }));
        }

        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: `   Created: ${new Date(brief.createdAt).toLocaleDateString()} | Views: ${brief.viewCount} | Upvotes: ${brief.upvotes}`,
              size: 20,
              color: '666666'
            })
          ]
        }));

        paragraphs.push(new Paragraph({ text: '' })); // Spacer
      });
    }

    return paragraphs;
  }

  private generateSearchResultsDocument(data: SearchResultsExportData, options?: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Title
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: `Search Results: "${data.query}"`,
          bold: true,
          size: 32
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER
    }));

    // Search metadata
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: 'Total Results: ', bold: true }),
        new TextRun(data.totalResults.toString()),
        new TextRun({ text: ' | Search Date: ', bold: true }),
        new TextRun(new Date(data.searchMetadata.executedAt).toLocaleDateString())
      ]
    }));

    paragraphs.push(new Paragraph({ text: '' })); // Spacer

    // Results
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Results',
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1
    }));

    data.results.forEach((result, index) => {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun({ text: result.title, bold: true })
        ]
      }));

      if (result.abstract) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: result.abstract,
              italics: true
            })
          ]
        }));
      }

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: 'Author: ', bold: true }),
          new TextRun(result.author),
          new TextRun({ text: ' | Created: ', bold: true }),
          new TextRun(new Date(result.createdAt).toLocaleDateString())
        ]
      }));

      if (result.relevanceScore !== undefined) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({ text: 'Relevance Score: ', bold: true }),
            new TextRun(`${(result.relevanceScore * 100).toFixed(1)}%`)
          ]
        }));
      }

      paragraphs.push(new Paragraph({ text: '' })); // Spacer
    });

    return paragraphs;
  }

  private generateGenericDocument(data: any, options?: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Data Export',
          bold: true,
          size: 32
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER
    }));

    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Exported Data',
          bold: true,
          size: 24
        })
      ],
      heading: HeadingLevel.HEADING_1
    }));

    const jsonString = JSON.stringify(data, null, 2);
    const lines = jsonString.split('\n');
    
    lines.forEach(line => {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: 'Courier New'
          })
        ]
      }));
    });

    return paragraphs;
  }
}

// Export singleton instance
export const docxGenerator = new DocxGenerator();
