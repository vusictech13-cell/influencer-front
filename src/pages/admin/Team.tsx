import { useState, type ReactNode } from 'react';
import { Pagination } from 'antd';
import { Eye, EyeOff, MonitorSmartphone, Pencil, Trash2, UserRoundCheck, UserRoundX } from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import { useAdminAccountMutations, useAdminAccounts, type AccountPayload, type AdminAccount } from '@/hooks/useAdminTeam';
import { LoadingRow, Modal, Notice, PageHeader, Panel, StatusPill, fieldClass, formatWhen, primaryButtonClass } from './adminUi';
import AccountSessions from './AccountSessions';

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', roleCodes: ['STAFF'] };

function IconButton({
    label,
    className,
    onClick,
    children,
}: {
    label: string;
    className: string;
    onClick: () => void;
    children: ReactNode;
}) {
    const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
    const place = (target: HTMLButtonElement) => {
        const box = target.getBoundingClientRect();
        setTip({ x: box.left + box.width / 2, y: box.top });
    };

    return (
        <>
            <button
                type="button"
                aria-label={label}
                className={className}
                onClick={onClick}
                onMouseEnter={(event) => place(event.currentTarget)}
                onMouseLeave={() => setTip(null)}
                onFocus={(event) => place(event.currentTarget)}
                onBlur={() => setTip(null)}
            >
                {children}
            </button>
            {tip && (
                <span
                    role="tooltip"
                    className="pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-full rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-sm"
                    style={{ left: tip.x, top: tip.y - 8 }}
                >
                    {label}
                </span>
            )}
        </>
    );
}

