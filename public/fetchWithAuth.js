async function fetchWithAuth(url, options = {}) {
    const accessToken = sessionStorage.getItem('accessToken');

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (response.status === 403) {
        console.log("Access token expired, trying refresh token...");

        // Get new token
        const refreshToken = sessionStorage.getItem('refreshToken');
        const refreshResponse = await fetch('/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            sessionStorage.setItem('accessToken', data.accessToken);

            // Retry the original request with new token
            return fetchWithAuth(url, options);
        } else {
            console.log("Refresh token invalid, logging out...");

            // Call the logout API before clearing sessionStorage
            const logoutResponse = await fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('username');
            window.location.href = '/login';
        }
    }
    return response;
}