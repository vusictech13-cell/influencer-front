import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function SearchDropdown({
    options,
    value,
    onChange,
    multiple = false,
    placeholder,
    onSearch,
    searching = false,
}: {
    options: string[];
    value: string | string[];
    onChange: (value: string | string[]) => void;
    multiple?: boolean;
    placeholder: string;
    onSearch?: (query: string) => void;
    searching?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const selected = multiple ? (Array.isArray(value) ? value : []) : value ? [String(value)] : [];
    const trimmedQuery = query.trim();
    const filtered = onSearch
        ? options
        : options.filter((item) => item.toLowerCase().includes(trimmedQuery.toLowerCase()));
    const waitingForResults = !!onSearch && trimmedQuery.length >= 2 && (searching || submittedQuery !== trimmedQuery);

    useEffect(() => {
        if (!onSearch) return undefined;
        const timer = window.setTimeout(() => {
            setSubmittedQuery(trimmedQuery);
            onSearch(trimmedQuery);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [onSearch, trimmedQuery]);

    useEffect(() => {
        function onDocumentClick(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onDocumentClick);
        return () => document.removeEventListener('mousedown', onDocumentClick);
    }, []);

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#dce8f0] bg-white px-3.5 py-3 text-left text-sm"
                aria-expanded={open}
            >
                <span className={cn('truncate', selected.length ? 'font-semibold text-brand-ink' : 'text-[#8a8c94]')}>
                    {selected.length ? selected.join(', ') : placeholder}
                </span>
                <span className="text-[#8a8c94]" aria-hidden="true">▾</span>
            </button>
            {open && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[#dce8f0] bg-white shadow-[0_12px_32px_rgba(11,39,68,0.12)]">
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search"
                        className="w-full border-b border-[#ededf1] px-3.5 py-2.5 text-sm outline-none"
                    />
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {!waitingForResults && filtered.map((item) => {
                            const active = selected.includes(item);
                            return (
                                <li key={item}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (multiple) {
                                                onChange(active ? selected.filter((entry) => entry !== item) : [...selected, item]);
                                                return;
                                            }
                                            onChange(item);
                                            setQuery('');
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            'flex w-full px-3.5 py-2.5 text-left text-sm hover:bg-[#f4fbff]',
                                            active && 'bg-[#e8f8fe] font-bold text-[#f05a0c]',
                                        )}
                                    >
                                        {item}
                                    </button>
                                </li>
                            );
                        })}
                        {waitingForResults && (
                            <li className="px-3.5 py-2.5 text-sm text-[#8a8c94]">Searching cities...</li>
                        )}
                        {!waitingForResults && filtered.length === 0 && (
                            <li className="px-3.5 py-2.5 text-sm text-[#8a8c94]">
                                {onSearch && trimmedQuery.length < 2 ? 'Type at least 2 letters' : 'No matches'}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
