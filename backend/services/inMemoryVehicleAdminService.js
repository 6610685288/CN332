/**
 * Core "component" for admin vehicle CRUD — mutates the shared vehicles array by reference.
 */

class InMemoryVehicleAdminService {
  constructor(vehiclesArray) {
    this._vehicles = vehiclesArray;
  }

  list() {
    return this._vehicles;
  }

  create(body) {
    const newVehicle = {
      id: Date.now(),
      type: body.type || "รถกอล์ฟ",
      name: body.name,
      status: body.status || "available",
      icon: body.icon || "🚗",
    };
    this._vehicles.push(newVehicle);
    return { ok: true, vehicle: newVehicle };
  }

  update(id, body) {
    const vehicleIndex = this._vehicles.findIndex((v) => v.id === id);
    if (vehicleIndex === -1) {
      return { ok: false, status: 404, error: "ไม่พบยานพาหนะ" };
    }
    const { type, name, status, icon } = body;
    const cur = this._vehicles[vehicleIndex];
    this._vehicles[vehicleIndex] = {
      ...cur,
      ...(type !== undefined && { type }),
      ...(name !== undefined && { name }),
      ...(status !== undefined && { status }),
      ...(icon !== undefined && { icon }),
    };
    return { ok: true, vehicle: this._vehicles[vehicleIndex] };
  }

  remove(id) {
    const idx = this._vehicles.findIndex((v) => v.id === id);
    if (idx === -1) {
      return { ok: false, status: 404, error: "ไม่พบยานพาหนะ" };
    }
    this._vehicles.splice(idx, 1);
    return { ok: true };
  }
}

module.exports = { InMemoryVehicleAdminService };
