import sanitizeHtml from 'sanitize-html';

// Allowlist for rich-text content (blog posts, course descriptions, lessons).
// Scripts, event handlers, iframes, and javascript: URLs are stripped.
const ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
  'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'span', 'div', 'figure', 'figcaption',
  'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class'],
};

export function sanitizeHtmlContent(html: unknown): string {
  if (typeof html !== 'string') return '';
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    // Strip links that resolve to javascript: or other unsafe schemes.
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}
