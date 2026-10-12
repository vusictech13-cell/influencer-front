import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronRight,
    Copy,
    Info,
    Lock,
    Pencil,
    PlusCircle,
    Save,
    Search,
    Shield,
    ShieldAlert,
    Trash2,
    UserCheck,
    UserPlus,
    X,
} from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import {
    useAdminPermissions,
    useAdminRoleMutations,
    useAdminRoles,
    type AdminPermission,
    type AdminRole,
} from '@/hooks/useAdminRoles';
import { LoadingRow, Notice } from './adminUi';
import { isComingSoon, permissionBadge, summarizeRole } from './permissionHelp';

type Toast = { id: number; message: string; tone: 'success' | 'error' | 'info' };
type FilterMode = 'all' | 'enabled' | 'disabled';

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;

function categoryOf(permission: AdminPermission) {
    if (permission.code.startsWith('STAFF_')) return 'STAFF';
    return permission.module;
}

function roleIcon(code: string) {
    if (code === 'SUPER_ADMIN') return ShieldAlert;
    if (code === 'ADMIN') return Shield;
    if (code === 'STAFF') return UserCheck;
    return UserPlus;
}

function uniqueCopyCode(base: string, taken: Set<string>) {
    const root = `${base}_COPY`.replace(/[^A-Z0-9_]/g, '').slice(0, 58);
    let code = root;
    let n = 2;
    while (taken.has(code) || !CODE_PATTERN.test(code)) {
        code = `${root}_${n}`.slice(0, 64);
        n += 1;
    }
    return code;
}

