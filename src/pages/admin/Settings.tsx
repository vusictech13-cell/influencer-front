import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pagination, Select } from 'antd';
import { Check, Eye, EyeOff, Loader2, Pencil, Trash2 } from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import {
    useAdminCountries,
    useAdminLanguages,
    useAdminLocations,
    useCreateCatalogItem,
    useDeleteCatalogItem,
    useUpdateCatalogItem,
    type CatalogItem,
    type CatalogKind,
} from '@/hooks/useCatalog';

const PAGE_SIZE = 10;
const DEFAULT_COUNTRY = 'India';

const fieldClass =
    'h-11 w-full rounded-xl border border-[#dce8f0] bg-white px-3 text-sm outline-none focus:border-[#ff6a1a]';

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#5c6570]">{label}</span>
            {children}
        </label>
    );
}

function IconAction({
    label,
    onClick,
    disabled,
    tone = 'default',
    children,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    tone?: 'default' | 'edit' | 'danger' | 'ok';
    children: ReactNode;
}) {
    const tones = {
        default: 'border-[#e7e7ed] text-[#3d4450] hover:bg-[#f4f6f8]',
        edit: 'border-[#d7eef8] text-[#0b7cad] hover:bg-[#f3fbff]',
        danger: 'border-[#f8d4d4] text-red-500 hover:bg-red-50',
        ok: 'border-[#cdebd8] text-[#15945a] hover:bg-[#f3fbf6]',
    };
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={`grid h-8 w-8 place-items-center rounded-lg border transition disabled:opacity-40 ${tones[tone]}`}
        >
            {children}
        </button>
    );
}

function SuccessToast({ message }: { message: string }) {
    return (
        <div
            role="status"
            className="fixed right-4 top-4 z-[90] flex items-center gap-2 rounded-xl bg-[#0b2744] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(11,39,68,0.28)]"
        >
            <Check size={16} className="text-[#3ddc97]" />
            {message}
        </div>
    );
}

