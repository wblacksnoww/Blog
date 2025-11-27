import React, { useState, useRef, useEffect } from 'react';
import { generateBlogPost } from '../services/geminiService';
import { BlogPost, GeneratedBlogResponse, FileSystemDirectoryHandle } from '../types';
import { Wand2, Loader2, Save, Sparkles, PenTool, Upload, FileText, HardDrive } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { parseFrontmatter } from '../utils/frontmatter';
import { saveToVault } from '../services/fileSystem';

interface EditorProps {
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
  currentUser: { name: string; avatarUrl: string };
  initialPost?: BlogPost | null;
  vaultHandle: FileSystemDirectoryHandle | null;
}

export const Editor: React.FC<EditorProps> = ({ onSave, onCancel, currentUser, initialPost, vaultHandle }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedBlogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Manual edit states
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [manualCategories, setManualCategories] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state if editing an existing post
  useEffect(() => {
    if (initialPost) {
      setManualTitle(initialPost.title);
      setManualContent(initialPost.content);
      setManualTags(initialPost.tags.join(', '));
      setManualCategories(initialPost.categories.join(', '));
      
      // Seed the generated object to show the preview
      setGeneratedPost({
        title: initialPost.title,
        content: initialPost.content,
        excerpt: initialPost.excerpt,
        tags: initialPost.tags,
        categories: initialPost.categories,
        readTimeMinutes: initialPost.readTimeMinutes
      });
    }
  }, [initialPost]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateBlogPost(topic, tone);
      setGeneratedPost(result);
      // Sync manual states
      setManualTitle(result.title);
      setManualContent(result.content);
      setManualTags(result.tags.join(', '));
      setManualCategories(result.categories.join(', '));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong generating the post.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartBlank = () => {
    setManualTitle('');
    setManualContent('');
    setManualTags('');
    setManualCategories('');
    
    // Initialize a blank "generated" post to unlock the editor UI
    setGeneratedPost({
      title: '',
      content: '',
      excerpt: '',
      tags: [],
      categories: [],
      readTimeMinutes: 0
    });
  };

  const handlePublish = async () => {
    const titleToUse = manualTitle;
    const contentToUse = manualContent;

    if (!titleToUse || !contentToUse) {
       setError("Title and content are required to publish.");
       return;
    }

    setIsSaving(true);
    setError(null);

    const tagsArray = manualTags.split(',').map(t => t.trim()).filter(Boolean);
    const categoriesArray = manualCategories.split(',').map(c => c.trim()).filter(Boolean);

    let newPost: BlogPost = {
      id: initialPost?.id || uuidv4(), // Use existing ID if editing
      title: titleToUse,
      content: contentToUse,
      excerpt: generatedPost?.excerpt || contentToUse.substring(0, 150) + "...",
      tags: tagsArray.length > 0 ? tagsArray : ['General'],
      categories: categoriesArray.length > 0 ? categoriesArray : ['Uncategorized'],
      readTimeMinutes: Math.ceil(contentToUse.split(' ').length / 200) || 1,
      author: initialPost?.author || currentUser,
      coverImageUrl: initialPost?.coverImageUrl || `https://picsum.photos/1200/800?random=${Math.floor(Math.random() * 1000)}`,
      publishedAt: initialPost?.publishedAt || new Date().toISOString(),
      fileHandle: initialPost?.fileHandle // Preserve handle if exists
    };

    try {
      // If we have a file handle (editing local file) OR we are connected to a vault (creating new local file)
      if (newPost.fileHandle || (vaultHandle && !initialPost)) {
        newPost = await saveToVault(newPost, vaultHandle || undefined);
      }
      onSave(newPost);
    } catch (e) {
      console.error(e);
      setError("Failed to save file to local system. " + (e instanceof Error ? e.message : ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { metadata, content } = parseFrontmatter(text);

      // Extract details or fallback to defaults
      const title = metadata.title || file.name.replace(/\.(md|txt)$/, '');
      const tags = Array.isArray(metadata.tags) ? metadata.tags.join(', ') : (metadata.tags || '');
      const categories = Array.isArray(metadata.categories) ? metadata.categories.join(', ') : (metadata.category || metadata.categories || 'Imported');

      setManualTitle(title);
      setManualContent(content);
      setManualTags(tags);
      setManualCategories(categories);
      
      // Mock a generated post object so the preview renders
      setGeneratedPost({
        title,
        content,
        excerpt: content.substring(0, 100) + '...',
        tags: tags.split(',').filter((t: string) => t.trim()),
        categories: categories.split(',').filter((t: string) => t.trim()),
        readTimeMinutes: Math.ceil(content.split(' ').length / 200)
      });
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        
        {/* Left Panel: Controls */}
        <div className="w-full md:w-1/3 bg-slate-900 p-8 text-white flex flex-col overflow-y-auto">
           <div className="flex items-center space-x-2 mb-8 text-blue-400">
             <Sparkles className="w-6 h-6" />
             <span className="text-xl font-bold tracking-tight">
                {initialPost ? 'Edit Post' : 'Editor Studio'}
             </span>
           </div>

           <div className="space-y-6 flex-1">
             
             {/* Import Section */}
             <div className="pb-6 border-b border-slate-700 mb-2">
                <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
                   Import Single File
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".md,.txt" 
                  className="hidden" 
                />
                <button 
                  onClick={triggerFileInput}
                  className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-200 rounded-lg flex items-center justify-center text-sm transition-all font-medium group"
                >
                  <Upload className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> 
                  Upload .md File
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  {vaultHandle 
                    ? <span className="text-green-400 flex items-center justify-center"><HardDrive className="w-3 h-3 mr-1"/> Vault Connected: Sync active</span> 
                    : "Connect Obsidian Vault in Admin to sync folder."}
                </p>
             </div>

             {/* AI Generation Section - Hide if editing existing post to avoid confusion, or keep optional */}
             {!initialPost && (
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
                   Generate with AI
                 </label>
                 <textarea
                   className="w-full h-24 bg-slate-800 border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all text-sm"
                   placeholder="E.g. The future of quantum computing..."
                   value={topic}
                   onChange={(e) => setTopic(e.target.value)}
                   disabled={isGenerating}
                 />
                 <div className="mt-2 grid grid-cols-2 gap-2">
                   {['Professional', 'Witty', 'Casual', 'Academic'].map((t) => (
                     <button
                       key={t}
                       onClick={() => setTone(t)}
                       className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors border ${tone === t ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                     >
                       {t}
                     </button>
                   ))}
                 </div>
                 <button
                   onClick={handleGenerate}
                   disabled={!topic || isGenerating}
                   className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold flex items-center justify-center transition-all shadow-lg shadow-blue-900/20 mt-3 text-sm"
                 >
                   {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                   {isGenerating ? 'Generating...' : 'Generate Draft'}
                 </button>

                 <div className="mt-6 text-center">
                   <p className="text-xs text-slate-500 mb-2">- OR -</p>
                   <button 
                     onClick={handleStartBlank}
                     className="text-sm text-slate-300 hover:text-white border-b border-dashed border-slate-500 hover:border-white transition-colors pb-0.5"
                   >
                     Start with a blank draft
                   </button>
                 </div>
               </div>
             )}

             {/* Manual Metadata Editing */}
             {(generatedPost || initialPost) && (
               <div className="pt-6 border-t border-slate-700 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Categories (comma separated)</label>
                    <input 
                      type="text" 
                      value={manualCategories} 
                      onChange={(e) => setManualCategories(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      value={manualTags} 
                      onChange={(e) => setManualTags(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
               </div>
             )}

             {error && (
               <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                 {error}
               </div>
             )}
           </div>
           
           <div className="mt-8 pt-4 border-t border-slate-800 text-center">
             <button onClick={onCancel} className="text-slate-400 hover:text-white text-sm transition-colors">
               Cancel and go back
             </button>
           </div>
        </div>

        {/* Right Panel: Preview & Edit */}
        <div className="w-full md:w-2/3 flex flex-col h-full">
           {!generatedPost && !initialPost ? (
             <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center text-slate-400 space-y-6 p-8">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-2">
                  <PenTool className="w-10 h-10 text-slate-400" />
                </div>
                <div className="text-center max-w-md">
                   <h3 className="text-xl font-bold text-slate-800 mb-2">Create New Post</h3>
                   <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                     You can generate a draft with AI, upload an existing markdown file from your Obsidian vault, or simply start writing from scratch.
                   </p>
                   
                   <button 
                     onClick={handleStartBlank}
                     className="px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center mx-auto"
                   >
                     <PenTool className="w-4 h-4 mr-2" />
                     Start Writing Manually
                   </button>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col h-full bg-white">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                   <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-400"/>
                      <span className="text-sm font-medium text-slate-600">
                         {initialPost ? 'Editing Mode' : 'Preview Mode'}
                      </span>
                      {initialPost?.fileHandle && (
                        <span className="flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                           <HardDrive className="w-3 h-3 mr-1"/> Local File
                        </span>
                      )}
                      {!initialPost && vaultHandle && (
                        <span className="flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                           <HardDrive className="w-3 h-3 mr-1"/> Will Save to Vault
                        </span>
                      )}
                   </div>
                   <button 
                      onClick={handlePublish}
                      disabled={isSaving}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />} 
                      {initialPost ? 'Update Post' : 'Publish Post'}
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none">
                  <input 
                    type="text" 
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full text-4xl font-bold text-slate-900 border-none focus:ring-0 placeholder-slate-300 font-serif px-0"
                    placeholder="Post Title"
                  />
                  
                  <div className="flex flex-wrap gap-2 my-4">
                     {manualCategories.split(',').map((c, i) => c.trim() && (
                        <span key={`c-${i}`} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium">{c.trim()}</span>
                     ))}
                     {manualTags.split(',').map((t, i) => t.trim() && (
                        <span key={`t-${i}`} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">#{t.trim()}</span>
                     ))}
                  </div>

                  <textarea 
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="w-full h-full min-h-[500px] resize-y border-none focus:ring-0 text-slate-700 leading-relaxed -ml-1"
                    placeholder="Write your story..."
                  />
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};