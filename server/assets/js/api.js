/** API base ending with /api — matches page origin when served with the Node app; use meta or window.API_BASE_URL if HTML is on another port (e.g. Live Server). */
function getApiBase() {
    if (typeof window === 'undefined') return 'http://localhost:3000/api';
    if (typeof window.API_BASE_URL === 'string' && window.API_BASE_URL.trim()) {
        return window.API_BASE_URL.replace(/\/$/, '');
    }
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.getAttribute('content') && meta.getAttribute('content').trim()) {
        return meta.getAttribute('content').trim().replace(/\/$/, '');
    }
    if (window.location.protocol === 'file:') {
        return 'http://localhost:3000/api';
    }
    return `${window.location.origin}/api`;
}

/** Use for <img src>; API JSON routes like api/categories/&lt;id&gt; are not image URLs and would 404 */
function safeMediaSrc(src, fallback = 'assets/img/Kaviya_crackers_logo.jpeg') {
    if (src == null || src === '') return fallback;
    const s = String(src).trim();
    if (!s) return fallback;
    if (s.startsWith('data:')) return s;
    if (/^api\//i.test(s)) return fallback;
    return s;
}

function debugLogClient(payload) {
    const body = JSON.stringify({ sessionId: '05429b', runId: 'post-fix2', timestamp: Date.now(), ...payload });
    fetch(`${getApiBase()}/debug-session-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
}

async function apiFetchData() {
    try {
        const res = await fetch(`${getApiBase()}/data`);
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return null;
    }
}

async function apiSaveData(data) {
    try {
        await fetch(`${getApiBase()}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        console.error('API Error:', e);
    }
}

async function apiUploadImage(file, type) {
    const formData = new FormData();
    formData.append('image', file);
    
    const endpoint = type === 'category' ? '/upload-category' : '/upload-product';
    const url = `${getApiBase()}${endpoint}`;

    // #region agent log
    debugLogClient({ hypothesisId: 'H2', location: 'api.js:apiUploadImage', message: 'before fetch', data: { type, url, apiBase: getApiBase(), pageOrigin: typeof location !== 'undefined' ? location.origin : '', pageProtocol: typeof location !== 'undefined' ? location.protocol : '', fileName: file && file.name, fileSize: file && file.size } });
    // #endregion

    try {
        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const text = await res.text();

        // #region agent log
        debugLogClient({ hypothesisId: 'H3', location: 'api.js:apiUploadImage', message: 'response received', data: { status: res.status, contentType: res.headers.get('content-type'), bodyPrefix: text.slice(0, 160) } });
        // #endregion

        let result;
        try {
            result = JSON.parse(text);
        } catch (parseErr) {
            // #region agent log
            debugLogClient({ hypothesisId: 'H3', location: 'api.js:apiUploadImage', message: 'json parse failed', data: { parseErr: String(parseErr.message) } });
            // #endregion
            return null;
        }

        const outPath = result.success ? result.path : null;
        // #region agent log
        debugLogClient({ hypothesisId: 'H5', location: 'api.js:apiUploadImage', message: 'parsed result', data: { success: !!result.success, path: outPath } });
        // #endregion

        return outPath;
    } catch (e) {
        // #region agent log
        debugLogClient({ hypothesisId: 'H2', location: 'api.js:apiUploadImage', message: 'fetch threw', data: { err: String(e && e.message) } });
        // #endregion
        console.error('API Error:', e);
        return null;
    }
}

async function apiLogin(username, password) {
    try {
        const res = await fetch(`${getApiBase()}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return { success: false, message: 'Server Error' };
    }
}

async function apiUpdateOrderStatus(id, status) {
    try {
        const res = await fetch(`${getApiBase()}/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return { success: false };
    }
}

async function apiCreateOrder(order) {
    try {
        const res = await fetch(`${getApiBase()}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return { success: false };
    }
}

async function apiFetchSettings() {
    try {
        const res = await fetch(`${getApiBase()}/settings`);
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return {};
    }
}
