import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import {
    useAdminCatalog,
    useCreateCatalogItem,
    useDeleteCatalogItem,
    useUpdateCatalogItem,
    type CatalogKind,
} from '@/hooks/useCatalog';

function CatalogPanel({ kind, title, placeholder }: { kind: CatalogKind; title: string; placeholder: string }) {
    const { data = [], isLoading } = useAdminCatalog(kind);
    const createItem = useCreateCatalogItem(kind);
    const updateItem = useUpdateCatalogItem(kind);
    const deleteItem = useDeleteCatalogItem(kind);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const add = async () => {
        const next = name.trim();
        if (!next) return;
        setError(null);
        try {
            await createItem.mutateAsync(next);
            setName('');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not add this item.'));
        }
    };

    return (
        <section className="rounded-2xl border border-[#e7e7ed] bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand-ink">{title}</h2>
            <div className="mb-4 flex gap-2">
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') add();
                    }}
                    placeholder={placeholder}
                    className="h-11 flex-1 rounded-xl border border-[#dce8f0] px-3 text-sm outline-none focus:border-[#ff6a1a]"
                />
                <button
                    type="button"
                    onClick={add}
                    disabled={createItem.isPending || !name.trim()}
                    className="rounded-xl bg-brand-orange px-4 text-sm font-bold text-white disabled:opacity-45"
                >
                    Add
                </button>
            </div>
            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#8b8d96]" />
            ) : (
                <ul className="divide-y divide-[#ededf1]">
                    {data.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                            <span className={item.is_active ? 'text-sm font-semibold' : 'text-sm text-[#8b8d96] line-through'}>
                                {item.name}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => updateItem.mutate({ id: item.id, is_active: !item.is_active })}
                                    className="text-xs font-bold text-brand-blue"
                                >
                                    {item.is_active ? 'Hide' : 'Show'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteItem.mutate(item.id)}
                                    className="text-xs font-bold text-red-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                    {data.length === 0 && <li className="py-3 text-sm text-[#8b8d96]">Nothing added yet.</li>}
                </ul>
            )}
        </section>
    );
}

export default function AdminSettings() {
    return (
        <div className="mx-auto max-w-5xl">
            <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">Settings</h1>
            <p className="mb-6 text-sm text-[#70727b]">
                Cities and languages shown when creators finish onboarding.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
                <CatalogPanel kind="locations" title="Cities" placeholder="Add a city" />
                <CatalogPanel kind="languages" title="Languages" placeholder="Add a language" />
            </div>
        </div>
    );
}
