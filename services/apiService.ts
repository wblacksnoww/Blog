import { BlogPost } from '../types';

// In production, we use the relative path /api which Nginx will proxy
// In development (Vite), we also use /api which Vite proxies
const API_BASE = '/api';

export const fetchPosts = async (): Promise<BlogPost[]> => {
  console.log(`Fetching posts from: ${API_BASE}/posts`);
  try {
    const response = await fetch(`${API_BASE}/posts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Fetch posts error:", error);
    throw error;
  }
};

export const savePost = async (post: BlogPost): Promise<BlogPost> => {
  console.log(`Saving post to: ${API_BASE}/posts`);
  try {
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save post: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Save post error:", error);
    throw error;
  }
};
