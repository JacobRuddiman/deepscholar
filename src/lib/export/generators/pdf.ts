/**
 * PDF Generator
 * 
 * Generates PDF files from data structures using Puppeteer
 */

import { Generator } from './index';
import { BriefExportData, UserProfileExportData, SearchResultsExportData } from '../types';
import { htmlFormatter } from '../formatters/html';
import puppeteer from 'puppeteer';

export class PdfGenerator implements Generator {
  getMimeType(): string {
    return 'application/pdf';
  }

  getFileExtension(): string {
    return '.pdf';
  }

  async generate(data: any, options?: any): Promise<Buffer> {
    let browser;
    try {
      // Convert data to HTML first using our HTML formatter
      const html = await htmlFormatter.format(data, {
        ...options,
        styling: {
          theme: 'light', // Force light theme for PDF
          ...options?.styling
        }
      });

      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set content and wait for any dynamic content to load
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Configure PDF options
      const pdfOptions: any = {
        format: options?.pageSize || 'A4',
        printBackground: true,
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in',
          ...options?.styling?.margins
        },
        displayHeaderFooter: options?.styling?.headerFooter || false,
        headerTemplate: options?.styling?.headerFooter ? `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span class="title"></span>
          </div>
        ` : '',
        footerTemplate: options?.styling?.headerFooter ? `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        ` : '',
        preferCSSPageSize: false
      };

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      return Buffer.from(pdfBuffer);

    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

// Export singleton instance
export const pdfGenerator = new PdfGenerator();
