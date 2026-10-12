import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pagination, Select } from 'antd';
import { Check, Languages, MapPin, Plus } from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { fieldClass, LoadingRow, Modal, PageHeader, Panel, primaryButtonClass, StatusPill, TabButton, TabGroup } from './adminUi';
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

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#5c6570]">{label}</span>
            {children}
        </label>
    );
}

function RowButton({
    label,
    onClick,
    disabled,
    tone = 'default',
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    tone?: 'default' | 'danger';
}) {
    const tones = {
        default: 'border-[#dce8f0] text-brand-ink hover:bg-[#f7fafc]',
        danger: 'border-red-100 text-red-500 hover:bg-red-50',
    };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold disabled:opacity-40 ${tones[tone]}`}
        >
            {label}
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

function LanguagesPanel({ canManage, onSuccess }: { canManage: boolean; onSuccess: (message: string) => void }) {
    const [page, setPage] = useState(1);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<CatalogItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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
        setAdding(false);
        setName('');
    };

    const beginAdd = () => {
        setEditing(null);
        setName('');
        setError(null);
        setAdding(true);
    };

    const beginEdit = (item: CatalogItem) => {
        setAdding(false);
        setEditing(item);
        setName(item.name);
        setError(null);
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

    const formOpen = adding || !!editing;
    const saving = editing ? updateItem.isPending : createItem.isPending;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-brand-gray">
                    {total} {total === 1 ? 'language' : 'languages'} creators can select
                    {isFetching && !isLoading ? ' · updating' : ''}
                </p>
                {canManage && (
                    <button type="button" className={primaryButtonClass} onClick={beginAdd}>
                        <Plus size={16} className="mr-1.5" />
                        Add language
                    </button>
                )}
            </div>
            {error && !formOpen && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <Panel>
                {isLoading ? <LoadingRow /> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Language</th>
                                    <th className="px-4 py-3 font-bold">On profile</th>
                                    {canManage && <th className="px-4 py-3 font-bold">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className={`border-b border-gray-50 ${editing?.id === item.id ? 'bg-[#fff7f2]' : ''}`}>
                                        <td className="px-4 py-3 font-semibold text-brand-ink">{item.name}</td>
                                        <td className="px-4 py-3">
                                            <StatusPill status={item.is_active ? 'active' : 'inactive'} label={item.is_active ? 'Shown' : 'Hidden'} />
                                        </td>
                                        {canManage && (
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <RowButton label="Edit" onClick={() => beginEdit(item)} />
                                                    <RowButton
                                                        label={item.is_active ? 'Hide' : 'Show'}
                                                        disabled={updateItem.isPending}
                                                        onClick={async () => {
                                                            setError(null);
                                                            try {
                                                                await updateItem.mutateAsync({ id: item.id, is_active: !item.is_active });
                                                                onSuccess(item.is_active ? `${item.name} hidden` : `${item.name} shown`);
                                                            } catch (err) {
                                                                setError(getApiErrorMessage(err, 'Could not update this language.'));
                                                            }
                                                        }}
                                                    />
                                                    <RowButton
                                                        label="Delete"
                                                        tone="danger"
                                                        onClick={() => {
                                                            setDeleteError(null);
                                                            setPendingDelete(item);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={canManage ? 3 : 2} className="px-4 py-12 text-center text-sm text-brand-gray">
                                            No languages yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
            <Pager page={page} total={total} noun="languages" onChange={setPage} />
            {formOpen && (
                <Modal title={editing ? `Edit ${editing.name}` : 'Add a language'} onClose={() => !saving && resetLanguageForm()}>
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
                            autoFocus
                        />
                    </Field>
                    {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
                    <div className="mt-4 flex gap-2">
                        <button type="button" onClick={resetLanguageForm} disabled={saving} className="h-11 flex-1 rounded-xl border border-[#dce8f0] text-sm font-bold text-brand-ink disabled:opacity-45">
                            Cancel
                        </button>
                        <button type="button" onClick={editing ? save : add} disabled={saving || !name.trim()} className={`${primaryButtonClass} flex-1`}>
                            {saving ? 'Saving...' : editing ? 'Save language' : 'Add language'}
                        </button>
                    </div>
                </Modal>
            )}
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
        </div>
    );
}

function CitiesPanel({ canManage, onSuccess }: { canManage: boolean; onSuccess: (message: string) => void }) {
    const [page, setPage] = useState(1);
    const [country, setCountry] = useState(DEFAULT_COUNTRY);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [stateName, setStateName] = useState('');
    const [addCountry, setAddCountry] = useState(DEFAULT_COUNTRY);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<CatalogItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const skipSearchReset = useRef(true);

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
        setAdding(false);
        setCity('');
        setStateName('');
        setAddCountry(country || DEFAULT_COUNTRY);
    };

    const beginAdd = () => {
        setEditing(null);
        setCity('');
        setStateName('');
        setAddCountry(country || DEFAULT_COUNTRY);
        setError(null);
        setAdding(true);
    };

    const beginEdit = (item: CatalogItem) => {
        setAdding(false);
        setEditing(item);
        setCity(item.city || '');
        setStateName(item.state || '');
        setAddCountry(item.country || DEFAULT_COUNTRY);
        setError(null);
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

    const formOpen = adding || !!editing;
    const saving = editing ? updateItem.isPending : createItem.isPending;
    const canSave = !!city.trim() && !!stateName.trim() && !!addCountry.trim();

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="grid flex-1 gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
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
                {canManage && (
                    <button type="button" className={primaryButtonClass} onClick={beginAdd}>
                        <Plus size={16} className="mr-1.5" />
                        Add city
                    </button>
                )}
            </div>
            <p className="text-sm text-brand-gray">
                {total} {total === 1 ? 'city' : 'cities'} in {country}
                {isFetching && !isLoading ? ' · updating' : ''}
            </p>
            {error && !formOpen && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <Panel>
                {isLoading ? <LoadingRow /> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                                <tr>
                                    <th className="px-4 py-3 font-bold">City</th>
                                    <th className="px-4 py-3 font-bold">State</th>
                                    <th className="px-4 py-3 font-bold">Country</th>
                                    {canManage && <th className="px-4 py-3 font-bold">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className={`border-b border-gray-50 ${editing?.id === item.id ? 'bg-[#fff7f2]' : ''}`}>
                                        <td className="px-4 py-3 font-semibold text-brand-ink">{item.city}</td>
                                        <td className="px-4 py-3 text-brand-ink">{item.state}</td>
                                        <td className="px-4 py-3 text-brand-gray">{item.country}</td>
                                        {canManage && (
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <RowButton label="Edit" onClick={() => beginEdit(item)} />
                                                    <RowButton
                                                        label="Delete"
                                                        tone="danger"
                                                        onClick={() => {
                                                            setDeleteError(null);
                                                            setPendingDelete(item);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={canManage ? 4 : 3} className="px-4 py-12 text-center text-sm text-brand-gray">
                                            {search ? 'No cities match this search.' : 'No cities for this country.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
            <Pager page={page} total={total} noun="cities" onChange={setPage} />
            {formOpen && (
                <Modal title={editing ? `Edit ${editing.city}` : 'Add a city'} onClose={() => !saving && resetCityForm()}>
                    <div className="grid gap-3">
                        <Field label="City">
                            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Mumbai" className={fieldClass} autoFocus />
                        </Field>
                        <Field label="State">
                            <input value={stateName} onChange={(event) => setStateName(event.target.value)} placeholder="Maharashtra" className={fieldClass} />
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
                    {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
                    <div className="mt-4 flex gap-2">
                        <button type="button" onClick={resetCityForm} disabled={saving} className="h-11 flex-1 rounded-xl border border-[#dce8f0] text-sm font-bold text-brand-ink disabled:opacity-45">
                            Cancel
                        </button>
                        <button type="button" onClick={editing ? save : add} disabled={saving || !canSave} className={`${primaryButtonClass} flex-1`}>
                            {saving ? 'Saving...' : editing ? 'Save city' : 'Add city'}
                        </button>
                    </div>
                </Modal>
            )}
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
        </div>
    );
}

export default function AdminSettings() {
    const me = useAdminMe();
    const canManage = adminCan(me.data, 'SETTINGS_MANAGE');
    const [tab, setTab] = useState<CatalogKind>('locations');
    const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = window.setTimeout(() => setToast(null), 2000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const notify = (text: string) => setToast({ id: Date.now(), text });

    return (
        <div className="space-y-5">
            <PageHeader
                title="Profile options"
                description="Cities and languages creators can choose on their profile, and again during onboarding."
            />
            <TabGroup>
                <TabButton active={tab === 'locations'} onClick={() => setTab('locations')}>
                    <MapPin size={15} />
                    Cities
                </TabButton>
                <TabButton active={tab === 'languages'} onClick={() => setTab('languages')}>
                    <Languages size={15} />
                    Languages
                </TabButton>
            </TabGroup>
            {tab === 'locations' ? <CitiesPanel canManage={canManage} onSuccess={notify} /> : <LanguagesPanel canManage={canManage} onSuccess={notify} />}
            {toast && <SuccessToast message={toast.text} />}
        </div>
    );
}
