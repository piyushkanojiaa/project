import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
    title: string;
    path: string;
    description: string;
}

const searchableContent: SearchResult[] = [
    { title: 'Home', path: '/', description: 'AI-First collision prediction system' },
    { title: 'About', path: '/about', description: 'Space debris crisis and our solution' },
    { title: 'Analytics', path: '/analytics', description: 'AI system performance metrics' },
    { title: 'Dashboard', path: '/dashboard', description: 'Real-time satellite tracking' },
    { title: 'Login', path: '/login', description: 'Access the monitoring dashboard' },
    { title: 'Features', path: '/#features', description: 'Real-time tracking, collision detection, AI analysis' },
    { title: 'Technology', path: '/#technology', description: 'SGP4, PyTorch, React, Three.js' },
    { title: 'AI Prediction', path: '/', description: 'Deep learning collision forecasting' },
    { title: 'SGP4 Propagation', path: '/analytics', description: 'Industry-standard orbital mechanics' },
];

const SearchBar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut: / to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !isOpen) {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search logic
    useEffect(() => {
        if (query.trim()) {
            const filtered = searchableContent.filter(item =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [query]);

    const handleNavigate = (path: string) => {
        setIsOpen(false);
        setQuery('');
        if (path.includes('#')) {
            const [route, hash] = path.split('#');
            navigate(route);
            setTimeout(() => {
                const element = document.getElementById(hash);
                element?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            navigate(path);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                title="Search (Press / )"
            >
                <Search className="w-4 h-4" />
                <span>Search</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-slate-700/50 rounded border border-slate-600">/</kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24">
            <div className="w-full max-w-2xl mx-4">
                {/* Search Input */}
                <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-800">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search pages, features, technology..."
                            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                        />
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setQuery('');
                            }}
                            className="p-1 hover:bg-slate-800 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Search Results */}
                    {results.length > 0 && (
                        <div className="max-h-96 overflow-y-auto">
                            {results.map((result, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleNavigate(result.path)}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-800/50 transition-colors border-t border-slate-800 first:border-t-0"
                                >
                                    <div className="font-medium text-white mb-1">{result.title}</div>
                                    <div className="text-sm text-slate-400">{result.description}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {query && results.length === 0 && (
                        <div className="px-4 py-8 text-center text-slate-400">
                            No results found for "{query}"
                        </div>
                    )}

                    {/* Help Text */}
                    {!query && (
                        <div className="px-4 py-3 text-xs text-slate-500 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                                <span>Press ESC to close</span>
                                <span>Press / to search</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