export default function AdminRoles() {
    const me = useAdminMe();
    const canViewPermissions = adminCan(me.data, 'PERMISSION_VIEW');
    const roles = useAdminRoles();
    const permissions = useAdminPermissions(canViewPermissions);
    const mutations = useAdminRoleMutations();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [draftFor, setDraftFor] = useState<{ roleId: number; codes: string[] } | null>(null);
    const [permQuery, setPermQuery] = useState('');
    const [filter, setFilter] = useState<FilterMode>('all');
    const [creating, setCreating] = useState(false);
    const [confirm, setConfirm] = useState<'duplicate' | 'delete' | null>(null);
    const [showAccess, setShowAccess] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [renameForm, setRenameForm] = useState({ name: '', description: '' });
    const [renameError, setRenameError] = useState('');
    const [roleForm, setRoleForm] = useState({ name: '', code: '', description: '', baseId: 'empty' });
    const [toasts, setToasts] = useState<Toast[]>([]);

    const list = roles.data || [];
    const selected = list.find((role) => role.id === selectedId) || null;
    const locked = selected?.code === 'SUPER_ADMIN' || (!!selected?.is_system && !me.data?.is_super_admin);
    const canCreate = adminCan(me.data, 'ROLE_CREATE');
    const canManage = adminCan(me.data, 'PERMISSION_MANAGE') && !locked;
    const canDelete = adminCan(me.data, 'ROLE_DELETE') && !!selected && !selected.is_system;
    const canRename = adminCan(me.data, 'ROLE_EDIT') && !!selected && selected.code !== 'SUPER_ADMIN' && (me.data?.is_super_admin || !selected.is_system);
    const draft = selected
        ? (draftFor?.roleId === selected.id ? draftFor.codes : selected.permissions)
        : [];
    const dirty = !!selected && [...draft].sort().join(',') !== [...selected.permissions].sort().join(',');

    const updateDraft = (updater: (current: string[]) => string[]) => {
        if (!selected) return;
        setDraftFor({ roleId: selected.id, codes: updater(draft) });
    };

    const pushToast = (message: string, tone: Toast['tone']) => {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, message, tone }]);
        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3000);
    };

    const showSuperAdmin = me.data?.is_super_admin === true;
    const visibleRoles = useMemo(
        () => list.filter((role) => showSuperAdmin || role.code !== 'SUPER_ADMIN'),
        [list, showSuperAdmin],
    );

    useEffect(() => {
        if (!visibleRoles.length) return;
        if (selectedId != null && visibleRoles.some((role) => role.id === selectedId)) return;
        const preferred = visibleRoles.find((role) => role.code === 'ADMIN') || visibleRoles[0];
        setSelectedId(preferred.id);
    }, [visibleRoles, selectedId]);

    useEffect(() => {
        setShowAccess(false);
    }, [selectedId]);

    useEffect(() => {
        if (!showAccess) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setShowAccess(false);
        };
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [showAccess]);

    const grouped = useMemo(() => {
        const groups = new Map<string, AdminPermission[]>();
        for (const permission of permissions.data || []) {
            const key = categoryOf(permission);
            const bucket = groups.get(key) || [];
            bucket.push(permission);
            groups.set(key, bucket);
        }
        return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [permissions.data]);

    const visibleGroups = useMemo(() => {
        const query = permQuery.trim().toLowerCase();
        return grouped
            .map(([category, items]) => {
                const filtered = items.filter((item) => {
                    const enabled = draft.includes(item.code);
                    const matches = !query
                        || item.name.toLowerCase().includes(query)
                        || item.code.toLowerCase().includes(query)
                        || (item.description || '').toLowerCase().includes(query);
                    if (!matches) return false;
                    if (filter === 'enabled') return enabled;
                    if (filter === 'disabled') return !enabled;
                    return true;
                });
                return [category, items, filtered] as const;
            })
            .filter(([, , filtered]) => filtered.length > 0);
    }, [grouped, draft, permQuery, filter]);

    const enabledTotal = draft.length;
    const permissionTotal = permissions.data?.length || 0;

    const chooseRole = (id: number) => {
        if (id === selectedId) return;
        if (dirty && !window.confirm('Discard unsaved permission changes?')) return;
        setSelectedId(id);
    };

    const togglePermission = (code: string) => {
        if (!canManage || isComingSoon(code)) return;
        updateDraft((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
    };

    const toggleCategory = (category: string, enable: boolean) => {
        if (!canManage) return;
        const codes = (permissions.data || [])
            .filter((item) => categoryOf(item) === category && !isComingSoon(item.code))
            .map((item) => item.code);
        updateDraft((current) => enable ? [...new Set([...current, ...codes])] : current.filter((code) => !codes.includes(code)));
        pushToast(`${enable ? 'Granted' : 'Revoked'} all permissions under ${category}`, 'info');
    };

    const savePermissions = async () => {
        if (!selected || !canManage) return;
        try {
            await mutations.setPermissions.mutateAsync({ id: selected.id, permissionCodes: draft });
            pushToast(`Permissions updated for ${selected.name}`, 'success');
        } catch (err) {
            pushToast(getApiErrorMessage(err, 'Could not update permissions.'), 'error');
        }
    };

    const duplicateRole = async () => {
        if (!selected || !canCreate) return;
        const taken = new Set(list.map((role) => role.code));
        try {
            const created = await mutations.createRole.mutateAsync({
                name: `${selected.name} copy`,
                code: uniqueCopyCode(selected.code, taken),
                description: `Duplicated from ${selected.name}.`,
            });
            if (canManage && selected.permissions.length) {
                await mutations.setPermissions.mutateAsync({
                    id: created.id,
                    permissionCodes: selected.permissions,
                });
            }
            setSelectedId(created.id);
            setConfirm(null);
            pushToast(`Duplicated ${selected.name}`, 'success');
        } catch (err) {
            pushToast(getApiErrorMessage(err, 'Could not duplicate this role.'), 'error');
        }
    };

    const removeRole = async () => {
        if (!selected || !canDelete) return;
        try {
            await mutations.deleteRole.mutateAsync(selected.id);
            setSelectedId(null);
            setConfirm(null);
            pushToast(`${selected.name} was deleted`, 'success');
        } catch (err) {
            pushToast(getApiErrorMessage(err, 'Could not delete this role.'), 'error');
        }
    };

    const createRole = async () => {
        const code = roleForm.code.trim().toUpperCase().replace(/\s+/g, '_');
        if (!roleForm.name.trim() || !CODE_PATTERN.test(code)) {
            pushToast('Enter a name and a code like MARKETING_MGR.', 'error');
            return;
        }
        const base = roleForm.baseId === 'empty' ? null : list.find((role) => String(role.id) === roleForm.baseId);
        try {
            const created = await mutations.createRole.mutateAsync({
                name: roleForm.name.trim(),
                code,
                description: roleForm.description.trim(),
            });
            if (canManage && base?.permissions.length) {
                await mutations.setPermissions.mutateAsync({
                    id: created.id,
                    permissionCodes: base.permissions,
                });
            }
            setSelectedId(created.id);
            setCreating(false);
            setRoleForm({ name: '', code: '', description: '', baseId: 'empty' });
            pushToast(`${created.name} was created`, 'success');
        } catch (err) {
            pushToast(getApiErrorMessage(err, 'Could not create this role.'), 'error');
        }
    };

    if (roles.isLoading || permissions.isLoading) {
        return <div className="rounded-2xl border border-slate-200 bg-white"><LoadingRow /></div>;
    }

    if (roles.isError || permissions.isError) {
        return <Notice>{getApiErrorMessage(roles.error || permissions.error, 'Could not load roles.')}</Notice>;
    }

    return (
        <div className="flex flex-col gap-6 font-jakarta text-slate-800">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-2 sm:flex-row sm:items-center">
                <div>
                    <h1 className="flex flex-wrap items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        Roles & Permissions
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Dynamic RBAC
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage security levels, assign administrative scopes, and configure fine-grained access rules.
                    </p>
                </div>
                {canCreate && (
                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Create New Role
                    </button>
                )}
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-12">
                <aside className="flex flex-col gap-4 lg:col-span-4 xl:col-span-3">
                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Configured Roles</h2>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{visibleRoles.length} Roles</span>
                        </div>
                        <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">
                            {visibleRoles.map((role) => (
                                <RoleCard
                                    key={role.id}
                                    role={role}
                                    active={role.id === selected?.id}
                                    count={role.id === selected?.id ? draft.length : role.permissions.length}
                                    onSelect={() => chooseRole(role.id)}
                                />
                            ))}
                            {!visibleRoles.length && <p className="px-2 py-6 text-center text-xs text-slate-400">No roles yet.</p>}
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
                            <ShieldAlert className="h-4 w-4" />
                            Security best practice
                        </div>
                        <p className="text-xs leading-relaxed text-slate-300">
                            Grant write or delete permissions only when a workflow needs them. Super admin access stays fixed by the system.
                        </p>
                    </div>
                </aside>

                <section className="lg:col-span-8 xl:col-span-9">
                    {selected && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-6 md:flex-row md:items-center">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-2xl font-bold text-slate-900">{selected.name}</h2>
                                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">{selected.code}</span>
                                        {locked && (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                                <Lock className="h-3 w-3" /> System fixed
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">{selected.description || 'Custom security role.'}</p>
                                    {selected.is_system && (
                                        <p className="mt-2 text-xs font-medium text-amber-700">Only a Super Admin can change this role’s permission switches.</p>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => setShowAccess(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                                        <Info className="h-3.5 w-3.5 text-slate-500" />
                                        What this role can do
                                    </button>
                                    {canRename && (
                                        <button type="button" onClick={() => { setRenameError(''); setRenameForm({ name: selected.name, description: selected.description || '' }); setRenaming(true); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                            Rename
                                        </button>
                                    )}
                                    {canCreate && (
                                        <button type="button" onClick={() => setConfirm('duplicate')} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                                            Duplicate
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button type="button" onClick={() => setConfirm('delete')} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/60 bg-rose-50/50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100/60">
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete role
                                        </button>
                                    )}
                                    {canManage && (
                                        <button type="button" onClick={savePermissions} disabled={!dirty || mutations.setPermissions.isPending} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 disabled:opacity-40">
                                            <Save className="h-3.5 w-3.5" />
                                            {mutations.setPermissions.isPending ? 'Saving...' : 'Save changes'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row">
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={permQuery}
                                        onChange={(event) => setPermQuery(event.target.value)}
                                        placeholder="Search permission or code..."
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                                    />
                                    {permQuery && (
                                        <button type="button" aria-label="Clear search" onClick={() => setPermQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-sm">
                                    {([
                                        ['all', `All (${permissionTotal})`],
                                        ['enabled', `Enabled (${enabledTotal})`],
                                        ['disabled', `Disabled (${Math.max(permissionTotal - enabledTotal, 0)})`],
                                    ] as const).map(([mode, label]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setFilter(mode)}
                                            className={`rounded-lg px-3 py-1 font-medium transition ${filter === mode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6">
                                {me.data && !canViewPermissions ? (
                                    <p className="py-12 text-center text-sm text-slate-500">You don&apos;t have permission to view the permission list.</p>
                                ) : visibleGroups.length ? (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {visibleGroups.map(([category, allItems, filtered]) => {
                                            const enabledInCategory = allItems.filter((item) => draft.includes(item.code)).length;
                                            const allOn = enabledInCategory === allItems.length;
                                            return (
                                                <div key={category} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                                                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black uppercase tracking-wider text-slate-800">{category}</span>
                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{enabledInCategory}/{allItems.length}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            disabled={!canManage}
                                                            onClick={() => toggleCategory(category, !allOn)}
                                                            className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            {allOn ? 'Deselect all' : 'Select all'}
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {filtered.map((item) => (
                                                            <PermissionRow
                                                                key={item.code}
                                                                item={item}
                                                                checked={draft.includes(item.code)}
                                                                disabled={!canManage}
                                                                onToggle={() => togglePermission(item.code)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                            <Search className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800">No matching permissions found</h3>
                                        <p className="mt-1 text-xs text-slate-500">Try another keyword or filter.</p>
                                        <button type="button" onClick={() => { setPermQuery(''); setFilter('all'); }} className="mt-3 text-xs font-semibold text-orange-600 hover:underline">Clear search</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {creating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Create new security role</h3>
                            </div>
                            <button type="button" aria-label="Close" onClick={() => setCreating(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form
                            className="space-y-4 p-6"
                            onSubmit={(event) => {
                                event.preventDefault();
                                createRole();
                            }}
                        >
                            <Field label="Role name">
                                <input required value={roleForm.name} onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })} placeholder="e.g. Marketing Manager" className={inputClass} />
                            </Field>
                            <Field label="Role code identifier" hint="Uppercase code used by authorization checks.">
                                <input required value={roleForm.code} onChange={(event) => setRoleForm({ ...roleForm, code: event.target.value.toUpperCase() })} placeholder="e.g. MARKETING_MGR" className={`${inputClass} font-mono`} />
                            </Field>
                            <Field label="Description">
                                <textarea rows={3} value={roleForm.description} onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })} placeholder="Describe what this role is responsible for" className={inputClass} />
                            </Field>
                            <Field label="Base template preset">
                                <select value={roleForm.baseId} onChange={(event) => setRoleForm({ ...roleForm, baseId: event.target.value })} className={inputClass}>
                                    <option value="empty">Empty permissions</option>
                                    {list.filter((role) => role.code !== 'SUPER_ADMIN').map((role) => (
                                        <option key={role.id} value={role.id}>Clone from {role.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setCreating(false)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
                                <button type="submit" disabled={mutations.createRole.isPending || mutations.setPermissions.isPending} className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50">
                                    {mutations.createRole.isPending ? 'Creating...' : 'Create role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {renaming && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => !mutations.updateRole.isPending && setRenaming(false)}>
                    <form
                        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-5 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                        onSubmit={(event) => {
                            event.preventDefault();
                            mutations.updateRole.mutate({ id: selected.id, name: renameForm.name.trim(), description: renameForm.description.trim() }, {
                                onSuccess: () => setRenaming(false),
                                onError: (error) => setRenameError(getApiErrorMessage(error, 'Could not rename this role.')),
                            });
                        }}
                    >
                        <h3 className="text-base font-bold text-slate-900">Rename role</h3>
                        {renameError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{renameError}</p>}
                        <label className="mt-4 block text-xs font-semibold text-slate-600">Name
                            <input className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-500" value={renameForm.name} onChange={(event) => setRenameForm({ ...renameForm, name: event.target.value })} />
                        </label>
                        <label className="mt-3 block text-xs font-semibold text-slate-600">Description
                            <textarea className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500" value={renameForm.description} onChange={(event) => setRenameForm({ ...renameForm, description: event.target.value })} />
                        </label>
                        <div className="mt-4 flex gap-2">
                            <button type="button" className="h-11 flex-1 rounded-xl border text-sm font-semibold" onClick={() => setRenaming(false)} disabled={mutations.updateRole.isPending}>Cancel</button>
                            <button type="submit" className="h-11 flex-1 rounded-xl bg-orange-500 text-sm font-semibold text-white disabled:opacity-50" disabled={mutations.updateRole.isPending || !renameForm.name.trim()}>{mutations.updateRole.isPending ? 'Saving...' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            )}

            {showAccess && selected && createPortal(
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setShowAccess(false)}>
                    <div
                        className="flex max-h-[min(32rem,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="role-access-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                            <h3 id="role-access-title" className="text-base font-bold text-slate-900">What {selected.name} can do</h3>
                            <button type="button" aria-label="Close" onClick={() => setShowAccess(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
                            {summarizeRole(draft).map((line) => (
                                <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-slate-800">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
                                    <span>{line}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>,
                document.body,
            )}

            {confirm && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5">
                            <h3 className="text-base font-bold text-slate-900">{confirm === 'duplicate' ? 'Duplicate role' : 'Delete role'}</h3>
                            <button type="button" aria-label="Close" onClick={() => setConfirm(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4 p-6">
                            <p className="text-sm text-slate-600">
                                {confirm === 'duplicate'
                                    ? `Create a copy of ${selected.name} with the same permissions.`
                                    : `Delete the ${selected.name} role? This cannot be undone.`}
                            </p>
                            {confirm === 'duplicate' && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</p>
                                    <p className="mt-1 text-sm text-slate-700">{selected.description || 'No description saved for this role.'}</p>
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setConfirm(null)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
                                {confirm === 'duplicate' ? (
                                    <button type="button" onClick={duplicateRole} disabled={mutations.createRole.isPending || mutations.setPermissions.isPending} className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50">
                                        {mutations.createRole.isPending ? 'Duplicating...' : 'Duplicate'}
                                    </button>
                                ) : (
                                    <button type="button" onClick={removeRole} disabled={mutations.deleteRole.isPending} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                                        {mutations.deleteRole.isPending ? 'Deleting...' : 'Delete role'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`rounded-xl border px-4 py-3 text-xs font-semibold text-white shadow-xl ${
                            toast.tone === 'error' ? 'border-rose-500 bg-rose-600' : 'border-slate-800 bg-slate-900'
                        }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
        </label>
    );
}

function RoleCard({
    role,
    active,
    count,
    onSelect,
}: {
    role: AdminRole;
    active: boolean;
    count: number;
    onSelect: () => void;
}) {
    const Icon = roleIcon(role.code);
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                active
                    ? 'border-orange-500/50 bg-orange-50/60 text-slate-900 shadow-sm ring-1 ring-orange-500/30'
                    : 'border-slate-200/70 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
            <span className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="h-4 w-4" />
                </span>
                <span>
                    <span className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{role.name}</span>
                        {role.code === 'SUPER_ADMIN' && (
                            <span className="rounded border border-amber-200/60 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">Fixed</span>
                        )}
                    </span>
                    <span className="block text-[11px] font-medium text-slate-400">{count} permissions enabled</span>
                </span>
            </span>
            <ChevronRight className={`h-4 w-4 ${active ? 'text-orange-500' : 'text-slate-300'}`} />
        </button>
    );
}

function PermissionRow({
    item,
    checked,
    disabled,
    onToggle,
}: {
    item: AdminPermission;
    checked: boolean;
    disabled: boolean;
    onToggle: () => void;
}) {
    const badge = permissionBadge(item.code);
    const comingSoon = isComingSoon(item.code);
    return (
        <div className={`flex items-start justify-between rounded-lg p-2 ${comingSoon ? 'cursor-not-allowed bg-slate-50 opacity-50' : 'group hover:bg-slate-50'}`}>
            <div className="min-w-0 pr-3">
                <p className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold ${comingSoon ? 'text-slate-400' : 'text-slate-800'}`}>
                    {item.name}
                    {badge && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${comingSoon ? 'bg-slate-200 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>
                            {badge}
                        </span>
                    )}
                </p>
                {item.description && item.description !== item.name && (
                    <p className={`mt-0.5 text-[11px] leading-relaxed ${comingSoon ? 'text-slate-400' : 'text-slate-500'}`}>{item.description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={item.name}
                disabled={disabled || comingSoon}
                onClick={onToggle}
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition disabled:cursor-not-allowed ${comingSoon ? '' : 'disabled:opacity-40'} ${checked ? 'bg-orange-500' : 'bg-slate-200'}`}
            >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full border-2 bg-white transition ${checked ? 'left-4 border-orange-500' : 'left-0.5 border-slate-300'}`} />
            </button>
        </div>
    );
}
