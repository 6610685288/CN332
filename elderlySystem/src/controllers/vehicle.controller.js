const Vehicle = require('../models/vehicle.model');

// Seed vehicles if not exists
const seedVehicles = async () => {
    const count = await Vehicle.count();
    if (count === 0) {
        await Vehicle.bulkCreate([
            { name: 'รถกอล์ฟ 01', type: 'Golf Cart', icon: '🛺', capacity: 4 },
            { name: 'รถกอล์ฟ 02', type: 'Golf Cart', icon: '🛺', capacity: 4 },
            { name: 'รถตู้ 01', type: 'Van', icon: '🚐', capacity: 8 }
        ]);
        console.log('Seed vehicles created');
    }
};

exports.getAllVehicles = async (req, res) => {
    try {
        await seedVehicles(); // Ensure we have some data
        const vehicles = await Vehicle.findAll();
        res.json(vehicles);
    } catch (error) {
        console.error('GET VEHICLES ERROR:', error);
        res.status(500).json({ message: 'Error fetching vehicles' });
    }
};

// Admin: Update vehicle status
exports.updateVehicleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const vehicle = await Vehicle.findByPk(id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

        vehicle.status = status;
        await vehicle.save();
        
        res.json({ message: 'Vehicle status updated', vehicle });
    } catch (error) {
         console.error('UPDATE VEHICLES STATUS ERROR:', error);
         res.status(500).json({ message: 'Error updating vehicle status' });
    }
};
