class APIFacade {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async _request(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('token');

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${this.baseUrl}${endpoint}`, options);
        const data = await res.json();
        
        if (!res.ok) {
            // ดึงข้อความ Error จริงๆ มาโชว์ (ถ้ามี)
            const errMsg = data.error ? `${data.message}: ${data.error}` : data.message;
            throw new Error(errMsg || 'เกิดข้อผิดพลาด');
        }
        return data;
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

    async joinActivity(activityId) {
        return this._request('/activities/join', 'POST', {
            activityId: activityId
        });
    }

    async leaveActivity(activityId) {
        return this._request('/activities/leave', 'POST', {
            activityId
        });
    }

    async getMySchedule() {
        try {
            // 1️⃣ Get bookings (Token will handle identity)
            const bookings = await this._request('/booking/my-bookings');

            // 2️⃣ Get joined activities (Token will handle identity)
            const activities = await this._request('/activities/my');

            let scheduleItems = [];

            // Format vehicle bookings
            if (bookings) {
                const bookingItems = bookings.map(b => ({
                    id: b.id,
                    type: 'vehicle',
                    title: `จองรถไป ${b.destination}`,
                    detail: `เวลา: ${b.scheduledTime} | ผู้โดยสาร: ${b.passengers} คน`,
                    timestamp: b.createdAt,
                    status: b.status || 'pending'
                }));

                scheduleItems = scheduleItems.concat(bookingItems);
            }

            // Format joined activities
            if (activities) {
                const activityItems = activities.map(a => {
                    // Sequelize include จะส่งมาเป็น object Activity (ตัวใหญ่)
                    const activityData = a.Activity || a.activity;
                    const activityName = activityData ? activityData.name : `กิจกรรมรหัส ${a.activityId}`;
                    // ใช้ date ของกิจกรรมจริง ไม่ใช้วันที่ join (createdAt)
                    const activityDate = activityData ? (activityData.date || activityData.createdAt) : a.createdAt;
                    return {
                        type: 'activity',
                        title: activityName,
                        detail: `วันที่: ${activityDate ? new Date(activityDate).toLocaleDateString('th-TH') : '-'} | สถานที่: ${activityData?.location || '-'}`,
                        timestamp: activityDate || a.createdAt,
                        status: 'เข้าร่วมแล้ว'
                    };
                });

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

    // --- Admin Methods ---
    async getAllUsers() {
        return this._request('/users/all');
    }

    async getAllBookings() {
        return this._request('/booking/all');
    }

    async createActivity(activityData) {
        return this._request('/activities', 'POST', activityData);
    }

    async updateUserRole(userId, newRole) {
        return this._request(`/users/${userId}/role`, 'PATCH', { role: newRole });
    }

    async updateMyProfile(userData) {
        return this._request('/users/me', 'PATCH', userData);
    }


    // --- Booking Management ---
    async cancelBooking(bookingId) {
        return this._request(`/booking/${bookingId}/cancel`, 'PATCH');
    }

    async updateBookingStatus(bookingId, status) {
        return this._request(`/booking/${bookingId}/status`, 'PATCH', { status });
    }

    // --- Activity Management (Admin) ---
    async updateActivity(activityId, data) {
        return this._request(`/activities/${activityId}`, 'PUT', data);
    }

    async deleteActivity(activityId) {
        return this._request(`/activities/${activityId}`, 'DELETE');
    }

    // --- Incidents ---
    async getAllIncidents() {
        return this._request('/incidents/all');
    }

    async triggerSOSIncident(location = 'ไม่ระบุ') {
        return this._request('/incidents/create', 'POST', {
            type: 'sos',
            location
        });
    }
}