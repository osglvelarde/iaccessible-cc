import { WCAG_CRITERIA } from './wcag-complete';
import { GlossaryRow, TabData } from './types/glossary';

// Transform WCAG criteria to glossary format
const wcagRows: GlossaryRow[] = WCAG_CRITERIA.map((criterion) => ({
  id: `wcag-${criterion.wcagId}`,
  category: 'wcag' as const,
  columnName: criterion.wcagId,
  wcagTitle: criterion.title,
  wcagSC: criterion.principle,
  wcagLevel: criterion.level,
  explanation: criterion.howToTest,
  wcagFullCriterionText: `${criterion.title}: ${criterion.howToTest}`,
  remediationGuidelines: generateRemediationGuidelines(criterion),
  helpLink: criterion.understandingUrl,
  tags: [criterion.principle, criterion.wcagVersion]
}));

// Generate remediation guidelines based on WCAG criterion
function generateRemediationGuidelines(criterion: { wcagId: string; title: string; level: string; principle: string; howToTest: string; understandingUrl: string; wcagVersion: string }): string {
  const baseGuidelines = {
    '1.1.1': `## Non-text Content Remediation

- **Images**: Add meaningful alt text that describes the image's purpose
- **Decorative images**: Use empty alt="" or mark as presentational
- **Charts/graphs**: Provide data tables or text descriptions
- **Icons**: Use descriptive alt text or aria-label

\`\`\`html
<!-- Good: Meaningful alt text -->
<img src="chart.png" alt="Sales increased 25% from Q1 to Q2">

<!-- Good: Decorative image -->
<img src="decoration.png" alt="">

<!-- Good: Complex image -->
<img src="flowchart.png" alt="Process flowchart" longdesc="flowchart-description.html">
\`\`\``,

    '1.2.1': `## Audio/Video Content Remediation

- **Audio-only**: Provide text transcript
- **Video-only**: Provide audio track or text description
- **Transcripts**: Include speaker identification and sound effects

\`\`\`html
<!-- Audio with transcript -->
<audio controls>
  <source src="speech.mp3" type="audio/mpeg">
</audio>
<a href="transcript.txt">Transcript available</a>
\`\`\``,

    '1.3.1': `## Information Structure Remediation

- **Headings**: Use proper heading hierarchy (h1 → h2 → h3)
- **Lists**: Use semantic list elements (ul, ol, dl)
- **Tables**: Include proper headers and scope attributes
- **Forms**: Associate labels with form controls

\`\`\`html
<!-- Proper heading structure -->
<h1>Main Topic</h1>
  <h2>Subtopic</h2>
    <h3>Details</h3>

<!-- Proper table structure -->
<table>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>john@example.com</td>
    </tr>
  </tbody>
</table>
\`\`\``,

    '1.4.3': `## Color Contrast Remediation

- **Text**: Ensure 4.5:1 contrast ratio for normal text
- **Large text**: Ensure 3:1 contrast ratio for large text (18pt+)
- **Tools**: Use color contrast analyzers
- **Testing**: Test with color blindness simulators

\`\`\`css
/* Good contrast ratios */
.text-normal { color: #000000; background: #ffffff; } /* 21:1 */
.text-large { color: #333333; background: #ffffff; } /* 12.6:1 */
\`\`\``,

    '2.1.1': `## Keyboard Accessibility Remediation

- **Focus management**: Ensure all interactive elements are keyboard accessible
- **Tab order**: Logical tab sequence
- **Skip links**: Provide skip navigation links
- **Focus indicators**: Visible focus indicators

\`\`\`html
<!-- Skip link -->
<a href="#main" class="skip-link">Skip to main content</a>

<!-- Proper tab order -->
<button tabindex="1">First</button>
<input tabindex="2" type="text">
<button tabindex="3">Last</button>
\`\`\``,

    '2.4.1': `## Bypass Blocks Remediation

- **Skip links**: Provide skip navigation links
- **Landmarks**: Use semantic HTML5 landmarks
- **Headings**: Proper heading structure for navigation
- **ARIA**: Use ARIA landmarks when needed

\`\`\`html
<!-- Skip link -->
<a href="#main" class="skip-link">Skip to main content</a>

<!-- Landmarks -->
<nav aria-label="Main navigation">
<main id="main">
<aside aria-label="Sidebar">
\`\`\``,

    '3.1.1': `## Language Identification Remediation

- **Page language**: Set lang attribute on html element
- **Content language**: Set lang for content in different languages
- **Screen readers**: Helps with pronunciation
- **Translation tools**: Enables proper translation

\`\`\`html
<!-- Page language -->
<html lang="en">

<!-- Content in different language -->
<p lang="es">Hola, ¿cómo estás?</p>
\`\`\``,

    '4.1.1': `## Parsing Remediation

- **Valid HTML**: Ensure valid, well-formed markup
- **Nested elements**: Proper nesting of elements
- **Duplicate IDs**: No duplicate id attributes
- **Closing tags**: All elements properly closed

\`\`\`html
<!-- Valid HTML structure -->
<div>
  <p>Valid paragraph</p>
  <ul>
    <li>List item</li>
  </ul>
</div>
\`\`\``,

    '4.1.2': `## Name, Role, Value Remediation

- **Custom controls**: Ensure proper name, role, and value
- **ARIA attributes**: Use appropriate ARIA attributes
- **State changes**: Communicate state changes to assistive technology
- **Testing**: Test with screen readers

\`\`\`html
<!-- Custom button with proper ARIA -->
<button 
  role="button" 
  aria-label="Close dialog"
  aria-expanded="false"
  aria-controls="dialog">
  ×
</button>
\`\`\``
  };

  return baseGuidelines[criterion.wcagId] || `## ${criterion.title} Remediation

This criterion requires attention to ensure accessibility compliance. Please refer to the official WCAG documentation for detailed remediation guidance.

**Key areas to address:**
- Review the specific requirements for ${criterion.title}
- Test with assistive technologies
- Implement proper semantic markup
- Ensure programmatic access to all functionality

**Testing checklist:**
- [ ] Manual testing with screen reader
- [ ] Keyboard-only navigation
- [ ] Color contrast verification
- [ ] Semantic markup validation`;
}

