import { BlogPost, FileSystemDirectoryHandle, FileSystemFileHandle } from '../types';
import { parseFrontmatter, stringifyFrontmatter } from '../utils/frontmatter';

// Helper to check if browser supports the API
export const isFileSystemSupported = () => {
  return 'showDirectoryPicker' in window;
};

export const openVault = async (): Promise<FileSystemDirectoryHandle> => {
  // @ts-ignore - native API
  const dirHandle = await window.showDirectoryPicker({
    mode: 'readwrite'
    // removed startIn to improve compatibility
  });
  return dirHandle;
};

export const scanVault = async (dirHandle: FileSystemDirectoryHandle): Promise<BlogPost[]> => {
  const posts: BlogPost[] = [];

  // Recursive traversal function
  const traverse = async (currentHandle: FileSystemDirectoryHandle) => {
    for await (const entry of currentHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.md')) {
        const fileHandle = entry as FileSystemFileHandle;
        try {
          const file = await fileHandle.getFile();
          const text = await file.text();
          const { metadata, content } = parseFrontmatter(text);
          
          posts.push({
            id: file.name, // Use filename as ID for sync
            title: metadata.title || file.name.replace('.md', ''),
            excerpt: content.substring(0, 150) + '...',
            content: content,
            author: {
              name: 'Local User',
              avatarUrl: 'https://ui-avatars.com/api/?name=Local+User&background=random'
            },
            coverImageUrl: `https://picsum.photos/seed/${file.name}/1200/800`,
            publishedAt: metadata.date || new Date(file.lastModified).toISOString(),
            readTimeMinutes: Math.ceil(content.split(' ').length / 200) || 1,
            tags: Array.isArray(metadata.tags) ? metadata.tags : [],
            categories: Array.isArray(metadata.categories) ? metadata.categories : ['Obsidian'],
            fileHandle: fileHandle
          });
        } catch (e) {
          console.warn(`Failed to parse file ${entry.name}`, e);
        }
      } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
        // Recursively scan subdirectories, ignoring hidden ones (like .obsidian)
        await traverse(entry as FileSystemDirectoryHandle);
      }
    }
  };

  await traverse(dirHandle);
  return posts;
};

// Fallback for browsers that don't support File System Access API
export const scanFileList = async (fileList: FileList): Promise<BlogPost[]> => {
  const posts: BlogPost[] = [];
  
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    if (file.name.endsWith('.md')) {
      try {
        const text = await file.text();
        const { metadata, content } = parseFrontmatter(text);
        
        posts.push({
            id: file.name,
            title: metadata.title || file.name.replace('.md', ''),
            excerpt: content.substring(0, 150) + '...',
            content: content,
            author: {
              name: 'Local User',
              avatarUrl: 'https://ui-avatars.com/api/?name=Local+User&background=random'
            },
            coverImageUrl: `https://picsum.photos/seed/${file.name}/1200/800`,
            publishedAt: metadata.date || new Date(file.lastModified).toISOString(),
            readTimeMinutes: Math.ceil(content.split(' ').length / 200) || 1,
            tags: Array.isArray(metadata.tags) ? metadata.tags : [],
            categories: Array.isArray(metadata.categories) ? metadata.categories : ['Obsidian'],
            // No fileHandle means read-only
          });
      } catch (e) {
        console.warn(`Failed to parse file ${file.name}`, e);
      }
    }
  }
  return posts;
};

export const saveToVault = async (post: BlogPost, dirHandle?: FileSystemDirectoryHandle): Promise<BlogPost> => {
  let handle = post.fileHandle;
  
  // Create new file if it doesn't exist and we have a directory handle
  if (!handle && dirHandle) {
    // Sanitize filename
    const filename = `${post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    handle = await dirHandle.getFileHandle(filename, { create: true });
  }

  if (!handle) {
    throw new Error("No file handle available and no vault connected to create one.");
  }

  const fileContent = stringifyFrontmatter({
    title: post.title,
    tags: post.tags,
    categories: post.categories,
    publishedAt: post.publishedAt
  }, post.content);

  const writable = await handle.createWritable();
  await writable.write(fileContent);
  await writable.close();

  return {
    ...post,
    fileHandle: handle,
    id: handle.name // Update ID to match filename if it was new
  };
};