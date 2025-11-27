import React, { useState, useMemo } from 'react';
import { BlogPost } from '../types';
import { Clock, Tag, ChevronRight, Search, Hash } from 'lucide-react';

interface HomeProps {
  posts: BlogPost[];
  onNavigateToPost: (post: BlogPost) => void;
  onNavigateToEditor: () => void;
}

export const Home: React.FC<HomeProps> = ({ posts, onNavigateToPost, onNavigateToEditor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const categories = useMemo(() => {
    const allCats = posts.flatMap(p => p.categories);
    return Array.from(new Set(allCats)).sort();
  }, [posts]);

  const tags = useMemo(() => {
    const allTags = posts.flatMap(p => p.tags);
    // Count tag frequency
    const counts: {[key: string]: number} = {};
    allTags.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    // Return top 10 tags
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? post.categories.includes(selectedCategory) : true;
      const matchesTag = selectedTag ? post.tags.includes(selectedTag) : true;
      
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [posts, searchTerm, selectedCategory, selectedTag]);

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const standardPosts = filteredPosts.length > 0 ? filteredPosts.slice(1) : [];

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => { setSelectedCategory(null); setSelectedTag(null); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory && !selectedTag ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            All Posts
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat === selectedCategory ? null : cat); setSelectedTag(null); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Bar */}
      {tags.length > 0 && (
         <div className="flex items-center gap-3 mb-10 text-sm overflow-x-auto pb-2 no-scrollbar">
            <span className="font-semibold text-slate-400 flex items-center"><Hash className="w-3 h-3 mr-1"/> Trending:</span>
            {tags.map(tag => (
               <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${selectedTag === tag ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-blue-600 bg-slate-50'}`}
               >
                  #{tag}
               </button>
            ))}
            {(selectedCategory || selectedTag) && (
               <button onClick={handleClearFilters} className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium">Clear Filters</button>
            )}
         </div>
      )}

      {/* Featured Post */}
      {!searchTerm && !selectedCategory && !selectedTag && featuredPost && (
        <div className="mb-16 group cursor-pointer" onClick={() => onNavigateToPost(featuredPost)}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="overflow-hidden rounded-2xl shadow-lg aspect-[4/3] md:aspect-auto md:h-96 relative">
              <img 
                src={featuredPost.coverImageUrl} 
                alt={featuredPost.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                 <span className="px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold uppercase tracking-wider rounded-md text-slate-900">
                  Featured
                 </span>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <span className="font-medium text-blue-600">{featuredPost.categories[0]}</span>
                <span>•</span>
                <span>{new Date(featuredPost.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 font-serif leading-tight group-hover:text-blue-700 transition-colors">
                {featuredPost.title}
              </h1>
              <p className="text-lg text-slate-600 line-clamp-3 leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center justify-between pt-4">
                 <div className="flex items-center space-x-3">
                    <img src={featuredPost.author.avatarUrl} alt={featuredPost.author.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{featuredPost.author.name}</p>
                      <p className="text-xs text-slate-500">{featuredPost.readTimeMinutes} min read</p>
                    </div>
                 </div>
                 <button className="flex items-center text-blue-600 font-semibold group/btn">
                    Read Article <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {(searchTerm || selectedCategory || selectedTag ? filteredPosts : standardPosts).map((post) => (
            <article 
              key={post.id} 
              className="flex flex-col group cursor-pointer"
              onClick={() => onNavigateToPost(post)}
            >
              <div className="relative overflow-hidden rounded-xl shadow-sm mb-4 aspect-[3/2]">
                <img 
                  src={post.coverImageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                 <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {post.categories.slice(0, 2).map(cat => (
                     <span key={cat} className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded">
                      {cat}
                    </span>
                  ))}
                 </div>
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                   <div className="flex gap-2 overflow-hidden">
                      {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                            <Tag className="w-3 h-3 mr-1" />{tag}
                          </span>
                      ))}
                   </div>
                   <span className="text-xs text-slate-400 ml-auto flex items-center shrink-0">
                      <Clock className="w-3 h-3 mr-1" /> {post.readTimeMinutes} min
                   </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif leading-snug group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center mt-auto border-t border-gray-100 pt-4">
                  <img src={post.author.avatarUrl} alt={post.author.name} className="w-8 h-8 rounded-full mr-3" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900">{post.author.name}</span>
                    <span className="text-xs text-slate-500">{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
         <div className="text-center py-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No articles found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search filters or check back later.</p>
            <button onClick={handleClearFilters} className="mt-4 text-blue-600 font-medium hover:underline">Clear all filters</button>
         </div>
      )}
    </div>
  );
};