// PDF/UA Rules based on ISO 14289-1
const pdfuaRows: GlossaryRow[] = [
  {
    id: 'pdfua-7.1',
    category: 'pdfua',
    columnName: 'Alternative Text for Images',
    pdfuaClause: '7.1',
    pdfuaCode: '7.1:1.1',
    pdfuaSeverity: 'Error',
    explanation: 'All images must have alternative text that describes their content and purpose.',
    pdfuaClauseDescription: `## PDF/UA Clause 7.1 - Alternative Text

Images in PDF documents must have alternative text that serves the same purpose as the image. This ensures that users with visual impairments can understand the content through screen readers.

**Requirements:**
- Every image must have alternative text
- Alt text should be meaningful and descriptive
- Decorative images should be marked as artifacts
- Complex images may require extended descriptions`,
    pdfuaFixingSuggestions: `## Fixing Missing Alternative Text

1. **Add Alt Text in PDF Editor:**
   - Right-click on image → Properties
   - Go to "Tag" tab
   - Enter descriptive text in "Alternate Text" field

2. **For Decorative Images:**
   - Mark as "Artifact" in accessibility properties
   - Remove from reading order

3. **For Complex Images:**
   - Provide detailed description
   - Consider creating separate text document
   - Use "Extended Description" if available

**Example Alt Text:**
- Good: "Bar chart showing sales increase from $50K to $75K"
- Bad: "Chart" or "Image"`,
    helpLink: 'https://www.iso.org/standard/64599.html'
  },
  {
    id: 'pdfua-7.2',
    category: 'pdfua',
    columnName: 'Heading Structure',
    pdfuaClause: '7.2',
    pdfuaCode: '7.2:1.2',
    pdfuaSeverity: 'Warning',
    explanation: 'Document must have proper heading hierarchy for navigation.',
    pdfuaClauseDescription: `## PDF/UA Clause 7.2 - Heading Structure

PDF documents must have a logical heading structure that allows users to navigate efficiently through the content.

**Requirements:**
- Use proper heading levels (H1, H2, H3, etc.)
- Maintain logical hierarchy
- No skipped heading levels
- Headings should be descriptive`,
    pdfuaFixingSuggestions: `## Fixing Heading Structure

1. **Check Heading Hierarchy:**
   - Ensure H1 comes before H2
   - No skipped levels (H1 → H3)
   - Use consistent formatting

2. **In PDF Editor:**
   - Select text → Right-click → Properties
   - Set appropriate heading level
   - Use "Heading 1", "Heading 2", etc.

3. **Navigation Pane:**
   - Verify headings appear in Bookmarks panel
   - Test navigation with screen reader`,
    helpLink: 'https://www.iso.org/standard/64599.html'
  },
  {
    id: 'pdfua-7.3',
    category: 'pdfua',
    columnName: 'Table Headers',
    pdfuaClause: '7.3',
    pdfuaCode: '7.3:1.3',
    pdfuaSeverity: 'Error',
    explanation: 'Data tables must have properly marked header cells.',
    pdfuaClauseDescription: `## PDF/UA Clause 7.3 - Table Headers

Data tables in PDF documents must have properly marked header cells to ensure screen readers can understand the table structure.

**Requirements:**
- Table headers must be marked as such
- Use TH elements for header cells
- Associate data cells with headers
- Complex tables may need additional markup`,
    pdfuaFixingSuggestions: `## Fixing Table Headers

1. **Mark Header Cells:**
   - Select header cell → Properties
   - Set "Cell Type" to "Header"
   - Ensure proper scope (row/column)

2. **Table Structure:**
   - Use proper table markup
   - Associate data cells with headers
   - Test with screen reader

3. **Complex Tables:**
   - Use ID/Headers attributes
   - Provide table summary
   - Consider breaking into simpler tables`,
    helpLink: 'https://www.iso.org/standard/64599.html'
  },
  {
    id: 'pdfua-7.4',
    category: 'pdfua',
    columnName: 'Form Field Labels',
    pdfuaClause: '7.4',
    pdfuaCode: '7.4:1.4',
    pdfuaSeverity: 'Error',
    explanation: 'Form fields must have accessible names and labels.',
    pdfuaClauseDescription: `## PDF/UA Clause 7.4 - Form Field Labels

Interactive form fields in PDF documents must have accessible names that describe their purpose to assistive technology users.

**Requirements:**
- Every form field needs a label
- Labels should be descriptive
- Use proper field names
- Associate labels with fields`,
    pdfuaFixingSuggestions: `## Fixing Form Field Labels

1. **Add Field Names:**
   - Right-click field → Properties
   - Enter descriptive name in "Name" field
   - Use clear, concise descriptions

2. **Tooltip Text:**
   - Add tooltip for additional context
   - Keep tooltips brief and helpful

3. **Testing:**
   - Test with screen reader
   - Verify field purpose is clear
   - Check tab order`,
    helpLink: 'https://www.iso.org/standard/64599.html'
  },
  {
    id: 'pdfua-7.5',
    category: 'pdfua',
    columnName: 'Language Specification',
    pdfuaClause: '7.5',
    pdfuaCode: '7.5:1.5',
    pdfuaSeverity: 'Warning',
    explanation: 'Document language must be specified for proper screen reader pronunciation.',
    pdfuaClauseDescription: `## PDF/UA Clause 7.5 - Language Specification

PDF documents must specify the primary language to ensure screen readers use the correct pronunciation and voice.

**Requirements:**
- Set document language
- Specify language for content in different languages
- Use proper language codes
- Update when language changes`,
    pdfuaFixingSuggestions: `## Fixing Language Specification

1. **Document Language:**
   - File → Properties → Advanced
   - Set "Language" to appropriate code (e.g., "en" for English)
   - Use ISO 639-1 language codes

2. **Content Language Changes:**
   - Mark text in different languages
   - Use proper language attributes
   - Test pronunciation with screen reader

3. **Common Language Codes:**
   - English: "en"
   - Spanish: "es"
   - French: "fr"
   - German: "de"`,
    helpLink: 'https://www.iso.org/standard/64599.html'
  },
  {
    id: 'pdfua-7.8',
    category: 'pdfua',
    columnName: 'Bookmarks and Navigation',
    pdfuaClause: '7.8',
    pdfuaCode: '7.8:1.8',
    pdfuaSeverity: 'Warning',
    explanation: 'Document should have bookmarks for easy navigation.',
    pdfuaClauseDescription: `## PDF/UA Clause 7.8 - Bookmarks and Navigation

PDF documents should include bookmarks that provide an outline of the document structure for easy navigation.

**Requirements:**
- Create bookmarks for major sections
- Use descriptive bookmark names
- Maintain logical hierarchy
- Test navigation functionality`,
    pdfuaFixingSuggestions: `## Adding Bookmarks

1. **Create Bookmarks:**
   - View → Navigation Panels → Bookmarks
   - Select text → Right-click → "Add Bookmark"
   - Use descriptive names

2. **Bookmark Structure:**
   - Match document outline
   - Use consistent naming
   - Test navigation

3. **Navigation Testing:**
   - Verify bookmarks work
   - Test with screen reader
   - Check keyboard navigation`,
    helpLink: 'https://www.iso.org/standard/64599.html'
  }
];

