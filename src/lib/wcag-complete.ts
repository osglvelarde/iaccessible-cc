export interface WCAGCriterion {
  wcagId: string;
  title: string;
  level: 'A' | 'AA' | 'AAA';
  principle: string;
  howToTest: string;
  understandingUrl: string;
  wcagVersion: '2.1' | '2.2';
}

export interface WCAGPrinciple {
  id: string;
  name: string;
  description: string;
}

export const WCAG_PRINCIPLES: WCAGPrinciple[] = [
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

export const WCAG_CRITERIA: WCAGCriterion[] = [
  // WCAG 2.1 AA Criteria
  {
    wcagId: '1.1.1',
    title: 'Non-text Content',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'Check that all non-text content has appropriate alternative text that serves the same purpose. For images, verify alt attributes are present and meaningful. For decorative images, ensure they have empty alt attributes or are marked as presentational.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.2.1',
    title: 'Audio-only and Video-only (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'For prerecorded audio-only content, check that a text transcript is provided. For prerecorded video-only content, verify that either an audio track or text transcript describes the visual content.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.2.2',
    title: 'Captions (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'Check that synchronized captions are provided for all prerecorded audio content in video. Verify captions are accurate, synchronized, and include speaker identification and sound effects.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.2.3',
    title: 'Audio Description or Media Alternative (Prerecorded)',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'For prerecorded video content, check that either audio description or a media alternative is provided. Audio description should describe important visual information not conveyed through audio.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.2.4',
    title: 'Captions (Live)',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'For live audio content, check that captions are provided. Captions should be synchronized and accurate for live content.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/captions-live.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.2.5',
    title: 'Audio Description (Prerecorded)',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'For prerecorded video content, check that audio description is provided for important visual information not conveyed through audio.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.3.1',
    title: 'Info and Relationships',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'Verify that information, structure, and relationships conveyed through presentation can be programmatically determined. Check heading structure, list markup, table headers, form labels, and semantic elements.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.3.2',
    title: 'Meaningful Sequence',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'Check that when content is presented in a sequence that affects meaning, the reading sequence can be programmatically determined. Test with screen readers and keyboard navigation.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.3.3',
    title: 'Sensory Characteristics',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'Ensure that instructions do not rely solely on sensory characteristics such as shape, size, visual location, orientation, or sound to convey information.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.3.4',
    title: 'Orientation',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Check that content does not restrict its view and operation to a single display orientation, such as portrait or landscape, unless a specific display orientation is essential.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/orientation.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.3.5',
    title: 'Identify Input Purpose',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Verify that the purpose of each input field collecting information about the user can be programmatically determined when the input field serves a purpose identified in the Input Purposes for User Interface Components section.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.1',
    title: 'Use of Color',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'Ensure that color is not the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.2',
    title: 'Audio Control',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'Check that if any audio on a Web page plays automatically for more than 3 seconds, either a mechanism is available to pause or stop the audio, or a mechanism is available to control audio volume independently from the overall system volume level.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.3',
    title: 'Contrast (Minimum)',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Check that text and background colors have sufficient contrast ratio: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold). Use color contrast analyzer tools.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.4',
    title: 'Resize text',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Check that text can be resized without assistive technology up to 200 percent without loss of content or functionality.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.5',
    title: 'Images of Text',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Verify that if the same visual presentation can be made by text alone, an image is not used to present that text.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.6',
    title: 'Contrast (Enhanced)',
    level: 'AAA',
    principle: 'Perceivable',
    howToTest: 'Check that text and background colors have enhanced contrast ratio: 7:1 for normal text, 4.5:1 for large text (18pt+ or 14pt+ bold). Use color contrast analyzer tools.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.7',
    title: 'Low or No Background Audio',
    level: 'AAA',
    principle: 'Perceivable',
    howToTest: 'For prerecorded audio-only content that contains speech in the foreground, check that either no background sounds are present, background sounds can be turned off, or background sounds are at least 20 decibels lower than the foreground speech content.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/low-or-no-background-audio.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.8',
    title: 'Visual Presentation',
    level: 'AAA',
    principle: 'Perceivable',
    howToTest: 'Check that for the visual presentation of blocks of text, a mechanism is available to achieve the following: foreground and background colors can be selected by the user, width is no more than 80 characters or glyphs, text is not justified, line spacing is at least space-and-a-half within paragraphs, and paragraph spacing is at least 1.5 times larger than the line spacing.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.9',
    title: 'Images of Text (No Exception)',
    level: 'AAA',
    principle: 'Perceivable',
    howToTest: 'Verify that images of text are only used for pure decoration or where a particular presentation of text is essential to the information being conveyed.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/images-of-text-no-exception.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.10',
    title: 'Reflow',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Check that content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions for vertical scrolling content at a width equivalent to 320 CSS pixels.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/reflow.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.11',
    title: 'Non-text Contrast',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Verify that the visual presentation of user interface components and graphical objects has a contrast ratio of at least 3:1 against adjacent color(s).',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '1.4.12',
    title: 'Text Spacing',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Check that no loss of content or functionality occurs by setting line height to at least 1.5 times the font size, paragraph spacing to at least 2 times the font size, letter spacing to at least 0.12 times the font size, and word spacing to at least 0.16 times the font size.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.1.1',
    title: 'Keyboard',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Test that all functionality is available using only the keyboard. Check tab order, focus indicators, and that no keyboard traps exist. Test with Tab, Shift+Tab, Enter, Space, and arrow keys.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.1.2',
    title: 'No Keyboard Trap',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Verify that keyboard focus can be moved away from any component using standard navigation keys. If non-standard keys are required, ensure users are informed of the method.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.1.3',
    title: 'Keyboard (No Exception)',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Test that all functionality is available using only the keyboard, including complex interactions and custom controls. Verify that no functionality requires mouse or touch input.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard-no-exception.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.1.4',
    title: 'Character Key Shortcuts',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Check that if a keyboard shortcut is implemented in content using only letter (including upper- and lower-case letters), punctuation, number, or symbol characters, then at least one of the following is true: the shortcut can be turned off, remapped, or is only active when that component has focus.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.2.1',
    title: 'Timing Adjustable',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Check that for each time limit that is set by the content, at least one of the following is true: the user can turn off the time limit before encountering it, adjust it to at least 10 times the default setting, or extend it at least 10 times when the user takes an action.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.2.2',
    title: 'Pause, Stop, Hide',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Verify that for moving, blinking, scrolling, or auto-updating information, users can pause, stop, or hide it unless the movement, blinking, or scrolling is part of an activity where it is essential.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.2.3',
    title: 'No Timing',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Check that timing is not an essential part of the event or activity presented by the content, except for non-interactive synchronized media and real-time events.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/no-timing.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.2.4',
    title: 'Interruptions',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Verify that interruptions can be postponed or suppressed by the user, except interruptions involving an emergency.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/interruptions.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.2.5',
    title: 'Re-authenticating',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Check that when an authenticated session expires, the user can continue the activity without loss of data after re-authenticating.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/re-authenticating.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.2.6',
    title: 'Timeouts',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Verify that users are warned of the duration of any user inactivity that could cause data loss, unless the data is preserved for more than 20 hours when the user does not take any actions.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/timeouts.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.3.1',
    title: 'Three Flashes or Below Threshold',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Check that Web pages do not contain anything that flashes more than three times in any one second period, or the flash is below the general flash and red flash thresholds.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.3.2',
    title: 'Three Flashes',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Verify that Web pages do not contain anything that flashes more than three times in any one second period.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/three-flashes.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.1',
    title: 'Bypass Blocks',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Check that a mechanism is available to bypass blocks of content that are repeated on multiple pages. Look for skip links, proper heading structure, or landmark regions.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.2',
    title: 'Page Titled',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Verify that web pages have titles that describe topic or purpose. Check that page titles are descriptive and help users understand page content.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.3',
    title: 'Focus Order',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Check that if a Web page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.4',
    title: 'Link Purpose (In Context)',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Verify that the purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined link context.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.5',
    title: 'Multiple Ways',
    level: 'AA',
    principle: 'Operable',
    howToTest: 'Check that more than one way is available to locate a Web page within a set of Web pages except where the Web Page is the result of, or a step in, a process.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.6',
    title: 'Headings and Labels',
    level: 'AA',
    principle: 'Operable',
    howToTest: 'Verify that headings and labels describe topic or purpose. Check that headings provide a logical structure and labels clearly identify form controls.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.7',
    title: 'Focus Visible',
    level: 'AA',
    principle: 'Operable',
    howToTest: 'Check that any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.8',
    title: 'Location',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Verify that information about the user\'s location within a set of Web pages is available.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/location.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.9',
    title: 'Link Purpose (Link Only)',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Check that the purpose of each link can be determined from the link text alone, except where the purpose of the link would be ambiguous to users in general.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-link-only.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.10',
    title: 'Section Headings',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Verify that section headings are used to organize the content. Check that headings provide a logical structure and are not used for visual formatting alone.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/section-headings.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.5.1',
    title: 'Pointer Gestures',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Check that all functionality that uses multipoint or path-based gestures for operation can be operated with a single pointer without a path-based gesture, unless a multipoint or path-based gesture is essential.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.5.2',
    title: 'Pointer Cancellation',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Verify that for functionality that can be operated using a single pointer, at least one of the following is true: no down-event of the pointer is executed, the up-event reverses any outcome of the preceding down-event, or the up-event is essential to the function.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.5.3',
    title: 'Label in Name',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Check that for user interface components with labels that include text or images of text, the name contains the text that is presented visually.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.5.4',
    title: 'Motion Actuation',
    level: 'A',
    principle: 'Operable',
    howToTest: 'Verify that functionality that can be operated by device motion or user motion can also be operated by user interface components and responding to the motion can be disabled to prevent accidental actuation.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/motion-actuation.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.5.5',
    title: 'Target Size (Enhanced)',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Check that target size is at least 44 by 44 CSS pixels except when the target is in a sentence or block of text, the target is available on a page or viewport that provides an equivalent target at least 44 by 44 CSS pixels, or the target is controlled by the user agent and is not modified by the author.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.5.6',
    title: 'Concurrent Input Mechanisms',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Verify that web content does not restrict use of input modalities available on a platform except where the restriction is essential, required to ensure the security of the content, or required to respect user settings.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/concurrent-input-mechanisms.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.1.1',
    title: 'Language of Page',
    level: 'A',
    principle: 'Understandable',
    howToTest: 'Check that the default human language of each web page can be programmatically determined using the lang attribute on the html element.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.1.2',
    title: 'Language of Parts',
    level: 'AA',
    principle: 'Understandable',
    howToTest: 'Verify that the human language of each passage or phrase in the content can be programmatically determined except for proper names, technical terms, words of indeterminate language, and words or phrases that have become part of the vernacular of the immediately surrounding text.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.1.3',
    title: 'Unusual Words',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Check that a mechanism is available for identifying specific definitions of words or phrases used in an unusual or restricted way, including idioms and jargon.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/unusual-words.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.1.4',
    title: 'Abbreviations',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Verify that a mechanism for identifying the expanded form or meaning of abbreviations is available.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/abbreviations.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.1.5',
    title: 'Reading Level',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Check that when text requires reading ability more advanced than the lower secondary education level, supplemental content or a version that does not require reading ability more advanced than the lower secondary education level is available.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.1.6',
    title: 'Pronunciation',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Verify that a mechanism is available for identifying specific pronunciation of words where meaning of the words, in context, is ambiguous without knowing the pronunciation.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/pronunciation.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.2.1',
    title: 'On Focus',
    level: 'A',
    principle: 'Understandable',
    howToTest: 'Check that when any component receives focus, it does not initiate a change of context.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.2.2',
    title: 'On Input',
    level: 'A',
    principle: 'Understandable',
    howToTest: 'Verify that changing the setting of any user interface component does not automatically cause a change of context unless the user has been advised of the behavior before using the component.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/on-input.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.2.3',
    title: 'Consistent Navigation',
    level: 'AA',
    principle: 'Understandable',
    howToTest: 'Check that navigational mechanisms that are repeated on multiple Web pages within a set of Web pages occur in the same relative order each time they are presented, unless a change is initiated by the user.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.2.4',
    title: 'Consistent Identification',
    level: 'AA',
    principle: 'Understandable',
    howToTest: 'Verify that components that have the same functionality within a set of Web pages are identified consistently.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.2.5',
    title: 'Change on Request',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Check that changes of context are initiated only by user request or a mechanism is available to turn off such changes.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.3.1',
    title: 'Error Identification',
    level: 'A',
    principle: 'Understandable',
    howToTest: 'Check that if an input error is automatically detected, the item that is in error is identified and the error is described to the user in text.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.3.2',
    title: 'Labels or Instructions',
    level: 'A',
    principle: 'Understandable',
    howToTest: 'Verify that labels or instructions are provided when content requires user input.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.3.3',
    title: 'Error Suggestion',
    level: 'AA',
    principle: 'Understandable',
    howToTest: 'Check that if an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.3.4',
    title: 'Error Prevention (Legal, Financial, Data)',
    level: 'AA',
    principle: 'Understandable',
    howToTest: 'Verify that for Web pages that cause legal commitments or financial transactions for the user to occur, that modify or delete user-controllable data in data storage systems, or that submit user test responses, at least one of the following is true: submissions are reversible, checked for input errors, or confirmed before submission.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.3.5',
    title: 'Help',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Check that context-sensitive help is available.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/help.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '3.3.6',
    title: 'Error Prevention (All)',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Verify that for Web pages that require user input, at least one of the following is true: submissions are reversible, checked for input errors, or confirmed before submission.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-all.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '4.1.1',
    title: 'Parsing',
    level: 'A',
    principle: 'Robust',
    howToTest: 'Validate that content implemented using markup languages has elements with complete start and end tags, unique IDs, and properly nested elements according to specifications.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/parsing.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '4.1.2',
    title: 'Name, Role, Value',
    level: 'A',
    principle: 'Robust',
    howToTest: 'Check that for all user interface components, the name and role can be programmatically determined. Verify that states, properties, and values can be programmatically set and that user agents, including assistive technologies, are notified of changes.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '4.1.3',
    title: 'Status Messages',
    level: 'AA',
    principle: 'Robust',
    howToTest: 'Verify that in content implemented using markup languages, status messages can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without receiving focus.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
    wcagVersion: '2.1'
  },

  // WCAG 2.2 AA New Criteria
  {
    wcagId: '2.4.11',
    title: 'Focus Not Obscured (Minimum)',
    level: 'AA',
    principle: 'Operable',
    howToTest: 'Check that when a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '2.4.12',
    title: 'Focus Not Obscured (Enhanced)',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Check that when a user interface component receives keyboard focus, no part of the component is hidden by author-created content.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '2.5.7',
    title: 'Dragging Movements',
    level: 'AA',
    principle: 'Operable',
    howToTest: 'Verify that all functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging, unless dragging is essential or the function is conforming to an industry standard.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '2.5.8',
    title: 'Target Size (Minimum)',
    level: 'AA',
    principle: 'Operable',
    howToTest: 'Check that target size is at least 24 by 24 CSS pixels except when the target is in a sentence or block of text, the target is available on a page or viewport that provides an equivalent target at least 24 by 24 CSS pixels, or the target is controlled by the user agent and is not modified by the author.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '3.2.6',
    title: 'Consistent Help',
    level: 'A',
    principle: 'Understandable',
    howToTest: 'Verify that if a Web page contains any of the following help mechanisms, and those mechanisms are repeated on multiple Web pages within a set of Web pages, they occur in the same relative order on each page: human contact information, human contact mechanism, self-help option, or a fully automated contact mechanism.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '3.3.7',
    title: 'Redundant Entry',
    level: 'A',
    principle: 'Understandable',
    howToTest: 'Check that for steps in a process that are not essential to the completion of the process, information previously entered by or provided to the user that is required on the same page or set of pages is auto-populated or available for the user to select.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '3.3.8',
    title: 'Accessible Authentication (Minimum)',
    level: 'AA',
    principle: 'Understandable',
    howToTest: 'Verify that a cognitive function test (such as remembering a password or solving a puzzle) is not required for any step in an authentication process unless that step provides at least one of the following: alternative authentication method, mechanism to assist the user in completing the cognitive function test, or mechanism to provide an accessible alternative.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '3.3.9',
    title: 'Accessible Authentication (Enhanced)',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Verify that a cognitive function test (such as remembering a password or solving a puzzle) is not required for any step in an authentication process.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-enhanced.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '2.4.13',
    title: 'Page Break Navigation',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Check that a mechanism is available to navigate to each page break in web content that has page break locators.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/page-break-navigation.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '2.5.9',
    title: 'Accessible Authentication (No Exception)',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Verify that a cognitive function test (such as remembering a password or solving a puzzle) is not required for any step in an authentication process, and that the authentication process does not rely on a cognitive function test.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-no-exception.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '3.2.7',
    title: 'Accessible Authentication (No Exception)',
    level: 'AAA',
    principle: 'Understandable',
    howToTest: 'Check that a cognitive function test (such as remembering a password or solving a puzzle) is not required for any step in an authentication process.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-no-exception.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '4.1.4',
    title: 'Status Messages',
    level: 'AA',
    principle: 'Robust',
    howToTest: 'Verify that in content implemented using markup languages, status messages can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without receiving focus.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '1.4.13',
    title: 'Content on Hover or Focus',
    level: 'AA',
    principle: 'Perceivable',
    howToTest: 'Check that where receiving and then removing pointer hover or keyboard focus triggers additional content to become visible and then hidden, the following are true: dismissible, hoverable, and persistent.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html',
    wcagVersion: '2.1'
  },
  {
    wcagId: '2.4.14',
    title: 'Focus Not Obscured (Enhanced)',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Check that when a user interface component receives keyboard focus, no part of the component is hidden by author-created content.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html',
    wcagVersion: '2.2'
  },
  {
    wcagId: '2.5.10',
    title: 'Concurrent Input Mechanisms',
    level: 'AAA',
    principle: 'Operable',
    howToTest: 'Verify that web content does not restrict use of input modalities available on a platform except where the restriction is essential, required to ensure the security of the content, or required to respect user settings.',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/concurrent-input-mechanisms.html',
    wcagVersion: '2.2'
  }
];

