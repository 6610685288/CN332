class APIFacade {
    constructor(baseUrl) {
        this.baseUrl = String(baseUrl || "").replace(/\/$/, "");
    }

    _url(endpoint) {
        const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        return `${this.baseUrl}${path}`;
    }

    async _request(endpoint, method = "GET", body = null) {
        const options = {
            method,
            headers: { "Content-Type": "application/json" },
        };
        if (body != null && method !== "GET" && method !== "HEAD") {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(this._url(endpoint), options);
        const text = await res.text();
        let data = null;
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
        }
        if (!res.ok) {
            const msg =
                typeof data === "object" && data && data.error
                    ? data.error
                    : `HTTP ${res.status}`;
            const err = new Error(msg);
            err.status = res.status;
            throw err;
        }
        return data;
    }

    async getVehicles() {
        return this._request("/vehicles");
    }

    async bookVehicle(data) {
        return this._request("/book-vehicle", "POST", {
            destination: data.destination,
            time: data.scheduledTime ?? data.time,
            userId: data.userId || data.elderlyId,
            passengers: data.passengers,
            wheelchair: data.wheelchair,
            helper: data.helper,
        });
    }

    async getActivities(userId) {
        return this._request(
            `/activities?userId=${encodeURIComponent(userId)}`
        );
    }

    async joinActivity(activityId, userId) {
        return this._request("/join-activity", "POST", {
            activityId,
            userId,
        });
    }

    async leaveActivity(activityId, userId) {
        return this._request("/leave-activity", "POST", {
            activityId,
            userId,
        });
    }

    async getMySchedule(userId) {
        const items = await this._request(
            `/my-bookings?userId=${encodeURIComponent(userId)}`
        );
        if (!Array.isArray(items)) return [];
        return items.map((b) => ({
            type: b.type,
            title: b.title,
            detail: b.detail,
            timestamp: b.timestamp,
            status: b.type === "vehicle" ? "pending" : "joined",
        }));
    }

    async adminGetVehicles() {
        return this._request("/admin/vehicles");
    }

    async adminAddVehicle(formValues) {
        return this._request("/admin/vehicles", "POST", {
            name: formValues.name,
            icon: formValues.icon,
            type: formValues.type || "รถกอล์ฟ",
        });
    }

    async adminUpdateVehicleStatus(id, newStatus) {
        return this._request(`/admin/vehicles/${id}`, "PUT", {
            status: newStatus,
        });
    }

    async adminDeleteVehicle(id) {
        return this._request(`/admin/vehicles/${id}`, "DELETE");
    }

    async adminGetActivities() {
        return this._request("/admin/activities");
    }

    async adminAddActivity(formValues) {
        return this._request("/admin/activities", "POST", formValues);
    }

    async adminDeleteActivity(id) {
        return this._request(`/admin/activities/${id}`, "DELETE");
    }
}