// WAVE Rules based on WebAIM's WAVE tool
const waveRows: GlossaryRow[] = [
  {
    id: 'wave-alt-missing',
    category: 'wave',
    columnName: 'alt_missing',
    waveType: 'Error',
    explanation: 'Image missing alternative text',
    remediationGuidelines: `## Missing Alternative Text

**Problem:** Images without alt attributes are inaccessible to screen reader users.

**Solution:**
- Add meaningful alt text for informative images
- Use empty alt="" for decorative images
- Provide detailed descriptions for complex images

\`\`\`html
<!-- Informative image -->
<img src="chart.png" alt="Sales increased 25% from Q1 to Q2">

<!-- Decorative image -->
<img src="decoration.png" alt="">

<!-- Complex image -->
<img src="flowchart.png" alt="Process flowchart" longdesc="flowchart.html">
\`\`\``,
    helpLink: 'https://wave.webaim.org/'
  },
  {
    id: 'wave-alt-empty',
    category: 'wave',
    columnName: 'alt_empty',
    waveType: 'Error',
    explanation: 'Image has empty alt attribute but is not decorative',
    remediationGuidelines: `## Empty Alt Attribute

**Problem:** Image has alt="" but appears to contain important information.

**Solution:**
- Add meaningful alt text if image is informative
- Mark as decorative if image is purely decorative
- Use CSS background images for decorative elements

\`\`\`html
<!-- Add meaningful alt text -->
<img src="important-chart.png" alt="Revenue growth chart showing 15% increase">

<!-- Or mark as decorative -->
<img src="decoration.png" alt="" role="presentation">
\`\`\``,
    helpLink: 'https://wave.webaim.org/'
  },
  {
    id: 'wave-link-empty',
    category: 'wave',
    columnName: 'link_empty',
    waveType: 'Error',
    explanation: 'Link contains no text',
    remediationGuidelines: `## Empty Link

**Problem:** Link element has no accessible text content.

**Solution:**
- Add text content to the link
- Use aria-label for icon-only links
- Provide context for the link purpose

\`\`\`html
<!-- Add text content -->
<a href="/contact">Contact Us</a>

<!-- Icon-only link with aria-label -->
<a href="/help" aria-label="Help and Support">
  <span class="icon-help" aria-hidden="true"></span>
</a>
\`\`\``,
    helpLink: 'https://wave.webaim.org/'
  },
  {
    id: 'wave-label-missing',
    category: 'wave',
    columnName: 'label_missing',
    waveType: 'Error',
    explanation: 'Form control missing label',
    remediationGuidelines: `## Missing Form Label

**Problem:** Form input lacks an associated label.

**Solution:**
- Use <label> element with for attribute
- Use aria-label for complex cases
- Ensure label describes the input purpose

\`\`\`html
<!-- Proper label association -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email">

<!-- Using aria-label -->
<input type="text" aria-label="Search products" placeholder="Search...">
\`\`\``,
    helpLink: 'https://wave.webaim.org/'
  },
  {
    id: 'wave-heading-missing',
    category: 'wave',
    columnName: 'heading_missing',
    waveType: 'Alert',
    explanation: 'Page missing heading structure',
    remediationGuidelines: `## Missing Heading Structure

**Problem:** Page lacks proper heading hierarchy for navigation.

**Solution:**
- Add appropriate heading levels (h1, h2, h3, etc.)
- Maintain logical hierarchy
- Use headings to structure content

\`\`\`html
<h1>Main Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
\`\`\``,
    helpLink: 'https://wave.webaim.org/'
  },
  {
    id: 'wave-contrast',
    category: 'wave',
    columnName: 'contrast',
    waveType: 'Error',
    explanation: 'Very low contrast between text and background',
    remediationGuidelines: `## Color Contrast Issues

**Problem:** Text and background colors don't meet minimum contrast ratios.

**Solution:**
- Ensure 4.5:1 contrast ratio for normal text
- Ensure 3:1 contrast ratio for large text
- Use color contrast checking tools
- Test with color blindness simulators

\`\`\`css
/* Good contrast ratios */
.text-normal { color: #000000; background: #ffffff; } /* 21:1 */
.text-large { color: #333333; background: #ffffff; } /* 12.6:1 */
\`\`\``,
    helpLink: 'https://wave.webaim.org/'
  },
  {
    id: 'wave-aria',
    category: 'wave',
    columnName: 'aria',
    waveType: 'Feature',
    explanation: 'ARIA landmark or region',
    remediationGuidelines: `## ARIA Landmarks

**Good Practice:** Using ARIA landmarks improves navigation.

**Implementation:**
- Use semantic HTML5 elements when possible
- Add ARIA landmarks for complex layouts
- Ensure landmarks are descriptive

\`\`\`html
<!-- Semantic HTML5 -->
<nav aria-label="Main navigation">
<main>
<aside aria-label="Sidebar">

<!-- ARIA landmarks -->
<div role="banner">Header content</div>
<div role="main">Main content</div>
<div role="complementary">Sidebar</div>
\`\`\``,
    helpLink: 'https://wave.webaim.org/'
  },
  {
    id: 'wave-language',
    category: 'wave',
    columnName: 'language',
    waveType: 'Feature',
    explanation: 'Language of page is specified',
    remediationGuidelines: `## Language Specification

**Good Practice:** Specifying page language helps screen readers.

**Implementation:**
- Set lang attribute on html element
- Specify language for content in different languages
- Use proper language codes

\`\`\`html
<!-- Page language -->
<html lang="en">

<!-- Content in different language -->
<p lang="es">Hola, ¿cómo estás?</p>
\`\`\``,
    helpLink: 'https://wave.webaim.org/'
  }
];

