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
        return this._request('/booking/create', 'POST', data);
    }

    async getActivities() {
        return this._request('/activities');
    }

    async joinActivity(id, elderlyId) {
        return this._request('/activities/join', 'POST', { elderlyId, activityId: id });
    }

    async getMySchedule(elderlyId) {
        try {
            // 1️⃣ Get bookings
            const bookings = await this._request(
                `/booking/my-bookings/${encodeURIComponent(elderlyId)}`
            );

            // 2️⃣ Get joined activities
            const activities = await this._request(
                `/activities/my/${encodeURIComponent(elderlyId)}`
            );

            let scheduleItems = [];

            // Format vehicle bookings
            if (bookings) {
                const bookingItems = bookings.map(b => ({
                    type: 'vehicle',
                    title: `จองรถไป ${b.destination}`,
                    detail: `เวลา: ${b.scheduledTime} | ผู้โดยสาร: ${b.passengers} คน`,
                    timestamp: b.createdAt,
                    status: 'pending'
                }));

                scheduleItems = scheduleItems.concat(bookingItems);
            }

            // Format joined activities
            if (activities) {
                const activityItems = activities.map(a => ({
                    type: 'activity',
                    title: `กิจกรรม ID: ${a.activityId}`,
                    detail: `เข้าร่วมแล้ว`,
                    timestamp: a.createdAt,
                    status: 'joined'
                }));

                scheduleItems = scheduleItems.concat(activityItems);
            }

            // Sort newest first
            scheduleItems.sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            return scheduleItems;

        } catch (error) {
            console.error("Schedule error:", error);
            return [];
        }
    }
}