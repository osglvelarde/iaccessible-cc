import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { domain } = req.query;
  if (!domain || typeof domain !== 'string') {
    res.status(400).json({ error: 'Missing or invalid domain parameter' });
    return;
  }

  try {
    const response = await fetch(domain);
    if (!response.ok) {
      res.status(500).json({ error: `Failed to fetch domain: ${domain}` });
      return;
    }
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const anchors = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    const internalLinks = anchors
      .map(a => a.href)
      .filter(href => href.startsWith(domain))
      .filter((value, index, self) => self.indexOf(value) === index); // unique

    const maxLinks = 3;
    const suggestedPages = internalLinks.length === 0 ? [domain] : internalLinks.slice(0, maxLinks);

    res.status(200).json({ suggestedPages });
  } catch (error) {
    res.status(500).json({ error: 'Error crawling homepage', details: error.message });
  }
}
