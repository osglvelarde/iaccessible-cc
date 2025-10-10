// WCAG 2.2 Criteria seed data
import type { Criterion, WCAGLevel, ScopeType } from '../types';

export const WCAG_CRITERIA: Omit<Criterion, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] = [
  // Principle 1: Perceivable
  {
    wcagId: '1.1.1',
    title: 'Non-text Content',
    level: 'A' as WCAGLevel,
    principle: 'Perceivable',
    howToTest: 'Check that all non-text content has appropriate alternative text that serves the same purpose. For images, verify alt attributes are present and meaningful. For decorative images, ensure they have empty alt attributes or are marked as presentational.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
      'https://webaim.org/articles/alt/'
    ],
    applicableMedia: ['web', 'pdf', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '1.2.1',
    title: 'Audio-only and Video-only (Prerecorded)',
    level: 'A' as WCAGLevel,
    principle: 'Perceivable',
    howToTest: 'For prerecorded audio-only content, check that a text transcript is provided. For prerecorded video-only content, verify that either an audio track or text transcript describes the visual content.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html'
    ],
    applicableMedia: ['web', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '1.2.2',
    title: 'Captions (Prerecorded)',
    level: 'A' as WCAGLevel,
    principle: 'Perceivable',
    howToTest: 'Check that synchronized captions are provided for all prerecorded audio content in video. Verify captions are accurate, synchronized, and include speaker identification and sound effects.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html'
    ],
    applicableMedia: ['web', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '1.3.1',
    title: 'Info and Relationships',
    level: 'A' as WCAGLevel,
    principle: 'Perceivable',
    howToTest: 'Verify that information, structure, and relationships conveyed through presentation can be programmatically determined. Check heading structure, list markup, table headers, form labels, and semantic elements.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html'
    ],
    applicableMedia: ['web', 'pdf', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '1.3.2',
    title: 'Meaningful Sequence',
    level: 'A' as WCAGLevel,
    principle: 'Perceivable',
    howToTest: 'Check that when content is presented in a sequence that affects meaning, the reading sequence can be programmatically determined. Test with screen readers and keyboard navigation.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html'
    ],
    applicableMedia: ['web', 'pdf', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '1.4.1',
    title: 'Use of Color',
    level: 'A' as WCAGLevel,
    principle: 'Perceivable',
    howToTest: 'Ensure that color is not the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html'
    ],
    applicableMedia: ['web', 'pdf', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '1.4.3',
    title: 'Contrast (Minimum)',
    level: 'AA' as WCAGLevel,
    principle: 'Perceivable',
    howToTest: 'Check that text and background colors have sufficient contrast ratio: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold). Use color contrast analyzer tools.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
      'https://webaim.org/resources/contrastchecker/'
    ],
    applicableMedia: ['web', 'pdf', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '2.1.1',
    title: 'Keyboard',
    level: 'A' as WCAGLevel,
    principle: 'Operable',
    howToTest: 'Test that all functionality is available using only the keyboard. Check tab order, focus indicators, and that no keyboard traps exist. Test with Tab, Shift+Tab, Enter, Space, and arrow keys.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html'
    ],
    applicableMedia: ['web', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '2.1.2',
    title: 'No Keyboard Trap',
    level: 'A' as WCAGLevel,
    principle: 'Operable',
    howToTest: 'Verify that keyboard focus can be moved away from any component using standard navigation keys. If non-standard keys are required, ensure users are informed of the method.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html'
    ],
    applicableMedia: ['web', 'mobile'] as ScopeType[]
  },
  {
    wcagId: '2.4.1',
    title: 'Bypass Blocks',
    level: 'A' as WCAGLevel,
    principle: 'Operable',
    howToTest: 'Check that a mechanism is available to bypass blocks of content that are repeated on multiple pages. Look for skip links, proper heading structure, or landmark regions.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html'
    ],
    applicableMedia: ['web'] as ScopeType[]
  },
  {
    wcagId: '2.4.2',
    title: 'Page Titled',
    level: 'A' as WCAGLevel,
    principle: 'Operable',
    howToTest: 'Verify that web pages have titles that describe topic or purpose. Check that page titles are descriptive and help users understand page content.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html'
    ],
    applicableMedia: ['web'] as ScopeType[]
  },
  {
    wcagId: '3.1.1',
    title: 'Language of Page',
    level: 'A' as WCAGLevel,
    principle: 'Understandable',
    howToTest: 'Check that the default human language of each web page can be programmatically determined using the lang attribute on the html element.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html'
    ],
    applicableMedia: ['web'] as ScopeType[]
  },
  {
    wcagId: '4.1.1',
    title: 'Parsing',
    level: 'A' as WCAGLevel,
    principle: 'Robust',
    howToTest: 'Validate that content implemented using markup languages has elements with complete start and end tags, unique IDs, and properly nested elements according to specifications.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/parsing.html'
    ],
    applicableMedia: ['web'] as ScopeType[]
  },
  {
    wcagId: '4.1.2',
    title: 'Name, Role, Value',
    level: 'A' as WCAGLevel,
    principle: 'Robust',
    howToTest: 'Check that for all user interface components, the name and role can be programmatically determined. Verify that states, properties, and values can be programmatically set and that user agents, including assistive technologies, are notified of changes.',
    remediationLinks: [
      'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html'
    ],
    applicableMedia: ['web', 'mobile'] as ScopeType[]
  }
];

export const WCAG_PRINCIPLES = [
  {
    id: '1',
    name: 'Perceivable',
    description: 'Information and user interface components must be presentable to users in ways they can perceive.'
  },
  {
    id: '2', 
    name: 'Operable',
    description: 'User interface components and navigation must be operable.'
  },
  {
    id: '3',
    name: 'Understandable', 
    description: 'Information and the operation of user interface must be understandable.'
  },
  {
    id: '4',
    name: 'Robust',
    description: 'Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies.'
  }
];