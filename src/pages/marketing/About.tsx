import { Link } from 'react-router-dom';
import { Building2, Mail, MapPin } from 'lucide-react';
import { COMPANY } from '@/constants/company';

export default function About() {
    return (
        <div className="container max-w-3xl py-16 px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">About TapnLike</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    {COMPANY.description}
                </p>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold">{COMPANY.legalName}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                    {COMPANY.legalName} is the legal entity that owns and operates the TapnLike platform.
                    The company is registered in {COMPANY.country} and develops technology products for the
                    music and creator economy.
                </p>
                <div className="bg-muted/30 border rounded-lg p-6 space-y-3 text-sm">
                    <p>
                        <span className="font-medium text-foreground">Legal name:</span>{' '}
                        {COMPANY.legalName}
                    </p>
                    <p>
                        <span className="font-medium text-foreground">Product:</span>{' '}
                        {COMPANY.productName}
                    </p>
                    <p>
                        <span className="font-medium text-foreground">Website:</span>{' '}
                        <a href={COMPANY.website} className="text-primary hover:underline">
                            {COMPANY.website}
                        </a>
                    </p>
                    <p className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <span>{COMPANY.country}</span>
                    </p>
                </div>
            </section>

            <section id="contact" className="space-y-4 scroll-mt-20">
                <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold">Contact</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                    For platform support, partnership inquiries, or general questions about TapnLike, reach
                    out to our team.
                </p>
                <div className="bg-muted/30 border rounded-lg p-6 space-y-2 text-sm">
                    <p>
                        <span className="font-medium text-foreground">Support:</span>{' '}
                        <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary hover:underline">
                            {COMPANY.supportEmail}
                        </a>
                    </p>
                    <p>
                        <span className="font-medium text-foreground">Privacy:</span>{' '}
                        <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary hover:underline">
                            {COMPANY.privacyEmail}
                        </a>
                    </p>
                </div>
            </section>

            <section className="space-y-3 text-sm text-muted-foreground border-t pt-8">
                <p>
                    See also:{' '}
                    <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                    {' · '}
                    <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
                    {' · '}
                    <Link to="/data-deletion" className="text-primary hover:underline">Data Deletion</Link>
                </p>
            </section>
        </div>
    );
}
