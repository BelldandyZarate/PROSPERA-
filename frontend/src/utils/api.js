class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.refreshing = false;
        this.queue = [];
    }

    async request(endpoint, options = {}) {
        let token = localStorage.getItem('access_token');
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);

            // Si el token expiró, intentar refrescar
            if (response.status === 401 && token) {
                const newToken = await this.handleUnauthorized();
                if (newToken) {
                    // Reintentar la request con nuevo token
                    config.headers['Authorization'] = `Bearer ${newToken}`;
                    return fetch(`${this.baseURL}${endpoint}`, config);
                } else {
                    // No se pudo refrescar, redirigir a login
                    window.location.href = '/login';
                    throw new Error('Sesión expirada');
                }
            }

            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async handleUnauthorized() {
        if (this.refreshing) {
            // Esperar a que termine el refresh actual
            return new Promise((resolve) => {
                this.queue.push(resolve);
            });
        }

        this.refreshing = true;

        try {
            const refreshToken = localStorage.getItem('refresh_token');
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Actualizar tokens
                localStorage.setItem('access_token', data.accessToken);
                localStorage.setItem('refresh_token', data.refreshToken);
                
                // Notificar a todas las requests en espera
                this.queue.forEach(resolve => resolve(data.accessToken));
                this.queue = [];
                
                return data.accessToken;
            } else {
                throw new Error('Refresh failed');
            }
        } catch (error) {
            // Limpiar sesión
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_session_data');
            sessionStorage.clear();
            
            // Redirigir a login
            window.location.href = '/login';
            return null;
        } finally {
            this.refreshing = false;
        }
    }

    // Métodos helpers
    get(endpoint) {
        return this.request(endpoint);
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: formData,
        });
    }
}

export default new ApiService();