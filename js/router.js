import { requireAuth } from './auth.js';

const PROTECTED_PAGES = ['input.html', 'display.html'];
const AUTH_PAGE = 'index.html';

export async function initRouter() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (PROTECTED_PAGES.includes(currentPage)) {
        const session = await requireAuth(AUTH_PAGE);
        if (!session) return false;
    }
    
    if (currentPage === AUTH_PAGE) {
        const session = await requireAuth(null);
        if (session) {
            window.location.href = 'input.html';
            return false;
        }
    }
    
    return true;
}

export function requireAuthOnPage(redirectTo = 'index.html') {
    return requireAuth(redirectTo);
}