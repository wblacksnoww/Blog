const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
// Default to a 'posts' directory in the parent folder if not specified
const POSTS_DIR = process.env.POSTS_DIR || path.join(__dirname, '../posts');

app.use(cors());
app.use(express.json());

// Ensure posts directory exists
(async () => {
  try {
    await fs.access(POSTS_DIR);
  } catch {
    console.log(`Creating posts directory at ${POSTS_DIR}`);
    await fs.mkdir(POSTS_DIR, { recursive: true });
  }
})();

// Helper: Parse a single markdown file
async function parsePost(filename) {
  const filePath = path.join(POSTS_DIR, filename);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const { data, content: markdownBody } = matter(content);
    
    // Get file stats for creation/modification times if not in metadata
    const stats = await fs.stat(filePath);

    return {
      id: filename,
      title: data.title || filename.replace('.md', ''),
      excerpt: data.excerpt || markdownBody.substring(0, 150) + '...',
      content: markdownBody,
      tags: data.tags || [],
      categories: data.categories || [],
      author: data.author || { name: 'Local User', avatarUrl: 'https://ui-avatars.com/api/?name=Local+User' },
      publishedAt: data.date || stats.mtime.toISOString(),
      readTimeMinutes: Math.ceil(markdownBody.split(' ').length / 200) || 1,
      coverImageUrl: data.coverImage || `https://picsum.photos/seed/${filename}/1200/800`
    };
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return null;
  }
}

// GET /api/posts - List all posts
app.get('/api/posts', async (req, res) => {
  try {
    const files = await fs.readdir(POSTS_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    const postsPromises = mdFiles.map(filename => parsePost(filename));
    const posts = (await Promise.all(postsPromises)).filter(post => post !== null);
    
    // Sort by date descending
    posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/posts - Create or Update a post
app.post('/api/posts', async (req, res) => {
  try {
    const post = req.body;
    
    // Sanitize filename
    let filename = post.id;
    if (!filename || !filename.endsWith('.md')) {
        // Create a filename from title if ID is not a filename
        const safeTitle = (post.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        filename = `${safeTitle}.md`;
    }

    const filePath = path.join(POSTS_DIR, filename);
    
    // Construct frontmatter
    const frontmatter = {
      title: post.title || 'Untitled',
      date: post.publishedAt || new Date().toISOString(),
      tags: post.tags || [],
      categories: post.categories || [],
      excerpt: post.excerpt || '',
      author: post.author || { name: 'Local User' }
    };
    
    // console.error('Body:', req.body);
    // console.error('Frontmatter:', frontmatter);
    
    const fileContent = matter.stringify(post.content || '', frontmatter);
    
    await fs.writeFile(filePath, fileContent);
    
    // Return the saved post (re-parsed to ensure consistency)
    const savedPost = await parsePost(filename);
    res.json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} - VERSION 3`);
  console.log(`Serving posts from: ${POSTS_DIR}`);
});
