/**
 * TypeScript-Native WALT Tool Discovery
 *
 * Implements tool discovery using Playwright for Node.js
 * No Python required!
 */

import { chromium, Browser, Page } from 'playwright';
import { SimplifiedWALTTool } from './types';

export interface NativeDiscoveryOptions {
  url: string;
  goal?: string;
  maxTools?: number;
  headless?: boolean;
  timeout?: number;
}

export interface DiscoveryResult {
  tools: SimplifiedWALTTool[];
  metadata: {
    url: string;
    discoveredAt: string;
    toolsFound: number;
    executionTime: number;
  };
}

export class NativeWALTDiscovery {
  private browser?: Browser;

  /**
   * Discover tools from a website using Playwright
   */
  async discoverTools(options: NativeDiscoveryOptions): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const { url, goal = '', maxTools = 10, headless = true, timeout = 60000 } = options;

    console.log(`🔍 [Native WALT] Discovering tools from ${url}...`);

    try {
      // Launch browser
      this.browser = await chromium.launch({ headless });
      const context = await this.browser.newContext();
      const page = await context.newPage();

      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle', timeout });

      // Discover interactive elements
      const tools = await this.analyzePageForTools(page, url, goal, maxTools);

      // Close browser
      await this.browser.close();
      this.browser = undefined;

      const executionTime = Date.now() - startTime;

      console.log(`✅ [Native WALT] Discovered ${tools.length} tools in ${executionTime}ms`);

      return {
        tools,
        metadata: {
          url,
          discoveredAt: new Date().toISOString(),
          toolsFound: tools.length,
          executionTime,
        },
      };
    } catch (error: any) {
      console.error(`❌ [Native WALT] Discovery failed:`, error.message);
      if (this.browser) {
        await this.browser.close();
        this.browser = undefined;
      }
      throw new Error(`Tool discovery failed: ${error.message}`);
    }
  }

  /**
   * Analyze page for interactive tools
   */
  private async analyzePageForTools(
    page: Page,
    sourceUrl: string,
    goal: string,
    maxTools: number
  ): Promise<SimplifiedWALTTool[]> {
    const tools: SimplifiedWALTTool[] = [];

    // 1. Discover search forms
    const searchTools = await this.discoverSearchForms(page, sourceUrl);
    tools.push(...searchTools);

    // 2. Discover data extraction opportunities
    const dataTools = await this.discoverDataExtraction(page, sourceUrl);
    tools.push(...dataTools);

    // 3. Discover navigation patterns
    const navTools = await this.discoverNavigationPatterns(page, sourceUrl);
    tools.push(...navTools);

    // Filter and rank by relevance to goal
    const rankedTools = this.rankToolsByGoal(tools, goal);

    // Return top N tools
    return rankedTools.slice(0, maxTools);
  }

  /**
   * Discover search forms on the page
   */
  private async discoverSearchForms(page: Page, sourceUrl: string): Promise<SimplifiedWALTTool[]> {
    const tools: SimplifiedWALTTool[] = [];

    try {
      // Find all forms with search inputs
      const forms = await page.$$('form');

      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];

        // Check if form has search-related inputs
        const inputs = await form.$$('input[type="text"], input[type="search"], input[name*="search"], input[id*="search"]');

        if (inputs.length > 0) {
          const input = inputs[0];
          const name = await input.getAttribute('name') || await input.getAttribute('id') || `search_${i}`;
          const placeholder = await input.getAttribute('placeholder') || 'Search query';

          const toolName = this.sanitizeToolName(`search_${name}`);

          tools.push({
            name: toolName,
            description: `Search for information using the ${placeholder} form`,
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: placeholder,
                },
              },
              required: ['query'],
            },
            code: this.generateSearchToolCode(toolName, sourceUrl, name),
            source_url: sourceUrl,
            discovery_method: 'form_analysis',
            confidence_score: 0.8,
          });
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ Search form discovery failed:`, error.message);
    }

    return tools;
  }

  /**
   * Discover data extraction opportunities
   */
  private async discoverDataExtraction(page: Page, sourceUrl: string): Promise<SimplifiedWALTTool[]> {
    const tools: SimplifiedWALTTool[] = [];

    try {
      // Look for structured data patterns (tables, lists, cards)
      const hasTables = (await page.$$('table')).length > 0;
      const hasLists = (await page.$$('ul, ol')).length > 0;
      const hasCards = (await page.$$('[class*="card"], [class*="item"], [class*="product"]')).length > 0;

      if (hasTables || hasLists || hasCards) {
        const domain = new URL(sourceUrl).hostname.replace('www.', '').split('.')[0];
        const toolName = this.sanitizeToolName(`extract_${domain}_data`);

        tools.push({
          name: toolName,
          description: `Extract structured data from ${domain}`,
          parameters: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for data to extract',
                default: 'table, ul, [class*="item"]',
              },
            },
            required: [],
          },
          code: this.generateExtractionToolCode(toolName, sourceUrl),
          source_url: sourceUrl,
          discovery_method: 'structure_analysis',
          confidence_score: 0.7,
        });
      }
    } catch (error: any) {
      console.warn(`⚠️ Data extraction discovery failed:`, error.message);
    }

    return tools;
  }

  /**
   * Discover navigation patterns
   */
  private async discoverNavigationPatterns(page: Page, sourceUrl: string): Promise<SimplifiedWALTTool[]> {
    const tools: SimplifiedWALTTool[] = [];

    try {
      // Find pagination or navigation links
      const navLinks = await page.$$('a[class*="next"], a[class*="prev"], a[class*="page"], button[class*="load"]');

      if (navLinks.length > 0) {
        const domain = new URL(sourceUrl).hostname.replace('www.', '').split('.')[0];
        const toolName = this.sanitizeToolName(`navigate_${domain}`);

        tools.push({
          name: toolName,
          description: `Navigate through pages on ${domain}`,
          parameters: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['next', 'previous', 'goto'],
                description: 'Navigation action',
              },
              page: {
                type: 'number',
                description: 'Page number to navigate to',
              },
            },
            required: ['action'],
          },
          code: this.generateNavigationToolCode(toolName, sourceUrl),
          source_url: sourceUrl,
          discovery_method: 'navigation_analysis',
          confidence_score: 0.6,
        });
      }
    } catch (error: any) {
      console.warn(`⚠️ Navigation discovery failed:`, error.message);
    }

    return tools;
  }

  /**
   * Rank tools by relevance to goal
   */
  private rankToolsByGoal(tools: SimplifiedWALTTool[], goal: string): SimplifiedWALTTool[] {
    if (!goal) {
      return tools.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
    }

    const goalLower = goal.toLowerCase();

    return tools
      .map((tool) => {
        let relevanceScore = tool.confidence_score || 0;

        // Boost score if tool name or description matches goal keywords
        if (tool.name.toLowerCase().includes(goalLower)) {
          relevanceScore += 0.2;
        }
        if (tool.description.toLowerCase().includes(goalLower)) {
          relevanceScore += 0.1;
        }

        return { ...tool, confidence_score: Math.min(relevanceScore, 1.0) };
      })
      .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
  }

  /**
   * Sanitize tool name for use as identifier
   */
  private sanitizeToolName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Generate executable code for search tool
   */
  private generateSearchToolCode(toolName: string, url: string, inputName: string): string {
    return `
