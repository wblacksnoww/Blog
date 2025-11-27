import React, { useEffect } from 'react';
import { BlogPost } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ArrowLeft, Calendar, Clock, Share2, Bookmark, Edit2 } from 'lucide-react';

interface ArticleProps {
  post: BlogPost;
  onBack: () => void;
  onEdit: () => void;
  isAdmin: boolean;
}

export const Article: React.FC<ArticleProps> = ({ post, onBack, onEdit, isAdmin }) => {
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[400px] w-full">
        <div className="absolute inset-0">
          <img 
            src={post.coverImageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        </div>
        
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
           <button 
             onClick={onBack}
             className="inline-flex items-center text-white/90 hover:text-white transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium"
           >
             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
           </button>

           {isAdmin && (
             <button 
               onClick={onEdit}
               className="inline-flex items-center text-white/90 hover:text-white transition-colors bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-blue-500/50 shadow-lg"
             >
               <Edit2 className="w-4 h-4 mr-2" /> Edit Post
             </button>
           )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 sm:px-6 pb-12">
           <div className="flex items-center space-x-4 text-white/90 text-sm mb-4 font-medium flex-wrap gap-y-2">
             <div className="flex gap-2">
               {post.categories.map(cat => (
                 <span key={cat} className="bg-blue-600 text-white px-3 py-1 rounded-md">{cat}</span>
               ))}
             </div>
             <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5"/> {new Date(post.publishedAt).toLocaleDateString()}</span>
             <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5"/> {post.readTimeMinutes} min read</span>
           </div>
           <h1 className="text-3xl md:text-5xl font-bold text-white font-serif leading-tight mb-6 shadow-sm">
             {post.title}
           </h1>
           <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                 <img src={post.author.avatarUrl} alt={post.author.name} className="w-12 h-12 rounded-full border-2 border-white/50" />
                 <div>
                    <p className="text-white font-semibold text-lg">{post.author.name}</p>
                    <p className="text-white/70 text-sm">Author</p>
                 </div>
              </div>
              <div className="flex space-x-3">
                 <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur transition-colors" title="Bookmark">
                    <Bookmark className="w-5 h-5" />
                 </button>
                 <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur transition-colors" title="Share">
                    <Share2 className="w-5 h-5" />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="prose prose-lg prose-slate max-w-none">
          <p className="lead text-xl text-slate-600 font-serif italic mb-8 border-l-4 border-blue-500 pl-4 py-2 bg-slate-50">
             {post.excerpt}
          </p>
          <MarkdownRenderer content={post.content} />
        </div>

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-gray-100">
           <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Related Topics</h4>
           <div className="flex flex-wrap gap-2">
             {post.tags.map(tag => (
               <span key={tag} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 cursor-pointer transition-colors">
                 #{tag}
               </span>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};