export function getCriteriaForVersion(version: '2.1' | '2.2'): WCAGCriterion[] {
  return WCAG_CRITERIA.filter(criterion => 
    criterion.wcagVersion === version || 
    (version === '2.2' && criterion.wcagVersion === '2.1')
  );
}

export function getCriteriaForLevel(level: 'A' | 'AA' | 'AAA'): WCAGCriterion[] {
  const levelOrder = { 'A': 1, 'AA': 2, 'AAA': 3 };
  return WCAG_CRITERIA.filter(criterion => 
    levelOrder[criterion.level] <= levelOrder[level]
  );
}

export function getCriteriaForVersionAndLevel(version: '2.1' | '2.2', level: 'A' | 'AA' | 'AAA'): WCAGCriterion[] {
  const versionCriteria = getCriteriaForVersion(version);
  const levelOrder = { 'A': 1, 'AA': 2, 'AAA': 3 };
  return versionCriteria.filter(criterion => 
    levelOrder[criterion.level] <= levelOrder[level]
  );
}

export function groupCriteriaByPrinciple(criteria: WCAGCriterion[]): Record<string, WCAGCriterion[]> {
  return criteria.reduce((groups, criterion) => {
    if (!groups[criterion.principle]) {
      groups[criterion.principle] = [];
    }
    groups[criterion.principle].push(criterion);
    return groups;
  }, {} as Record<string, WCAGCriterion[]>);
}
