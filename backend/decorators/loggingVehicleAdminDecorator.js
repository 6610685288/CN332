/**
 * Decorator pattern (GoF-style): same interface as InMemoryVehicleAdminService,
 * forwards to inner and adds logging without changing core logic.
 */

class LoggingVehicleAdminDecorator {
  constructor(inner, log = (...args) => console.log("[VehicleAdmin]", ...args)) {
    this.inner = inner;
    this.log = log;
  }

  list() {
    this.log("list()");
    return this.inner.list();
  }

  create(body) {
    this.log("create()", body?.name);
    return this.inner.create(body);
  }

  update(id, body) {
    this.log("update()", id, body?.status ?? "");
    return this.inner.update(id, body);
  }

  remove(id) {
    this.log("remove()", id);
    return this.inner.remove(id);
  }
}

module.exports = { LoggingVehicleAdminDecorator };
