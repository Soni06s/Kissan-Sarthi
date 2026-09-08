import sensorRepository from '../repositories/sensor.repository.js';
import alertRepository from '../repositories/alert.repository.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { emitSensorUpdate, emitAlert } from '../sockets/index.js';

let simulatorInterval = null;

export const startSensorSimulator = (io) => {
  if (simulatorInterval) return;

  logger.info('Starting IoT Sensor Telemetry Simulator (interval: 30s)...');

  simulatorInterval = setInterval(async () => {
    try {
      // Find active farmers to simulate sensor readings for
      const farmers = await User.find({ role: 'farmer' }).select('_id name location').limit(10);
      if (!farmers || farmers.length === 0) return;

      for (const farmer of farmers) {
        const nodeId = `NODE-${farmer._id.toString().slice(-4).toUpperCase()}`;

        // Get latest reading to fluctuate naturally
        const latest = await sensorRepository.findLatestByFarmer(farmer._id);

        const baseTemp = latest?.temperature ?? 26;
        const baseMoisture = latest?.soilMoisture ?? 62;
        const basePH = latest?.ph ?? 6.8;

        // Small natural random drift
        const tempDrift = (Math.random() - 0.48) * 1.5;
        const moistureDrift = (Math.random() - 0.52) * 2.0; // slight drying trend
        const phDrift = (Math.random() - 0.5) * 0.1;

        const temperature = parseFloat(Math.min(Math.max(baseTemp + tempDrift, 10), 45).toFixed(1));
        const soilMoisture = parseFloat(Math.min(Math.max(baseMoisture + moistureDrift, 15), 95).toFixed(1));
        const ph = parseFloat(Math.min(Math.max(basePH + phDrift, 5.0), 8.5).toFixed(1));
        const nitrogen = Math.round(40 + Math.random() * 30);
        const phosphorus = Math.round(25 + Math.random() * 20);
        const potassium = Math.round(30 + Math.random() * 25);
        const humidity = Math.round(50 + Math.random() * 25);

        const newSensorData = await sensorRepository.create({
          farmer: farmer._id,
          nodeId,
          temperature,
          soilMoisture,
          ph,
          nitrogen,
          phosphorus,
          potassium,
          humidity,
          timestamp: new Date(),
        });

        // Emit live socket update to client
        if (io) {
          emitSensorUpdate(io, farmer._id, newSensorData);
        }

        // Automatic Alert Threshold Checking
        let alertMessage = null;
        let alertType = 'warning';
        let alertTitle = 'Sensor Threshold Notice';

        if (soilMoisture < 35) {
          alertTitle = 'Low Soil Moisture Alert';
          alertMessage = `Field moisture dropped to ${soilMoisture}%. Irrigation recommended for Node ${nodeId}.`;
          alertType = 'warning';
        } else if (temperature > 38) {
          alertTitle = 'Extreme Heat Warning';
          alertMessage = `Temperature reached ${temperature}°C at Node ${nodeId}. Protect crops from heat stress.`;
          alertType = 'warning';
        } else if (temperature < 5) {
          alertTitle = 'Frost Risk Alert';
          alertMessage = `Cold temperature ${temperature}°C recorded. Prepare frost protection covers.`;
          alertType = 'critical';
        }

        if (alertMessage) {
          // Avoid spamming duplicate alerts within 30 minutes
          const recentAlerts = await alertRepository.findByUser(farmer._id);
          const hasRecentDuplicate = recentAlerts.some(
            (a) => a.title === alertTitle && new Date() - new Date(a.createdAt) < 30 * 60 * 1000
          );

          if (!hasRecentDuplicate) {
            const createdAlert = await alertRepository.create({
              user: farmer._id,
              type: alertType,
              title: alertTitle,
              message: alertMessage,
              severity: alertType === 'critical' ? 'critical' : 'warning',
            });

            if (io) {
              emitAlert(io, farmer._id, createdAlert);
            }
          }
        }
      }
    } catch (err) {
      logger.error(`Sensor Simulator error: ${err.message}`);
    }
  }, 30000);
};

export const stopSensorSimulator = () => {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
};
