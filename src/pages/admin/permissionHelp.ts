const NOT_LIVE = new Set<string>();

export function isComingSoon(code: string) {
    return NOT_LIVE.has(code);
}

export function permissionBadge(code: string) {
    if (NOT_LIVE.has(code)) return 'Coming soon';
    return null;
}

export function summarizeRole(codes: string[]) {
    const on = new Set(codes);
    const has = (...keys: string[]) => keys.some((key) => on.has(key));
    const lines = ['Dashboard and Security are always available.'];

    if (has('CREATOR_VIEW')) lines.push('Can open Creators and Compare.');
    else if (has('CREATOR_EDIT', 'CREATOR_APPROVE', 'CREATOR_SUSPEND')) lines.push('Can open Creators.');
    if (on.has('CREATOR_EDIT')) lines.push('Can allow or disallow a creator’s features.');
    if (on.has('CREATOR_SUSPEND')) lines.push('Can suspend a creator. They are signed out until approved.');
    if (on.has('CREATOR_APPROVE')) lines.push('Can approve an inactive creator so they can sign in again.');

    if (has('BRAND_VIEW', 'BRAND_EDIT', 'BRAND_APPROVE', 'BRAND_SUSPEND')) lines.push('Can open Brands.');
    if (on.has('BRAND_EDIT')) lines.push('Can edit a brand’s name, email, and phone.');
    if (on.has('BRAND_SUSPEND')) lines.push('Can suspend a brand. They are signed out until approved.');
    if (on.has('BRAND_APPROVE')) lines.push('Can approve an inactive brand so they can sign in again.');

    if (has('CAMPAIGN_VIEW', 'CAMPAIGN_CREATE', 'CAMPAIGN_EDIT', 'CAMPAIGN_APPROVE', 'CAMPAIGN_REJECT', 'CAMPAIGN_DELETE')) lines.push('Can open Campaigns.');
    if (on.has('CAMPAIGN_CREATE')) lines.push('Can create a campaign draft for a brand.');
    if (on.has('CAMPAIGN_APPROVE')) lines.push('Can approve a campaign so it goes live.');
    if (on.has('CAMPAIGN_REJECT')) lines.push('Can reject a campaign. It becomes paused.');
    if (on.has('CAMPAIGN_DELETE')) lines.push('Can delete a campaign that has no submissions or spent budget.');

    if (on.has('PAYMENT_MANAGE')) lines.push('Can see payments and record a wallet top-up.');
    else if (on.has('PAYMENT_VIEW')) lines.push('Can see payment top-ups.');
    if (on.has('PAYOUT_MANAGE')) lines.push('Can see payouts, release one now, or cancel it.');
    else if (on.has('PAYOUT_VIEW')) lines.push('Can see payouts.');
    if (on.has('WALLET_MANAGE')) lines.push('Can see wallets and add or remove available balance.');
    else if (on.has('WALLET_VIEW')) lines.push('Can see wallet balances.');
    if (on.has('CONTENT_MANAGE')) lines.push('Can see creator reels and cancel or remove them.');
    else if (on.has('CONTENT_VIEW')) lines.push('Can see creator reels.');
    if (on.has('REPORT_EXPORT')) lines.push('Can open Reports and download spreadsheets.');
    else if (on.has('REPORT_VIEW')) lines.push('Can open Reports and see totals.');

    if (on.has('SUPPORT_MANAGE')) lines.push('Can read support, reply, and change ticket status.');
    else if (on.has('SUPPORT_VIEW')) lines.push('Can read support tickets and FAQs, but cannot reply or change status.');
    if (on.has('SUPPORT_FAQ_EDIT')) lines.push('Can add and edit the questions on the support page.');
    if (on.has('SUPPORT_FAQ_DELETE')) lines.push('Can delete a question from the support page.');
    if (on.has('SUPPORT_BOT_EDIT')) lines.push('Can add and edit chat bot options.');
    if (on.has('SUPPORT_BOT_DELETE')) lines.push('Can delete a chat bot option.');

    if (on.has('ACTIVITY_VIEW_USERS') && on.has('ACTIVITY_VIEW_ADMINS')) lines.push('Can see creator, brand, and admin activity.');
    else if (on.has('ACTIVITY_VIEW_USERS')) lines.push('Can see creator and brand activity.');
    else if (on.has('ACTIVITY_VIEW_ADMINS')) lines.push('Can see admin activity.');
    else if (on.has('ACTIVITY_VIEW')) lines.push('Can open Activity, but the list stays empty until user or admin activity is on.');

    if (on.has('STAFF_VIEW') && on.has('ADMIN_VIEW')) lines.push('Can see every account on Team.');
    else if (on.has('STAFF_VIEW')) lines.push('Can see staff and custom roles on Team, not Admin accounts.');
    else if (on.has('ADMIN_VIEW')) lines.push('Can see Admin accounts on Team, not staff.');

    if (has('STAFF_CREATE', 'ADMIN_CREATE')) lines.push('Can create staff or custom-role accounts. Creating an Admin still needs a Super Admin.');
    if (on.has('SETTINGS_MANAGE')) lines.push('Can edit the cities and languages creators choose on their profile.');
    else if (on.has('SETTINGS_VIEW')) lines.push('Can open Profile options and read cities and languages, but cannot change them.');

    if (on.has('PERMISSION_MANAGE')) lines.push('Can change permission switches on custom roles. System roles stay locked.');
    else if (on.has('ROLE_VIEW')) lines.push('Can open Roles and read who can do what.');
    if (on.has('ROLE_EDIT')) lines.push('Can rename a role and change its description.');
    if (on.has('USER_IMPERSONATE')) lines.push('Can open an active creator or brand account. Support messages stay blocked in that session.');
    if (on.has('SESSION_VIEW_USERS')) lines.push('Can see a creator or brand’s signed-in devices.');
    if (on.has('SESSION_REVOKE_USERS')) lines.push('Can sign out a creator or brand device.');
    if (on.has('SESSION_VIEW_ADMINS')) lines.push('Can see another admin’s devices on Team.');
    if (on.has('SESSION_REVOKE_ADMINS')) lines.push('Can sign out another admin’s device.');

    return lines;
}