function DeleteDialog({
    title,
    description,
    pending,
    error,
    onCancel,
    onConfirm,
}: {
    title: string;
    description: string;
    pending: boolean;
    error: string | null;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !pending) onCancel();
        };
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [onCancel, pending]);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <button
                type="button"
                className="absolute inset-0 bg-[#0b2744]/45"
                aria-label="Dismiss"
                onClick={() => !pending && onCancel()}
            />
            <div className="relative w-full max-w-sm rounded-2xl border border-[#e7e7ed] bg-white p-5 shadow-[0_24px_60px_rgba(11,39,68,0.28)]">
                <h3 className="text-center text-base font-bold text-brand-ink">{title}</h3>
                <p className="mt-2 text-center text-sm leading-relaxed text-[#70727b]">{description}</p>
                {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}
                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={pending}
                        className="h-11 flex-1 rounded-xl border border-[#dce8f0] text-sm font-bold text-brand-ink disabled:opacity-45"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={pending}
                        className="h-11 flex-1 rounded-xl bg-red-500 text-sm font-bold text-white disabled:opacity-45"
                    >
                        {pending ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Pager({
    page,
    total,
    noun,
    onChange,
}: {
    page: number;
    total: number;
    noun: string;
    onChange: (page: number) => void;
}) {
    if (total <= 0) return null;
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return (
        <div className="mt-4 flex flex-col gap-3 border-t border-[#ededf1] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#70727b]">
                Showing {start}–{end} of {total} {noun}
            </p>
            <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={total}
                onChange={onChange}
                showSizeChanger={false}
            />
        </div>
    );
}

function LanguagesPanel({ onSuccess }: { onSuccess: (message: string) => void }) {
    const [page, setPage] = useState(1);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<CatalogItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const languageFormRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching } = useAdminLanguages(page, PAGE_SIZE);
    const createItem = useCreateCatalogItem('languages');
    const updateItem = useUpdateCatalogItem('languages');
    const deleteItem = useDeleteCatalogItem('languages');
    const items = data?.items ?? [];
    const total = data?.meta.total ?? 0;

    useEffect(() => {
        const totalPages = data?.meta.totalPages ?? 1;
        if (!isLoading && !isFetching && page > totalPages) setPage(totalPages);
    }, [data?.meta.totalPages, isFetching, isLoading, page]);

    const resetLanguageForm = () => {
        setEditing(null);
        setName('');
    };

    const beginEdit = (item: CatalogItem) => {
        setEditing(item);
        setName(item.name);
        setError(null);
        languageFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const add = async () => {
        const next = name.trim();
        if (!next) return;
        setError(null);
        try {
            await createItem.mutateAsync(next);
            setName('');
            setPage(1);
            onSuccess(`${next} added`);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not add this language.'));
        }
    };

    const save = async () => {
        if (!editing) return;
        const next = name.trim();
        if (!next || next === editing.name) {
            resetLanguageForm();
            return;
        }
        setError(null);
        try {
            await updateItem.mutateAsync({ id: editing.id, name: next });
            resetLanguageForm();
            onSuccess(`${next} updated`);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not update this language.'));
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleteError(null);
        try {
            const label = pendingDelete.name;
            await deleteItem.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
            onSuccess(`${label} deleted`);
        } catch (err) {
            setDeleteError(getApiErrorMessage(err, 'Could not delete this language.'));
        }
    };

    return (
        <section className="rounded-2xl border border-[#e7e7ed] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-brand-ink">Languages</h2>
                {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-[#8b8d96]" />}
            </div>
            <div ref={languageFormRef} className="mb-4 rounded-xl border border-[#ededf1] bg-[#fafafb] p-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#8b8d96]">
                    {editing ? `Edit ${editing.name}` : 'Add a language'}
                </p>
                <Field label="Language">
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                if (editing) save();
                                else add();
                            }
                        }}
                        placeholder="Hindi"
                        className={fieldClass}
                    />
                </Field>
                <div className="mt-3 flex gap-2">
                    {editing && (
                        <button
                            type="button"
                            onClick={resetLanguageForm}
                            className="h-11 rounded-xl border border-[#dce8f0] bg-white px-4 text-sm font-bold text-brand-ink"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={editing ? save : add}
                        disabled={(editing ? updateItem.isPending : createItem.isPending) || !name.trim()}
                        className="h-11 rounded-xl bg-brand-orange px-4 text-sm font-bold text-white disabled:opacity-45"
                    >
                        {editing ? 'Save language' : 'Add language'}
                    </button>
                </div>
            </div>
            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#8b8d96]" />
            ) : (
                <ul className="divide-y divide-[#ededf1]">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className={`flex items-center justify-between gap-3 py-2.5 ${editing?.id === item.id ? 'bg-[#fff7f2]' : ''}`}
                        >
                            <span className={item.is_active ? 'text-sm font-semibold' : 'text-sm text-[#8b8d96] line-through'}>
                                {item.name}
                            </span>
                            <div className="flex shrink-0 gap-1.5">
                                <IconAction label="Edit" tone="edit" onClick={() => beginEdit(item)}>
                                    <Pencil size={15} />
                                </IconAction>
                                <IconAction
                                    label={item.is_active ? 'Hide' : 'Show'}
                                    onClick={async () => {
                                        setError(null);
                                        try {
                                            await updateItem.mutateAsync({ id: item.id, is_active: !item.is_active });
                                            onSuccess(item.is_active ? `${item.name} hidden` : `${item.name} shown`);
                                        } catch (err) {
                                            setError(getApiErrorMessage(err, 'Could not update this language.'));
                                        }
                                    }}
                                >
                                    {item.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                                </IconAction>
                                <IconAction
                                    label="Delete"
                                    tone="danger"
                                    onClick={() => {
                                        setDeleteError(null);
                                        setPendingDelete(item);
                                    }}
                                >
                                    <Trash2 size={15} />
                                </IconAction>
                            </div>
                        </li>
                    ))}
                    {items.length === 0 && <li className="py-3 text-sm text-[#8b8d96]">Nothing added yet.</li>}
                </ul>
            )}
            <Pager page={page} total={total} noun="languages" onChange={setPage} />
            {pendingDelete && (
                <DeleteDialog
                    title={`Delete ${pendingDelete.name}?`}
                    description="Creators will no longer see this language. This cannot be undone."
                    pending={deleteItem.isPending}
                    error={deleteError}
                    onCancel={() => !deleteItem.isPending && setPendingDelete(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </section>
    );
}

function CitiesPanel({ onSuccess }: { onSuccess: (message: string) => void }) {
    const [page, setPage] = useState(1);
    const [country, setCountry] = useState(DEFAULT_COUNTRY);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [stateName, setStateName] = useState('');
    const [addCountry, setAddCountry] = useState(DEFAULT_COUNTRY);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<CatalogItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const skipSearchReset = useRef(true);
    const cityFormRef = useRef<HTMLDivElement>(null);

    const { data: countries = [] } = useAdminCountries();
    const countryOptions = countries.length ? countries : [DEFAULT_COUNTRY];
    const formCountries = addCountry && !countryOptions.includes(addCountry)
        ? [addCountry, ...countryOptions]
        : countryOptions;
    const { data, isLoading, isFetching } = useAdminLocations({
        page,
        limit: PAGE_SIZE,
        country,
        q: search,
    });
    const createItem = useCreateCatalogItem('locations');
    const updateItem = useUpdateCatalogItem('locations');
    const deleteItem = useDeleteCatalogItem('locations');
    const items = data?.items ?? [];
    const total = data?.meta.total ?? 0;

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (skipSearchReset.current) {
            skipSearchReset.current = false;
            return;
        }
        setPage(1);
    }, [search]);

    useEffect(() => {
        if (countries.length && !countries.includes(country)) {
            setCountry(countries.includes(DEFAULT_COUNTRY) ? DEFAULT_COUNTRY : countries[0]);
            setPage(1);
        }
    }, [countries, country]);

    useEffect(() => {
        const totalPages = data?.meta.totalPages ?? 1;
        if (!isLoading && !isFetching && page > totalPages) setPage(totalPages);
    }, [data?.meta.totalPages, isFetching, isLoading, page]);

    const resetCityForm = () => {
        setEditing(null);
        setCity('');
        setStateName('');
        setAddCountry(DEFAULT_COUNTRY);
    };

    const beginEdit = (item: CatalogItem) => {
        setEditing(item);
        setCity(item.city || '');
        setStateName(item.state || '');
        setAddCountry(item.country || DEFAULT_COUNTRY);
        setError(null);
        cityFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const add = async () => {
        const nextCity = city.trim();
        const nextState = stateName.trim();
        const nextCountry = addCountry.trim();
        if (!nextCity || !nextState || !nextCountry) return;
        setError(null);
        try {
            await createItem.mutateAsync({ city: nextCity, state: nextState, country: nextCountry });
            setCity('');
            setStateName('');
            setAddCountry(DEFAULT_COUNTRY);
            onSuccess(`${nextCity} added`);
            if (nextCountry !== country) setCountry(nextCountry);
            setPage(1);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not add this city.'));
        }
    };

    const save = async () => {
        if (!editing) return;
        const next = {
            city: city.trim(),
            state: stateName.trim(),
            country: addCountry.trim(),
        };
        if (!next.city || !next.state || !next.country) {
            setError('City, state, and country are required.');
            return;
        }
        if (next.city === editing.city && next.state === editing.state && next.country === editing.country) {
            resetCityForm();
            return;
        }
        setError(null);
        try {
            await updateItem.mutateAsync({ id: editing.id, ...next });
            resetCityForm();
            if (next.country !== country) setCountry(next.country);
            onSuccess(`${next.city} updated`);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not update this city.'));
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleteError(null);
        try {
            const label = pendingDelete.city || 'City';
            await deleteItem.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
            onSuccess(`${label} deleted`);
        } catch (err) {
            setDeleteError(getApiErrorMessage(err, 'Could not delete this city.'));
        }
    };

    return (
        <section className="rounded-2xl border border-[#e7e7ed] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-brand-ink">Cities</h2>
                {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-[#8b8d96]" />}
            </div>
            <div className="mb-4 grid gap-2 sm:grid-cols-[180px_1fr]">
                <Select
                    showSearch
                    value={country}
                    onChange={(value) => {
                        setCountry(value);
                        setPage(1);
                    }}
                    options={countryOptions.map((name) => ({ value: name, label: name }))}
                    optionFilterProp="label"
                    className="h-11 w-full"
                    popupMatchSelectWidth={false}
                />
                <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search city or state"
                    className={fieldClass}
                />
            </div>
            <div ref={cityFormRef} className="mb-4 rounded-xl border border-[#ededf1] bg-[#fafafb] p-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#8b8d96]">
                    {editing ? `Edit ${editing.city}` : 'Add a city'}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="City">
                        <input
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                            placeholder="Mumbai"
                            className={fieldClass}
                        />
                    </Field>
                    <Field label="State">
                        <input
                            value={stateName}
                            onChange={(event) => setStateName(event.target.value)}
                            placeholder="Maharashtra"
                            className={fieldClass}
                        />
                    </Field>
                    <Field label="Country">
                        <Select
                            showSearch
                            value={addCountry}
                            onChange={setAddCountry}
                            options={formCountries.map((option) => ({ value: option, label: option }))}
                            optionFilterProp="label"
                            className="h-11 w-full"
                            popupMatchSelectWidth={false}
                        />
                    </Field>
                </div>
                <div className="mt-3 flex gap-2">
                    {editing && (
                        <button
                            type="button"
                            onClick={resetCityForm}
                            className="h-11 rounded-xl border border-[#dce8f0] bg-white px-4 text-sm font-bold text-brand-ink"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={editing ? save : add}
                        disabled={
                            (editing ? updateItem.isPending : createItem.isPending) ||
                            !city.trim() ||
                            !stateName.trim() ||
                            !addCountry.trim()
                        }
                        className="h-11 rounded-xl bg-brand-orange px-4 text-sm font-bold text-white disabled:opacity-45"
                    >
                        {editing ? 'Save city' : 'Add city'}
                    </button>
                </div>
            </div>
            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#8b8d96]" />
            ) : (
                <ul className="divide-y divide-[#ededf1]">
                    {items.map((item) => (
                            <li
                                key={item.id}
                                className={`flex items-start justify-between gap-3 py-3 ${editing?.id === item.id ? 'bg-[#fff7f2]' : ''}`}
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-brand-ink">{item.city}</p>
                                    <p className="truncate text-xs text-[#8b8d96]">
                                        {item.state}, {item.country}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                    <IconAction label="Edit" tone="edit" onClick={() => beginEdit(item)}>
                                        <Pencil size={15} />
                                    </IconAction>
                                    <IconAction
                                        label="Delete"
                                        tone="danger"
                                        onClick={() => {
                                            setDeleteError(null);
                                            setPendingDelete(item);
                                        }}
                                    >
                                        <Trash2 size={15} />
                                    </IconAction>
                                </div>
                            </li>
                        ))}
                    {items.length === 0 && (
                        <li className="py-3 text-sm text-[#8b8d96]">
                            {search ? 'No cities match this search.' : 'No cities for this country.'}
                        </li>
                    )}
                </ul>
            )}
            <Pager page={page} total={total} noun="cities" onChange={setPage} />
            {pendingDelete && (
                <DeleteDialog
                    title={`Delete ${pendingDelete.city}?`}
                    description={`${pendingDelete.city}, ${pendingDelete.state}, ${pendingDelete.country} will be removed from creator location search. This cannot be undone.`}
                    pending={deleteItem.isPending}
                    error={deleteError}
                    onCancel={() => !deleteItem.isPending && setPendingDelete(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </section>
    );
}

export default function AdminSettings() {
    const [tab, setTab] = useState<CatalogKind>('locations');
    const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = window.setTimeout(() => setToast(null), 2000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const notify = (text: string) => setToast({ id: Date.now(), text });

    return (
        <div className="mx-auto max-w-3xl">
            <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">Settings</h1>
            <p className="mb-6 text-sm text-[#70727b]">
                Cities and languages shown when creators finish onboarding.
            </p>
            <div className="mb-4 flex gap-2" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'locations'}
                    onClick={() => setTab('locations')}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                        tab === 'locations' ? 'bg-brand-orange text-white' : 'border border-[#e7e7ed] bg-white text-brand-ink'
                    }`}
                >
                    Cities
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'languages'}
                    onClick={() => setTab('languages')}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                        tab === 'languages' ? 'bg-brand-orange text-white' : 'border border-[#e7e7ed] bg-white text-brand-ink'
                    }`}
                >
                    Languages
                </button>
            </div>
            {tab === 'locations' ? <CitiesPanel onSuccess={notify} /> : <LanguagesPanel onSuccess={notify} />}
            {toast && <SuccessToast message={toast.text} />}
        </div>
    );
}
