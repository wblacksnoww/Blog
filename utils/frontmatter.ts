export const parseFrontmatter = (text: string) => {
  // Regex for Frontmatter
  const pattern = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/;
  const match = text.match(pattern);

  if (match) {
    const frontmatter = match[1];
    const content = match[2].trim();
    const metadata: any = {};

    frontmatter.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join(':').trim();
        
        // Basic array handling for YAML [item1, item2]
        if (value.startsWith('[') && value.endsWith(']')) {
           const inner = value.slice(1, -1);
           const arrayValues = inner.split(',').map(v => {
             v = v.trim();
             // Remove quotes if present around array items
             if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
               return v.slice(1, -1);
             }
             return v;
           }).filter(Boolean);
           metadata[key] = arrayValues;
        } else {
           // Remove quotes if present
           if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
             value = value.slice(1, -1);
           }
           metadata[key] = value;
        }
      }
    });

    return { metadata, content };
  }
  return { metadata: {}, content: text };
};

export const stringifyFrontmatter = (post: { title: string; tags: string[]; categories: string[]; publishedAt: string }, content: string): string => {
  // Ensure we quote strings in arrays for better YAML compliance
  const quoteArray = (arr: string[]) => `[${arr.map(s => `"${s}"`).join(', ')}]`;

  const frontmatter = [
    '---',
    `title: "${post.title}"`,
    `date: ${post.publishedAt}`,
    `tags: ${quoteArray(post.tags)}`,
    `categories: ${quoteArray(post.categories)}`,
    '---',
    '',
    content
  ].join('\n');

  return frontmatter;
};