async function ${toolName}(query) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('${url}');
  await page.fill('input[name="${inputName}"], input[id="${inputName}"]', query);
  await page.press('input[name="${inputName}"], input[id="${inputName}"]', 'Enter');
  await page.waitForLoadState('networkidle');

  const results = await page.evaluate(() => {
    // Extract results from page
    return document.body.innerText;
  });

  await browser.close();
  return results;
}
`.trim();
  }

  /**
   * Generate executable code for extraction tool
   */
  private generateExtractionToolCode(toolName: string, url: string): string {
    return `
async function ${toolName}(selector = 'table, ul, [class*="item"]') {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('${url}');
  await page.waitForLoadState('networkidle');

  const data = await page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel);
    return Array.from(elements).map(el => el.textContent?.trim());
  }, selector);

  await browser.close();
  return data;
}
`.trim();
  }

  /**
   * Generate executable code for navigation tool
   */
  private generateNavigationToolCode(toolName: string, url: string): string {
    return `
async function ${toolName}(action, page) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const browserPage = await browser.newPage();

  await browserPage.goto('${url}');

  if (action === 'next') {
    await browserPage.click('a[class*="next"], button[class*="next"]');
  } else if (action === 'previous') {
    await browserPage.click('a[class*="prev"], button[class*="prev"]');
  } else if (action === 'goto' && page) {
    await browserPage.goto(\`${url}?page=\${page}\`);
  }

  await browserPage.waitForLoadState('networkidle');
  const content = await browserPage.content();

  await browser.close();
  return content;
}
`.trim();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}

// Singleton instance
let instance: NativeWALTDiscovery | undefined;

export function getNativeWALTDiscovery(): NativeWALTDiscovery {
  if (!instance) {
    instance = new NativeWALTDiscovery();
  }
  return instance;
}
