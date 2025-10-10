import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export async function crawlHomepage(domain: string, maxLinks: number = 3): Promise<string[]> {
  try {
    const response = await fetch(domain);
    if (!response.ok) {
      throw new Error(`Failed to fetch domain: ${domain}`);
    }
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const anchors = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    const internalLinks = anchors
      .map(a => a.href)
      .filter(href => href.startsWith(domain))
      .filter((value, index, self) => self.indexOf(value) === index); // unique

    // Return top maxLinks links or fallback to homepage if none found
    if (internalLinks.length === 0) {
      return [domain];
    }
    return internalLinks.slice(0, maxLinks);
  } catch (error) {
    console.error('Error crawling homepage:', error);
    return [domain];
  }
}
