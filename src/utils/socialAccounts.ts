export function getInstagramOAuthErrorMessage(
    error: string | null,
    errorDescription: string | null,
): string | null {
    if (errorDescription) {
        return errorDescription;
    }

    if (!error) {
        return null;
    }

    if (error === 'no_instagram_page') {
        return (
            'Facebook login succeeded, but no Instagram Professional account is linked to a Facebook Page. '
            + 'Convert the Instagram account to Professional, link it to a Facebook Page, then connect Meta again.'
        );
    }

    if (error === 'instagram_graph_access_denied') {
        return (
            'Facebook login succeeded, but Meta rejected Instagram API access. '
            + 'The app must be Live with Advanced Access for pages_show_list, instagram_basic, '
            + 'instagram_manage_insights and instagram_content_publish. Your Instagram account must be Professional and linked to a Facebook Page.'
        );
    }

    if (error === 'instagram_login_denied') {
        return (
            'Instagram Login could not finish. Use a Professional Instagram account (Business or Creator) '
            + 'and approve the requested Instagram permissions.'
        );
    }

    if (error === 'account_already_connected') {
        return 'This Instagram account is already connected to another TapnLike account.';
    }

    return error.replace(/_/g, ' ');
}

export function getOAuthSuccessMessage(success: string | null): string | null {
    if (success === 'connected') return 'Instagram account connected.';
    if (success === 'meta_connected') return 'Meta account connected. Reels Studio is available.';
    return null;
}

export function clearInstagramOAuthSearchParams(params: URLSearchParams) {
    params.delete('success');
    params.delete('error');
    params.delete('error_description');
    params.delete('error_code');
}

export function accountHasMeta(account?: { can_use_reels_studio?: boolean; has_meta_connection?: boolean; fb_page_id?: string | null; auth_method?: string } | null) {
    if (!account) return false;
    return Boolean(
        account.can_use_reels_studio
        || account.has_meta_connection
        || account.fb_page_id
        || account.auth_method === 'facebook_login',
    );
}
