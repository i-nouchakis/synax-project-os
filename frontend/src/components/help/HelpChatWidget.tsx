import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HelpCircle, X, Search, ChevronRight, ArrowLeft,
  FolderKanban, Building2, DoorOpen, Box, Pencil, ClipboardCheck,
  Warehouse, FileText, CalendarDays, Bot, Sparkles,
} from 'lucide-react';
import { helpTree, searchHelp, getHelpForRoute, type HelpNode } from '@/data/help-knowledge-base';

const iconMap: Record<string, React.ElementType> = {
  FolderKanban, Building2, DoorOpen, Box, Pencil, ClipboardCheck,
  Warehouse, FileText, CalendarDays, HelpCircle,
};

type View = 'home' | 'category' | 'article' | 'search' | 'context';

export function HelpChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<HelpNode | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Reset to home when closing
  const handleClose = () => {
    setIsOpen(false);
    setView('home');
    setSelectedCategory(null);
    setSelectedArticle(null);
    setSearchQuery('');
  };

  const handleOpen = () => {
    setIsOpen(true);
    setView('home');
  };

  const handleOpenContext = () => {
    setIsOpen(true);
    setView('context');
  };

  const handleCategoryClick = (node: HelpNode) => {
    setSelectedCategory(node);
    setView('category');
    scrollToTop();
  };

  const handleArticleClick = (node: HelpNode) => {
    setSelectedArticle(node);
    setView('article');
    scrollToTop();
  };

  const handleBack = () => {
    if (view === 'article') {
      setView(selectedCategory ? 'category' : 'search');
      setSelectedArticle(null);
    } else if (view === 'category' || view === 'search' || view === 'context') {
      setView('home');
      setSelectedCategory(null);
      setSearchQuery('');
    }
    scrollToTop();
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      setView('search');
    } else {
      setView('home');
    }
  };

  const scrollToTop = () => {
    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  // Focus search on open
  useEffect(() => {
    if (isOpen && view === 'home') {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  }, [isOpen, view]);

  const searchResults = searchHelp(searchQuery);
  const contextHelp = getHelpForRoute(location.pathname);

  // Render markdown-like content (bold, lists, tips)
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold title
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-semibold text-text-primary text-body-sm mb-2">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      // Numbered list
      if (/^\d+\./.test(line.trim())) {
        const content = line.replace(/^\d+\.\s*/, '');
        return (
          <div key={i} className="flex gap-2 mb-1 ml-1">
            <span className="text-primary font-medium text-body-sm">{line.match(/^\d+/)?.[0]}.</span>
            <span className="text-text-secondary text-body-sm">{renderInline(content)}</span>
          </div>
        );
      }
      // Bullet list
      if (line.trim().startsWith('- ')) {
        const content = line.replace(/^\s*-\s*/, '');
        return (
          <div key={i} className="flex gap-2 mb-1 ml-3">
            <span className="text-primary">•</span>
            <span className="text-text-secondary text-body-sm">{renderInline(content)}</span>
          </div>
        );
      }
      // Tip line
      if (line.trim().startsWith('**Tip:**')) {
        return (
          <div key={i} className="mt-3 p-2.5 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-body-sm text-primary">
              <Sparkles size={14} className="inline mr-1 -mt-0.5" />
              {renderInline(line.replace('**Tip:**', '').trim())}
            </p>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) return <div key={i} className="h-2" />;
      // Regular text
      return (
        <p key={i} className="text-text-secondary text-body-sm mb-1">
          {renderInline(line)}
        </p>
      );
    });
  };

  // Render inline bold text
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-text-primary font-medium">
            {part.replace(/\*\*/g, '')}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!isOpen) {
    return (
      <div id="help-widget" className="fixed bottom-6 right-20 z-50 flex gap-2">
        {/* Context help indicator */}
        {contextHelp.length > 0 && (
          <button
            onClick={handleOpenContext}
            className="h-10 px-3 rounded-full bg-surface border border-surface-border text-text-secondary shadow-lg hover:bg-surface-hover hover:text-primary transition-all hover:scale-105 flex items-center gap-1.5 text-body-sm"
            title="Βοήθεια για αυτή τη σελίδα"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Βοήθεια</span>
          </button>
        )}
        {/* Main help button */}
        <button
          onClick={handleOpen}
          className="w-12 h-12 rounded-full bg-primary/90 text-white shadow-lg hover:bg-primary transition-all hover:scale-105 flex items-center justify-center"
          title="Help Bot"
        >
          <Bot size={22} />
        </button>
      </div>
    );
  }

  return (
    <div id="help-widget" className="fixed bottom-6 right-6 z-50">
      <div className="w-[340px] max-h-[520px] bg-surface border border-surface-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2">
            {view !== 'home' && (
              <button
                onClick={handleBack}
                className="p-1 rounded hover:bg-surface-hover text-text-tertiary"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <Bot size={18} className="text-primary" />
            <span className="text-body-sm font-semibold text-text-primary">
              {view === 'home' && 'Πώς μπορώ να βοηθήσω;'}
              {view === 'category' && selectedCategory?.label}
              {view === 'article' && 'Οδηγίες'}
              {view === 'search' && `Αποτελέσματα (${searchResults.length})`}
              {view === 'context' && 'Βοήθεια σελίδας'}
            </span>
          </div>
          <button onClick={handleClose} className="p-1 rounded hover:bg-surface-hover text-text-tertiary">
            <X size={16} />
          </button>
        </div>

        {/* Search bar (home & search views) */}
        {(view === 'home' || view === 'search') && (
          <div className="px-3 py-2 border-b border-surface-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Ψάξε π.χ. 'πώς προσθέτω asset'..."
                className="w-full bg-background border border-surface-border rounded-lg pl-8 pr-3 py-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {/* HOME VIEW - Categories */}
          {view === 'home' && (
            <div className="p-3 space-y-1">
              {helpTree.map((category) => {
                const Icon = iconMap[category.icon || 'HelpCircle'] || HelpCircle;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <span className="text-body-sm text-text-primary group-hover:text-primary transition-colors flex-1">
                      {category.label}
                    </span>
                    <ChevronRight size={14} className="text-text-tertiary" />
                  </button>
                );
              })}
            </div>
          )}

          {/* CATEGORY VIEW - Articles list */}
          {view === 'category' && selectedCategory?.children && (
            <div className="p-3 space-y-1">
              {selectedCategory.children.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleArticleClick(item)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-body-sm text-text-secondary group-hover:text-text-primary transition-colors flex-1">
                    {item.label}
                  </span>
                  <ChevronRight size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* ARTICLE VIEW - Content */}
          {view === 'article' && selectedArticle?.content && (
            <div className="p-4">
              <h3 className="text-body-sm font-semibold text-primary mb-3 pb-2 border-b border-surface-border">
                {selectedArticle.label}
              </h3>
              <div className="space-y-0.5">{renderContent(selectedArticle.content)}</div>
            </div>
          )}

          {/* SEARCH VIEW - Results */}
          {view === 'search' && (
            <div className="p-3">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center">
                  <Search size={24} className="mx-auto text-text-tertiary mb-2" />
                  <p className="text-body-sm text-text-tertiary">
                    Δεν βρέθηκαν αποτελέσματα
                  </p>
                  <p className="text-caption text-text-tertiary mt-1">
                    Δοκίμασε άλλες λέξεις-κλειδιά
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleArticleClick(item)}
                      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm text-text-primary group-hover:text-primary transition-colors">
                          {item.label}
                        </p>
                        <p className="text-caption text-text-tertiary truncate">{item.parentLabel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTEXT VIEW - Page-specific help */}
          {view === 'context' && (
            <div className="p-3">
              {contextHelp.length === 0 ? (
                <div className="py-8 text-center">
                  <HelpCircle size={24} className="mx-auto text-text-tertiary mb-2" />
                  <p className="text-body-sm text-text-tertiary">
                    Δεν υπάρχουν οδηγίες για αυτή τη σελίδα
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {contextHelp.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleArticleClick(item)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-body-sm text-text-secondary group-hover:text-text-primary transition-colors flex-1">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-surface-border bg-surface-hover/30 shrink-0">
          <p className="text-tiny text-text-tertiary text-center">
            Δεν βρήκες αυτό που ψάχνεις;{' '}
            <button
              onClick={() => {
                handleClose();
                // Trigger feedback widget - find and click it
                const feedbackBtn = document.querySelector('#feedback-widget button') as HTMLButtonElement;
                if (feedbackBtn) setTimeout(() => feedbackBtn.click(), 200);
              }}
              className="text-primary hover:underline"
            >
              Στείλε feedback
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
