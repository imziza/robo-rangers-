'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Database,
    Map as MapIcon,
    Microscope,
    Compass,
    Archive,
    Users,
    MessageSquare,
    Command,
    X,
    FileText,
    Settings,
    User
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import styles from './CommandPalette.module.css';

const NAV_SHORTCUTS = [
    { label: 'Go to Vault', href: '/vault', icon: Database },
    { label: 'Go to Arch-Atlas', href: '/atlas', icon: MapIcon },
    { label: 'Go to Laboratory', href: '/analysis', icon: Microscope },
    { label: 'Go to Discovery', href: '/discovery', icon: Compass },
    { label: 'Go to Archive', href: '/archive', icon: Archive },
    { label: 'Go to Teams', href: '/teams', icon: Users },
    { label: 'Go to Messages', href: '/messages', icon: MessageSquare },
    { label: 'Go to My Profile', href: '/profile', icon: User },
];

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const searchArtifacts = async (q: string) => {
        setIsLoading(true);
        const { data } = await supabase
            .from('artifacts')
            .select('id, title, classification')
            .ilike('title', `%${q}%`)
            .limit(5);

        setResults(data || []);
        setIsLoading(false);
        setSelectedIndex(0);
    };

    useEffect(() => {
        if (query.length > 1) {
            searchArtifacts(query);
        } else {
            setResults([]);
        }
    }, [query]);

    const handleSelect = (item: any) => {
        setIsOpen(false);
        if (item.href) {
            router.push(item.href);
        } else if (item.id) {
            router.push(`/report/${item.id}`);
        }
    };

    const currentResults = query.length > 1
        ? [...results, ...NAV_SHORTCUTS.filter(s => s.label.toLowerCase().includes(query.toLowerCase()))]
        : NAV_SHORTCUTS;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % currentResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + currentResults.length) % currentResults.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentResults[selectedIndex]) {
                handleSelect(currentResults[selectedIndex]);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <motion.div
                        className={styles.palette}
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.searchBar}>
                            <Search className={styles.searchIcon} size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search artifacts or navigate..."
                                className={styles.input}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <div className={styles.escKey}>ESC</div>
                        </div>

                        <div className={styles.resultsList}>
                            {query.length > 1 && results.length > 0 && (
                                <div className={styles.sectionHeader}>SPECIMENS FOUND</div>
                            )}

                            {currentResults.map((item, index) => (
                                <div
                                    key={item.id || item.href}
                                    className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''}`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onClick={() => handleSelect(item)}
                                >
                                    {item.icon ? <item.icon size={18} /> : <FileText size={18} />}
                                    <div className={styles.itemText}>
                                        <span className={styles.itemTitle}>{item.title || item.label}</span>
                                        <span className={styles.itemSub}>{item.classification || 'Archive Module'}</span>
                                    </div>
                                    {index === selectedIndex && <Command size={14} className={styles.enterIcon} />}
                                </div>
                            ))}

                            {query.length > 1 && currentResults.length === 0 && (
                                <div className={styles.emptyState}>No archival matches found.</div>
                            )}
                        </div>

                        <div className={styles.footer}>
                            <div className={styles.help}>
                                <span><kbd>↑↓</kbd> Navigate</span>
                                <span><kbd>↵</kbd> Select</span>
                                <span><kbd>⌘K</kbd> Close</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