export default function AdminTeam() {
    const me = useAdminMe();
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const accounts = useAdminAccounts(page, search);
    const roles = useAdminRoles();
    const mutations = useAdminAccountMutations();
    const [form, setForm] = useState<AccountPayload & { password: string } | null>(null);
    const [editing, setEditing] = useState<AdminAccount | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [pending, setPending] = useState<{ account: AdminAccount; kind: 'suspend' | 'activate' | 'delete' } | null>(null);
    const [devices, setDevices] = useState<AdminAccount | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canCreate = adminCan(me.data, 'STAFF_CREATE', 'ADMIN_CREATE');
    const roleOptions = (roles.data || []).filter((role) => role.status === 'active');
    const assignableRoles = roleOptions.filter((role) => {
        if (me.data?.is_super_admin) return true;
        return role.code !== 'SUPER_ADMIN' && role.code !== 'ADMIN';
    });
    const shownRoles = editing ? roleOptions : assignableRoles;

    const openCreate = () => {
        setEditing(null);
        setError(null);
        setShowPassword(false);
        setForm({ ...EMPTY_FORM });
    };

    const openEdit = (account: AdminAccount) => {
        setEditing(account);
        setError(null);
        setShowPassword(false);
        setForm({
            name: account.name,
            email: account.email,
            password: '',
            phone: account.phone || '',
            roleCodes: account.roles.map((role) => role.code),
        });
    };

    const toggleRole = (code: string) => {
        setForm((current) => {
            if (!current) return current;
            const has = current.roleCodes.includes(code);
            const roleCodes = has ? current.roleCodes.filter((item) => item !== code) : [...current.roleCodes, code];
            return { ...current, roleCodes };
        });
    };

    const submit = async () => {
        if (!form) return;
        setError(null);
        try {
            if (editing) {
                await mutations.updateAccount.mutateAsync({
                    id: editing.id,
                    body: {
                        name: form.name,
                        phone: form.phone,
                        password: form.password || undefined,
                        roleCodes: form.roleCodes,
                    },
                });
            } else {
                await mutations.createAccount.mutateAsync(form);
            }
            setForm(null);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not save this account.'));
        }
    };

    const confirmPending = async () => {
        if (!pending) return;
        setError(null);
        try {
            if (pending.kind === 'delete') {
                await mutations.removeAccount.mutateAsync(pending.account.id);
            } else {
                await mutations.setStatus.mutateAsync({
                    id: pending.account.id,
                    status: pending.kind === 'suspend' ? 'suspended' : 'active',
                });
            }
            setPending(null);
        } catch (err) {
            setError(getApiErrorMessage(err, pending.kind === 'delete' ? 'Could not delete this account.' : 'Could not change account status.'));
        }
    };

    const saving = mutations.createAccount.isPending || mutations.updateAccount.isPending;
    const confirming = mutations.setStatus.isPending || mutations.removeAccount.isPending;

    return (
        <div className="space-y-5">
            <PageHeader
                title="Team"
                description="Staff, admin, and super admin accounts live here. Creator and brand accounts stay on the main login."
                action={canCreate ? (
                    <button type="button" className={primaryButtonClass} onClick={openCreate}>New account</button>
                ) : undefined}
            />
            {error && !form && !pending && <Notice>{error}</Notice>}
            <form
                className="flex gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    setPage(1);
                    setSearch(searchInput.trim());
                }}
            >
                <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search name or email"
                    className={fieldClass}
                />
                <button type="submit" className="h-11 rounded-xl border border-[#dce8f0] bg-white px-4 text-sm font-bold">Search</button>
            </form>
            <Panel>
                {accounts.isLoading ? <LoadingRow /> : accounts.isError ? (
                    <div className="p-5"><Notice>{getApiErrorMessage(accounts.error, 'Could not load accounts.')}</Notice></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Name</th>
                                    <th className="px-4 py-3 font-bold">Roles</th>
                                    <th className="px-4 py-3 font-bold">Status</th>
                                    <th className="px-4 py-3 font-bold">Last login</th>
                                    <th className="px-4 py-3 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(accounts.data?.items || []).map((account) => {
                                    const isSelf = account.id === me.data?.id;
                                    const isSuperAdminAccount = account.roles.some((role) => role.code === 'SUPER_ADMIN');
                                    const isAdminAccount = account.roles.some((role) => role.code === 'ADMIN' || role.code === 'SUPER_ADMIN');
                                    const canManageAccount = !!me.data?.is_super_admin || !isSuperAdminAccount;
                                    const canEditAccount = canManageAccount && (isAdminAccount
                                        ? adminCan(me.data, 'ADMIN_EDIT')
                                        : adminCan(me.data, 'STAFF_EDIT', 'ADMIN_EDIT'));
                                    const canViewDevices = adminCan(me.data, 'SESSION_VIEW_ADMINS');
                                    const canChangeStatus = canManageAccount && !isSelf && (isAdminAccount
                                        ? adminCan(me.data, 'ADMIN_SUSPEND')
                                        : adminCan(me.data, 'STAFF_SUSPEND', 'ADMIN_SUSPEND'));
                                    return (
                                        <tr key={account.id} className="border-b border-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-brand-ink">{account.name}{isSelf ? ' (you)' : ''}</p>
                                                <p className="text-xs text-brand-gray">{account.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-brand-ink">
                                                {account.roles.map((role) => role.name).join(', ') || '—'}
                                            </td>
                                            <td className="px-4 py-3"><StatusPill status={account.status} /></td>
                                            <td className="px-4 py-3 text-xs text-brand-gray">{formatWhen(account.last_login_at)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {canViewDevices && (
                                                        <IconButton label="Devices" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#0b7cad] transition hover:bg-[#e7f4fb]" onClick={() => setDevices(account)}>
                                                            <MonitorSmartphone className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {canEditAccount && (
                                                        <IconButton label="Edit" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#0b7cad] transition hover:bg-[#e7f4fb]" onClick={() => openEdit(account)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {canChangeStatus && (
                                                        <IconButton
                                                            label={account.status === 'active' ? 'Suspend' : 'Activate'}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-orange transition hover:bg-[#fff1e8]"
                                                            onClick={() => setPending({ account, kind: account.status === 'active' ? 'suspend' : 'activate' })}
                                                        >
                                                            {account.status === 'active' ? <UserRoundX className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />}
                                                        </IconButton>
                                                    )}
                                                    {me.data?.is_super_admin && !isSelf && (
                                                        <IconButton label="Delete" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50" onClick={() => setPending({ account, kind: 'delete' })}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!accounts.data?.items.length && (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-gray">No accounts found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
            {(accounts.data?.total || 0) > 20 && (
                <Pagination
                    current={page}
                    pageSize={20}
                    total={accounts.data?.total}
                    onChange={setPage}
                    showSizeChanger={false}
                />
            )}
            {form && (
                <Modal title={editing ? 'Edit account' : 'New account'} onClose={() => !saving && setForm(null)}>
                    <div className="space-y-3">
                        {error && <Notice>{error}</Notice>}
                        <label className="block text-xs font-semibold text-[#5c6570]">Name
                            <input className={`${fieldClass} mt-1`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                        </label>
                        {!editing && (
                            <label className="block text-xs font-semibold text-[#5c6570]">Email
                                <input className={`${fieldClass} mt-1`} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                            </label>
                        )}
                        <label className="block text-xs font-semibold text-[#5c6570]">{editing ? 'New password (optional)' : 'Password'}
                            <span className="relative mt-1 block">
                                <input
                                    className={`${fieldClass} pr-10`}
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                                />
                                <button
                                    type="button"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowPassword((current) => !current)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d9098] hover:text-[#121318]"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </span>
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Phone
                            <input
                                className={`${fieldClass} mt-1`}
                                inputMode="numeric"
                                autoComplete="tel"
                                value={form.phone}
                                onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 15) })}
                            />
                        </label>
                        <fieldset>
                            <legend className="text-xs font-semibold text-[#5c6570]">Roles</legend>
                            <div className="mt-2 space-y-2">
                                {(shownRoles.length ? shownRoles : [{ id: 0, name: 'Staff', code: 'STAFF', permissions: [] }]).map((role) => (
                                    <label key={role.code} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.roleCodes.includes(role.code)}
                                            onChange={() => toggleRole(role.code)}
                                        />
                                        {role.name}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <div className="flex gap-2 pt-2">
                            <button type="button" className="h-11 flex-1 rounded-xl border border-[#dce8f0] text-sm font-bold" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
                            <button type="button" className={`${primaryButtonClass} flex-1`} onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </Modal>
            )}
            {pending && (
                <Modal title={pending.kind === 'delete' ? 'Delete account' : pending.kind === 'suspend' ? 'Suspend account' : 'Activate account'} onClose={() => !confirming && setPending(null)}>
                    <div className="space-y-4">
                        {error && <Notice>{error}</Notice>}
                        <p className="text-sm text-[#5c6570]">
                            {pending.kind === 'delete'
                                ? `Delete ${pending.account.name}? Their sessions will end.`
                                : pending.kind === 'suspend'
                                    ? `Suspend ${pending.account.name}? They will stay signed out until the account is activated.`
                                    : `Activate ${pending.account.name}? They will be able to sign in again.`}
                        </p>
                        <div className="flex gap-2">
                            <button type="button" className="h-11 flex-1 rounded-xl border border-[#dce8f0] text-sm font-bold" onClick={() => setPending(null)} disabled={confirming}>Cancel</button>
                            <button
                                type="button"
                                className={`h-11 flex-1 rounded-xl text-sm font-bold text-white disabled:opacity-50 ${pending.kind === 'delete' ? 'bg-red-500' : 'bg-brand-orange'}`}
                                onClick={confirmPending}
                                disabled={confirming}
                            >
                                {confirming ? 'Working...' : pending.kind === 'delete' ? 'Delete' : pending.kind === 'suspend' ? 'Suspend' : 'Activate'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            {devices && (
                <Modal title={`${devices.name}'s devices`} onClose={() => setDevices(null)}>
                    <AccountSessions owner="admin" ownerId={devices.id} canRevoke={adminCan(me.data, 'SESSION_REVOKE_ADMINS') && (me.data?.is_super_admin || !devices.roles.some((role) => role.code === 'SUPER_ADMIN'))} />
                </Modal>
            )}
        </div>
    );
}
