import { useState } from 'react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { downloadReport, useAdminReport } from '@/hooks/useAdminOps';
import { LoadingRow, Notice, PageHeader, Panel } from './adminUi';

const EXPORTS = [
    { kind: 'creators', label: 'Creators' },
    { kind: 'brands', label: 'Brands' },
    { kind: 'campaigns', label: 'Campaigns' },
    { kind: 'payments', label: 'Payments' },
    { kind: 'payouts', label: 'Payouts' },
];

export default function AdminReports() {
    const me = useAdminMe();
    const canExport = adminCan(me.data, 'REPORT_EXPORT');
    const report = useAdminReport();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState('');
    const data = report.data;

    const download = async (kind: string) => {
        setError('');
        setBusy(kind);
        try {
            await downloadReport(kind);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not download that report.'));
        } finally {
            setBusy('');
        }
    };

    return (
        <div className="space-y-5">
            <PageHeader title="Reports" description="Totals across the platform. Downloads include names and emails." />
            {error && <Notice>{error}</Notice>}
            {report.isLoading ? <LoadingRow /> : report.isError ? <Notice>{getApiErrorMessage(report.error, 'Could not load reports.')}</Notice> : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        ['Creators', data?.creators],
                        ['Brands', data?.brands],
                        ['Campaigns', data?.campaigns],
                        ['Payments', data?.payments],
                        ['Payouts', data?.payouts],
                        ['Wallets', data?.wallets],
                    ].map(([label, value]) => (
                        <Panel key={String(label)} className="p-5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-gray">{label}</p>
                            <p className="mt-2 text-3xl font-extrabold text-brand-ink">{value ?? 0}</p>
                        </Panel>
                    ))}
                </div>
            )}
            {canExport && (
                <Panel className="p-5">
                    <p className="text-sm font-bold text-brand-ink">Download</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {EXPORTS.map((item) => (
                            <button key={item.kind} type="button" className="rounded-full border border-[#dce8f0] bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-40" disabled={busy === item.kind} onClick={() => download(item.kind)}>
                                {busy === item.kind ? 'Preparing...' : item.label}
                            </button>
                        ))}
                    </div>
                </Panel>
            )}
        </div>
    );
}
