import { useState } from 'react';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({
    dashboardState,
    activeFile,
    rightPanelOpen,
    setRightPanelOpen,
    setAppState,
    searchTerm,
    setSearchTerm,
    setDashboardState,
    files = [],
    loadFile
}) => {
    const { userProfile, session, signOut } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const displayName = userProfile?.name || userProfile?.full_name || "Authorized User";
    const displayEmail = userProfile?.email || session?.user?.email || "Institutional Account";
    const displayInitials = userProfile?.initials || (displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) || "IA";

    const getTitle = () => {
        switch (dashboardState) {
            case 'OVERVIEW': return 'Dashboard Overview';
            case 'HISTORY': return 'Scan Archive';
            case 'COMPLIANCE': return 'Auditor Profile';
            case 'SETTINGS': return 'Platform Settings';
            case 'UPLOAD': return 'Mag-upload ng Dokumento';
            case 'SCANNING': return 'Ongoing na Analysis';
            case 'RESULTS': return 'Resulta ng Analysis';
            default: return 'Dashboard';
        }
    };

    const filteredResults = searchTerm
        ? files.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8)
        : [];

    const handleKeyDown = (e) => {
        if (!isSearchFocused) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && filteredResults[selectedIndex]) {
                loadFile(filteredResults[selectedIndex]);
                setIsSearchFocused(false);
                setSearchTerm("");
            }
        } else if (e.key === 'Escape') {
            setIsSearchFocused(false);
        }
    };

    return (
        <header className="h-16 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 z-50 sticky top-0 transition-colors duration-300">
            <div className="flex items-center gap-4 min-w-[200px]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
                    {getTitle()}
                </h2>
                {activeFile && (dashboardState === 'RESULTS' || dashboardState === 'SCANNING') && (
                    <>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate max-w-xs">{activeFile.filename}</span>
                    </>
                )}
            </div>



            <div className="flex items-center gap-4 min-w-[200px] justify-end flex-1">
                {/* Global Search - Integrated into right side for better balance */}
                {dashboardState === 'OVERVIEW' && (
                    <div className="relative group w-full max-w-[280px] animate-fade-in mr-2">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Maghanap ng report"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSelectedIndex(-1);
                            }}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full py-1.5 pl-8 pr-4 text-[11px] text-slate-900 dark:text-tip-text-main placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                            role="combobox"
                            aria-expanded={isSearchFocused}
                            aria-haspopup="listbox"
                            aria-controls="search-results"
                        />

                        {/* Search Results Panel - Anchored to the right side search */}
                        {isSearchFocused && (
                            <div
                                id="search-results"
                                role="listbox"
                                className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden z-[100] transition-colors"
                            >
                                {!searchTerm ? (
                                    <div className="p-4 text-center">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Mabilisang Search</p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Hanapin gamit ang pangalan o petsa</p>
                                    </div>
                                ) : filteredResults.length > 0 ? (
                                    <div className="max-h-[320px] overflow-y-auto py-1">
                                        {filteredResults.map((result, idx) => (
                                            <div
                                                key={result.id}
                                                role="option"
                                                aria-selected={idx === selectedIndex}
                                                onClick={() => {
                                                    loadFile(result);
                                                    setSearchTerm("");
                                                }}
                                                className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                            >
                                                <div className="flex flex-col min-w-0 pr-4">
                                                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{result.title}</span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-500">{result.date}</span>
                                                </div>
                                                <div className="shrink-0">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${parseInt(result.confidence) > 70 ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                                                        {parseInt(result.confidence) > 70 ? 'Passed' : 'Review'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Walang nakitang analysis na tugma.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Active Analysis Button moved to Sidebar */}

                <div className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center overflow-hidden transition-all font-bold text-sm ${userMenuOpen ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/50' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md'}`}
                    >
                        {userProfile?.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            displayInitials
                        )}
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1 z-50 animate-fade-in" onMouseLeave={() => setUserMenuOpen(false)}>
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{displayName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{displayEmail}</p>
                            </div>

                            <div className="py-1">
                                <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-2 transition-colors">
                                    <Icons.Settings size={16} /> Preferences
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
                                <button
                                    onClick={async () => {
                                        if (signOut) await signOut();
                                        setAppState('LANDING');
                                        setUserMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                                >
                                    <Icons.LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
