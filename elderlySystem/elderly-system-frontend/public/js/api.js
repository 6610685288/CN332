class APIFacade {
    constructor(baseUrl) { 
        this.baseUrl = baseUrl; 
    }

    async _request(endpoint, method = 'GET', body = null) {
        const options = { 
            method, 
            headers: { 'Content-Type': 'application/json' } 
        };
        if (body) options.body = JSON.stringify(body);
        
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, options);
            if (!res.ok) throw new Error('Status ' + res.status);
            return await res.json();
        } catch (error) {
            console.warn("API Error (Facade caught this):", error);
            return null; // Return null to let app.js handle fallback
        }
    }

    // --- Public Methods ---
    async getVehicles() { 
        return this._request('/vehicles'); 
    }

    async bookVehicle(data) { 
        return this._request('/book-vehicle', 'POST', data); 
    }

    async getActivities() { 
        return this._request('/activities'); 
    }

    async joinActivity(id) { 
        return this._request('/join-activity', 'POST', { activityId: id }); 
    }

    async getMySchedule() { 
        return this._request('/my-bookings'); 
    }
}