// Readability Metrics
const readabilityRows: GlossaryRow[] = [
  {
    id: 'readability-flesch',
    category: 'readability',
    columnName: 'Flesch Reading Ease',
    readabilityMetric: 'Flesch Reading Ease',
    readabilityDescription: 'Measures readability based on sentence length and syllable count',
    readabilityThreshold: '60-70 (Plain English)',
    readabilityFieldName: 'flesch_score',
    readabilityScoreType: 'score_0_100',
    explanation: 'Score from 0-100 where higher scores indicate easier reading. Target range is 60-70 for plain English.',
    remediationGuidelines: `## Flesch Reading Ease Improvement

**Target Score:** 60-70 (Plain English)

**How to Improve:**
- Use shorter sentences (15-20 words average)
- Use simpler words (fewer syllables)
- Write in active voice
- Avoid jargon and technical terms

**Examples:**
- Complex: "The implementation of the aforementioned methodology will facilitate enhanced user engagement."
- Simple: "This method will help users engage more."`,
    helpLink: 'https://readabilityformulas.com/flesch-reading-ease-readability-formula.php'
  },
  {
    id: 'readability-flesch-kincaid',
    category: 'readability',
    columnName: 'Flesch-Kincaid Grade Level',
    readabilityMetric: 'Flesch-Kincaid Grade Level',
    readabilityDescription: 'Indicates the U.S. grade level needed to understand the text',
    readabilityThreshold: '6-8 (Middle School)',
    readabilityFieldName: 'fk_grade_level',
    readabilityScoreType: 'grade_level',
    explanation: 'Grade level score where 6-8 is ideal for general audiences. Higher numbers indicate more complex text.',
    remediationGuidelines: `## Flesch-Kincaid Grade Level Improvement

**Target Grade Level:** 6-8 (Middle School)

**How to Improve:**
- Use shorter sentences
- Choose simpler words
- Avoid complex sentence structures
- Write for your audience's reading level

**Word Complexity Examples:**
- Complex: "utilize" → Simple: "use"
- Complex: "facilitate" → Simple: "help"
- Complex: "implement" → Simple: "do"`,
    helpLink: 'https://readabilityformulas.com/flesch-kincaid-grade-level-readability-formula.php'
  },
  {
    id: 'readability-smog',
    category: 'readability',
    columnName: 'SMOG Index',
    readabilityMetric: 'SMOG Index',
    readabilityDescription: 'Simple Measure of Gobbledygook - estimates years of education needed',
    readabilityThreshold: '6-8 (Middle School)',
    readabilityFieldName: 'smog_index',
    readabilityScoreType: 'grade_level',
    explanation: 'Estimates years of education needed to understand text. Target is 6-8 years (middle school level).',
    remediationGuidelines: `## SMOG Index Improvement

**Target Level:** 6-8 years of education

**How to Improve:**
- Use shorter sentences
- Avoid polysyllabic words
- Write in simple, clear language
- Test with readability tools

**Sentence Length Examples:**
- Too long: "The comprehensive analysis of the multifaceted aspects of the organizational structure reveals significant opportunities for optimization."
- Better: "The analysis shows ways to improve the organization."`,
    helpLink: 'https://readabilityformulas.com/smog-readability-formula.php'
  },
  {
    id: 'readability-coleman-liau',
    category: 'readability',
    columnName: 'Coleman-Liau Index',
    readabilityMetric: 'Coleman-Liau Index',
    readabilityDescription: 'Based on characters per word and sentences per 100 words',
    readabilityThreshold: '6-8 (Middle School)',
    readabilityFieldName: 'coleman_liau',
    readabilityScoreType: 'grade_level',
    explanation: 'Grade level based on character count and sentence structure. Target is 6-8 grade level.',
    remediationGuidelines: `## Coleman-Liau Index Improvement

**Target Grade Level:** 6-8

**How to Improve:**
- Use shorter words (fewer characters)
- Write shorter sentences
- Avoid complex punctuation
- Use common vocabulary

**Word Length Examples:**
- Long: "characteristics" (14 characters)
- Short: "traits" (6 characters)`,
    helpLink: 'https://readabilityformulas.com/coleman-liau-readability-formula.php'
  },
  {
    id: 'readability-ari',
    category: 'readability',
    columnName: 'Automated Readability Index',
    readabilityMetric: 'ARI',
    readabilityDescription: 'Uses characters per word and words per sentence',
    readabilityThreshold: '6-8 (Middle School)',
    readabilityFieldName: 'ari_score',
    readabilityScoreType: 'grade_level',
    explanation: 'Grade level based on character and word counts. Target is 6-8 grade level for general audiences.',
    remediationGuidelines: `## ARI Improvement

**Target Grade Level:** 6-8

**How to Improve:**
- Reduce average word length
- Use shorter sentences
- Avoid technical jargon
- Write in active voice

**Sentence Structure Examples:**
- Complex: "The methodology that was implemented by the team has resulted in improved outcomes."
- Simple: "The team's method improved results."`,
    helpLink: 'https://readabilityformulas.com/automated-readability-index.php'
  },
  {
    id: 'readability-plain-language',
    category: 'readability',
    columnName: 'Plain Language Guidelines',
    readabilityMetric: 'Plain Language',
    readabilityDescription: 'Guidelines for clear, accessible communication',
    readabilityThreshold: 'Follow all guidelines',
    readabilityFieldName: 'plain_language_score',
    readabilityScoreType: 'score',
    explanation: 'Comprehensive guidelines for writing in plain language that everyone can understand.',
    remediationGuidelines: `## Plain Language Guidelines

**Core Principles:**
1. **Use simple words** - Choose common words over complex ones
2. **Write short sentences** - Aim for 15-20 words average
3. **Use active voice** - "The team completed the task" not "The task was completed by the team"
4. **Avoid jargon** - Explain technical terms
5. **Use lists** - Break up complex information
6. **Test with users** - Get feedback from your audience

**Before and After:**
- Before: "Utilize the aforementioned methodology to facilitate enhanced user engagement."
- After: "Use this method to help users engage more."`,
    helpLink: 'https://www.plainlanguage.gov/guidelines/'
  }
];

export const GLOSSARY_DATA: TabData[] = [
  {
    id: 'wcag',
    name: 'WCAG 2.2',
    description: 'Web Content Accessibility Guidelines 2.2 success criteria for web accessibility compliance',
    rows: wcagRows
  },
  {
    id: 'pdfua',
    name: 'PDF/UA',
    description: 'PDF/Universal Accessibility validation rules based on ISO 14289-1 standard',
    rows: pdfuaRows
  },
  {
    id: 'wave',
    name: 'WAVE',
    description: 'WebAIM WAVE tool evaluation categories for web accessibility testing',
    rows: waveRows
  },
  {
    id: 'readability',
    name: 'Readability',
    description: 'Readability metrics and plain language guidelines for accessible content',
    rows: readabilityRows
  }
];
