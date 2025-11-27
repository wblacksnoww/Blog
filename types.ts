export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  author: {
    name: string;
    avatarUrl: string;
  };
  coverImageUrl: string;
  publishedAt: string;
  readTimeMinutes: number;
  tags: string[];
  categories: string[];
  fileHandle?: FileSystemFileHandle; // Reference to the local file
}

export interface GeneratedBlogResponse {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  readTimeMinutes: number;
}

export enum ViewState {
  HOME = 'HOME',
  ARTICLE = 'ARTICLE',
  EDITOR = 'EDITOR'
}

// Minimal type definitions for File System Access API
// as they might not be in all TS environments by default
export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  close(): Promise<void>;
}