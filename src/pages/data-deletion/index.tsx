import { Link } from 'react-router-dom';
import LegalDocument from '@/components/marketing/LegalDocument';
import { COMPANY } from '@/constants/company';

export default function DataDeletion() {
    return (
        <LegalDocument title="Data Deletion Instructions" lastUpdated="August 13, 2026">
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {COMPANY.productName}, operated by {COMPANY.legalName}, respects your right to control
                    your personal data. This page explains how to request deletion of your account and
                    associated data from our platform.
                </p>
            </section>

            <hr className="border-border" />

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">What Gets Deleted</h2>
                <p className="text-muted-foreground leading-relaxed">
                    When you request data deletion, we will remove or anonymize the following, where applicable:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Your account profile (name, email, and account settings)</li>
                    <li>Connected social media account tokens and synced profile data</li>
                    <li>Creator analytics and performance data derived from authorized platform access</li>
                    <li>Campaign submissions and associated content linked to your account</li>
                    <li>Payment and wallet records, subject to legal retention requirements</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">How to Request Deletion</h2>
                <p className="text-muted-foreground leading-relaxed">
                    You can request deletion of your data using any of the following methods:
                </p>

                <div className="space-y-4">
                    <div className="bg-muted/30 border rounded-lg p-6 space-y-2">
                        <h3 className="font-semibold text-foreground">Option 1: Email Request</h3>
                        <p className="text-sm text-muted-foreground">
                            Send an email to{' '}
                            <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary hover:underline">
                                {COMPANY.privacyEmail}
                            </a>{' '}
                            with the subject line "Data Deletion Request" and include:
                        </p>
                        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                            <li>Your full name</li>
                            <li>The email address associated with your TapnLike account</li>
                            <li>Your connected Instagram username (if applicable)</li>
                        </ul>
                    </div>

                    <div className="bg-muted/30 border rounded-lg p-6 space-y-2">
                        <h3 className="font-semibold text-foreground">Option 2: Disconnect & Delete via Platform</h3>
                        <p className="text-sm text-muted-foreground">
                            Log in to your account, disconnect any linked social media accounts from your
                            dashboard, and contact{' '}
                            <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary hover:underline">
                                {COMPANY.supportEmail}
                            </a>{' '}
                            to complete full account deletion.
                        </p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Processing Timeline</h2>
                <p className="text-muted-foreground leading-relaxed">
                    We will acknowledge your request within 7 business days and complete deletion within 30
                    days, unless a longer period is required by law or for legitimate business purposes such
                    as fraud prevention or legal compliance.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Meta / Instagram Data</h2>
                <p className="text-muted-foreground leading-relaxed">
                    If you connected your Instagram account through Instagram Login or optional Meta authorization, deleting your
                    {COMPANY.productName} account will revoke our access to your Instagram data stored on our
                    platform. You can also revoke access directly in your Instagram account settings under
                    "Apps and Websites."
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Data We May Retain</h2>
                <p className="text-muted-foreground leading-relaxed">
                    We may retain certain information where required by law, for dispute resolution, or to
                    enforce our agreements. Anonymized or aggregated data that cannot identify you may be retained
                    for analytics and platform improvement.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Contact</h2>
                <div className="bg-muted/30 p-6 rounded-lg space-y-2 text-muted-foreground border">
                    <p className="font-semibold text-foreground">Privacy Officer — {COMPANY.productName}</p>
                    <p>
                        Email:{' '}
                        <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary hover:underline">
                            {COMPANY.privacyEmail}
                        </a>
                    </p>
                    <p>
                        See also:{' '}
                        <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </section>
        </LegalDocument>
    );
}
