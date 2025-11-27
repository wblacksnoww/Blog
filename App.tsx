import React, { useState, useRef } from 'react';
import { Home } from './views/Home';
import { Article } from './views/Article';
import { Editor } from './views/Editor';
import { INITIAL_POSTS, CURRENT_USER } from './constants';
import { BlogPost, ViewState, FileSystemDirectoryHandle } from './types';
import { PenSquare, Feather, Upload, Lock, Unlock, X, LogIn, HardDrive, RefreshCw, Settings, FolderOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { isFileSystemSupported, openVault, scanVault, scanFileList } from './services/fileSystem';

const App: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isReadOnlyVault, setIsReadOnlyVault] = useState(false);

  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  
  // Legacy input ref for fallback
  const legacyInputRef = useRef<HTMLInputElement>(null);

  const handleNavigateToPost = (post: BlogPost) => {
    setActivePost(post);
    setCurrentView(ViewState.ARTICLE);
  };

  const handleNavigateHome = () => {
    setActivePost(null);
    setEditingPost(null);
    setCurrentView(ViewState.HOME);
  };

  const handleNavigateToEditor = () => {
    setEditingPost(null);
    setCurrentView(ViewState.EDITOR);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setCurrentView(ViewState.EDITOR);
  };

  const handleSavePost = (savedPost: BlogPost) => {
    const existingIndex = posts.findIndex(p => p.id === savedPost.id);
    
    if (existingIndex >= 0) {
      // Update existing post
      const updatedPosts = [...posts];
      updatedPosts[existingIndex] = savedPost;
      setPosts(updatedPosts);
    } else {
      // Create new post
      setPosts([savedPost, ...posts]);
    }
    
    // Navigate to the article
    setActivePost(savedPost);
    setEditingPost(null);
    setCurrentView(ViewState.ARTICLE);
  };

  const handleConnectVault = async () => {
    // If browser doesn't support FS API, use fallback
    if (!isFileSystemSupported()) {
      setScanStatus("Native File System API not supported. Using fallback mode...");
      legacyInputRef.current?.click();
      return;
    }

    try {
      setScanStatus("Selecting folder...");
      const handle = await openVault();
      setVaultHandle(handle);
      setIsReadOnlyVault(false);
      
      setScanStatus("Scanning vault for .md files...");
      const localPosts = await scanVault(handle);
      
      const mergedPosts = [...localPosts, ...posts.filter(p => !localPosts.find(lp => lp.id === p.id))];
      setPosts(mergedPosts);
      setScanStatus(`Success! Synced ${localPosts.length} posts.`);
      
      setTimeout(() => setScanStatus(null), 3000);
    } catch (e: any) {
      console.error("Failed to connect vault:", e);
      if (e.name === 'AbortError') {
        setScanStatus(null); // User cancelled
      } else {
        setScanStatus("Connection failed. Try opening in a new window/tab.");
      }
    }
  };

  const handleLegacyFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setScanStatus("Scanning uploaded folder...");
      const localPosts = await scanFileList(e.target.files);
      
      const mergedPosts = [...localPosts, ...posts.filter(p => !localPosts.find(lp => lp.id === p.id))];
      setPosts(mergedPosts);
      // Mark as connected but read-only (no handle)
      setVaultHandle({ name: 'Imported Folder (Read-Only)', kind: 'directory' } as any); 
      setIsReadOnlyVault(true);
      
      setScanStatus(`Success! Imported ${localPosts.length} posts (Read-Only).`);
      setTimeout(() => setScanStatus(null), 3000);
    }
  };

  const handleRescan = async () => {
    if (isReadOnlyVault) {
      // Trigger legacy input again
      legacyInputRef.current?.click();
      return;
    }

    if (!vaultHandle) return;
    try {
      setScanStatus("Rescanning...");
      const localPosts = await scanVault(vaultHandle);
      const mergedPosts = [...localPosts, ...posts.filter(p => !p.fileHandle)];
      setPosts(mergedPosts);
      setScanStatus(`Rescan complete. ${localPosts.length} local posts found.`);
      setTimeout(() => setScanStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setScanStatus("Rescan failed.");
    }
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setIsSettingsOpen(false); // Close settings on logout
    } else {
      setIsLoginModalOpen(true);
      setLoginError('');
      setLoginPassword('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === 'admin') {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError('Incorrect password');
    }
  };

  const editorUser = isAdmin 
    ? { ...CURRENT_USER, name: "Administrator" } 
    : CURRENT_USER;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col relative">
      {/* Hidden legacy input */}
      <input 
        type="file" 
        ref={legacyInputRef}
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as any)}
        multiple
        onChange={handleLegacyFileSelect}
      />

      {/* Navigation Bar - Only show on Home and Article views */}
      {currentView !== ViewState.EDITOR && (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div 
                className="flex items-center cursor-pointer group" 
                onClick={handleNavigateHome}
              >
                <div className="bg-slate-900 text-white p-1.5 rounded-lg mr-2 group-hover:rotate-12 transition-transform">
                    <Feather className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">Lumina</span>
              </div>
              
              <div className="flex items-center space-x-4 md:space-x-6">
                 {/* Public Nav Items */}
                 <button className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
                   About
                 </button>
                 
                 {isAdmin && (
                   <>
                     <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                     
                     <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-slate-600 hover:text-blue-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                      title="Vault Settings"
                     >
                       <Settings className="w-5 h-5" />
                     </button>

                     <button 
                      onClick={handleNavigateToEditor}
                      className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                     >
                       <PenSquare className="w-4 h-4" />
                       <span>New Post</span>
                     </button>
                   </>
                 )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {currentView === ViewState.HOME && (
          <Home 
            posts={posts} 
            onNavigateToPost={handleNavigateToPost}
            onNavigateToEditor={handleNavigateToEditor}
          />
        )}
        
        {currentView === ViewState.ARTICLE && activePost && (
          <Article 
            post={activePost} 
            onBack={handleNavigateHome}
            onEdit={() => handleEditPost(activePost)}
            isAdmin={isAdmin}
          />
        )}

        {currentView === ViewState.EDITOR && (
          <Editor 
            onSave={handleSavePost}
            onCancel={handleNavigateHome}
            currentUser={editorUser}
            initialPost={editingPost}
            // If readonly, don't pass the handle so editor behaves like normal save
            vaultHandle={isReadOnlyVault ? null : vaultHandle}
          />
        )}
      </main>

      {/* Footer - Hide on Editor */}
      {currentView !== ViewState.EDITOR && (
        <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
               <span className="text-xl font-bold font-serif text-slate-900">Lumina</span>
               <p className="text-sm text-slate-500 mt-1">Illuminating ideas through AI-assisted storytelling.</p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-500">
               <button 
                onClick={handleAdminToggle} 
                className={`flex items-center hover:text-slate-900 transition-colors ${isAdmin ? 'text-green-600 font-medium' : ''}`}
               >
                 {isAdmin ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                 {isAdmin ? 'Admin Active' : 'Admin Access'}
               </button>
            </div>
          </div>
        </footer>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <LogIn className="w-5 h-5 mr-2 text-blue-600" />
                  Admin Login
                </h3>
                <button 
                  onClick={() => setIsLoginModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    autoFocus
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter password..."
                  />
                  {loginError && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      {loginError}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">Hint: the password is "admin"</p>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                >
                  Unlock Access
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
             <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-slate-600" />
                    Vault Settings
                  </h3>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Card */}
                  <div className={`p-4 rounded-xl border ${vaultHandle ? (isReadOnlyVault ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200') : 'bg-slate-50 border-slate-200'}`}>
                     <div className="flex items-center mb-2">
                        <HardDrive className={`w-5 h-5 mr-2 ${vaultHandle ? (isReadOnlyVault ? 'text-orange-600' : 'text-green-600') : 'text-slate-400'}`} />
                        <span className={`font-semibold ${vaultHandle ? (isReadOnlyVault ? 'text-orange-800' : 'text-green-800') : 'text-slate-600'}`}>
                           {vaultHandle ? (isReadOnlyVault ? 'Connected (Read Only)' : 'Connected & Syncing') : 'Not Connected'}
                        </span>
                     </div>
                     <p className="text-sm text-slate-500 ml-7">
                        {vaultHandle ? `Vault: ${vaultHandle.name}` : 'Connect a folder to sync your markdown files.'}
                     </p>
                     {isReadOnlyVault && (
                       <p className="text-xs text-orange-700 ml-7 mt-1 flex items-center">
                         <AlertTriangle className="w-3 h-3 mr-1"/> Browser restricts write access. Changes won't save to disk.
                       </p>
                     )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                     <button 
                       onClick={handleConnectVault}
                       className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                     >
                       <FolderOpen className="w-5 h-5 mr-2" />
                       {vaultHandle ? 'Change Vault Folder' : 'Select Vault Folder'}
                     </button>
                     
                     {vaultHandle && (
                       <button 
                         onClick={handleRescan}
                         className="w-full flex items-center justify-center px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                       >
                         <RefreshCw className="w-4 h-4 mr-2" />
                         Rescan Files
                       </button>
                     )}
                  </div>

                  {/* Info Text */}
                  <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg leading-relaxed">
                     <strong className="block text-slate-500 mb-1">How it works:</strong>
                     Selecting a folder allows Lumina to read <code>.md</code> files. 
                     If supported, files are synced locally. If restricted, files are imported as Read-Only.
                  </div>

                  {/* Status Message */}
                  {scanStatus && (
                     <div className={`flex items-center justify-center text-sm font-medium py-2 rounded-lg animate-pulse ${scanStatus.includes('failed') || scanStatus.includes('not supported') ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50'}`}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {scanStatus}
                     </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;