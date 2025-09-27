import axios from 'axios';

// Real-time simulation state
let realtimeData = null;
let lastUpdate = null;
const UPDATE_INTERVAL = 15 * 1000; // Update every 15 seconds (fast demo mode)
const FLUCTUATION_RANGE = 0.08; // 8% fluctuation range (visible but realistic changes)

// Simulate realistic hospital bed fluctuations
function simulateRealtimeFluctuations(baseData) {
  const currentTime = new Date();
  const timeOfDay = currentTime.getHours();
  
  // Different patterns based on time of day
  const getTimeMultiplier = (hour) => {
    if (hour >= 6 && hour <= 10) return 1.2; // Morning rush - more admissions
    if (hour >= 14 && hour <= 18) return 1.1; // Afternoon - moderate activity
    if (hour >= 22 || hour <= 5) return 0.8;  // Night - fewer admissions
    return 1.0; // Normal hours
  };
  
  const timeMultiplier = getTimeMultiplier(timeOfDay);
  
  return baseData.hospitals.map(hospital => {
    // Create realistic fluctuations based on hospital size and time
    const baseAvailable = hospital.baseAvailableBeds || hospital.availableBeds;
    
    // More realistic fluctuation: smaller changes, influenced by hospital size
    const hospitalSizeFactor = hospital.totalBeds > 500 ? 0.8 : 1.2; // Larger hospitals change less
    const fluctuationFactor = (Math.random() - 0.5) * FLUCTUATION_RANGE * timeMultiplier * hospitalSizeFactor;
    
    // Apply smaller, more realistic changes (1-5 beds typically)
    const bedChange = Math.floor(fluctuationFactor * baseAvailable);
    const newAvailable = Math.max(0, baseAvailable + bedChange);
    
    // Ensure we don't exceed realistic bounds
    const minAvailable = Math.floor(hospital.totalBeds * 0.05); // Min 5% available
    const maxAvailable = Math.floor(hospital.totalBeds * 0.25); // Max 25% available
    const finalAvailable = Math.min(Math.max(newAvailable, minAvailable), maxAvailable);
    
    const occupiedBeds = hospital.totalBeds - finalAvailable;
    const occupancyRate = Math.round((occupiedBeds / hospital.totalBeds) * 100);
    
    return {
      ...hospital,
      availableBeds: finalAvailable,
      occupiedBeds: occupiedBeds,
      occupancyRate: occupancyRate,
      status: finalAvailable > 50 ? 'good' : finalAvailable > 20 ? 'medium' : 'high',
      waitTime: finalAvailable > 50 ? '5-15 min' : finalAvailable > 20 ? '15-30 min' : '30+ min',
      lastUpdated: currentTime.toISOString(),
      baseAvailableBeds: finalAvailable // Update base for next fluctuation
    };
  });
}

// Initialize base data from government statistics
async function initializeBaseData() {
  try {
    console.log('Initializing real-time hospital data...');
    
    // Fetch base data from Malaysia Open Data
    const response = await axios.get('https://storage.data.gov.my/healthcare/hospital_beds.csv', {
      timeout: 15000,
      headers: {
        'User-Agent': 'HolyBed-RealTime/1.0'
      }
    });
    
    // Parse CSV
    const lines = response.data.trim().split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      return row;
    });
    
    // Get latest data
    const latestData = data
      .filter(row => row.date && row.state && row.beds)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const latestDate = latestData[0].date;
    const currentData = latestData.filter(row => row.date === latestDate);
    
    // Calculate real statistics
    let totalBeds = 0;
    const stateData = {};
    
    currentData.forEach(row => {
      const beds = parseInt(row.beds) || 0;
      const state = row.state || 'Unknown';
      totalBeds += beds;
      
      if (!stateData[state]) {
        stateData[state] = 0;
      }
      stateData[state] += beds;
    });
    
    const states = Object.keys(stateData).filter(state => state !== 'Malaysia');
    
    // Create realistic hospital data with consistent base values
    const majorHospitals = [
      { name: 'Hospital Kuala Lumpur', priority: 'high', baseCapacity: 1200 },
      { name: 'Hospital Selayang', priority: 'high', baseCapacity: 800 },
      { name: 'Hospital Sungai Buloh', priority: 'high', baseCapacity: 900 },
      { name: 'Hospital Sultanah Aminah', priority: 'medium', baseCapacity: 700 },
      { name: 'Hospital Pulau Pinang', priority: 'high', baseCapacity: 850 },
      { name: 'Hospital Raja Permaisuri Bainun', priority: 'medium', baseCapacity: 600 },
      { name: 'Hospital Tengku Ampuan Afzan', priority: 'medium', baseCapacity: 500 },
      { name: 'Hospital Umum Sarawak', priority: 'high', baseCapacity: 950 },
      { name: 'Hospital Queen Elizabeth', priority: 'high', baseCapacity: 800 },
      { name: 'Hospital Sultanah Nur Zahirah', priority: 'medium', baseCapacity: 450 },
      { name: 'Hospital Tuanku Jaafar', priority: 'medium', baseCapacity: 550 },
      { name: 'Hospital Melaka', priority: 'medium', baseCapacity: 400 },
      { name: 'Hospital Tengku Ampuan Rahimah', priority: 'high', baseCapacity: 750 },
      { name: 'Hospital Bentong', priority: 'low', baseCapacity: 300 },
      { name: 'Hospital Taiping', priority: 'medium', baseCapacity: 350 }
    ];
    
    const hospitals = majorHospitals.map((hospitalInfo, index) => {
      const state = states[index % states.length] || 'Kuala Lumpur';
      const totalBeds = hospitalInfo.baseCapacity;
      
      // Base availability depends on hospital priority and realistic patterns
      let baseAvailabilityRate;
      switch (hospitalInfo.priority) {
        case 'high': baseAvailabilityRate = 0.12; break; // 12% for major hospitals
        case 'medium': baseAvailabilityRate = 0.18; break; // 18% for regional hospitals  
        case 'low': baseAvailabilityRate = 0.25; break; // 25% for smaller hospitals
        default: baseAvailabilityRate = 0.15;
      }
      
      const baseAvailableBeds = Math.floor(totalBeds * baseAvailabilityRate);
      const occupiedBeds = totalBeds - baseAvailableBeds;
      const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);
      
      return {
        id: `hospital_${index + 1}`,
        name: hospitalInfo.name,
        state: state,
        priority: hospitalInfo.priority,
        totalBeds: totalBeds,
        availableBeds: baseAvailableBeds,
        baseAvailableBeds: baseAvailableBeds,
        occupiedBeds: occupiedBeds,
        occupancyRate: occupancyRate,
        status: baseAvailableBeds > 50 ? 'good' : baseAvailableBeds > 20 ? 'medium' : 'high',
        waitTime: baseAvailableBeds > 50 ? '5-15 min' : baseAvailableBeds > 20 ? '15-30 min' : '30+ min',
        lastUpdated: new Date().toISOString(),
        departments: ['Emergency', 'General Medicine', 'Surgery', 'ICU'],
        coordinates: {
          lat: 3.1390 + (Math.random() - 0.5) * 2,
          lng: 101.6869 + (Math.random() - 0.5) * 4
        }
      };
    });
    
    const stats = {
      totalHospitals: hospitals.length,
      totalBeds: hospitals.reduce((sum, h) => sum + h.totalBeds, 0),
      availableBeds: hospitals.reduce((sum, h) => sum + h.availableBeds, 0),
      occupancyRate: Math.round(
        (hospitals.reduce((sum, h) => sum + h.occupiedBeds, 0) / 
         hospitals.reduce((sum, h) => sum + h.totalBeds, 0)) * 100
      )
    };
    
    return {
      hospitals: hospitals.sort((a, b) => b.availableBeds - a.availableBeds),
      stats: stats,
      lastUpdated: new Date().toISOString(),
      dataSource: 'realtime_simulation',
      baseDataDate: latestDate,
      updateInterval: UPDATE_INTERVAL / 1000 / 60 // minutes
    };
    
  } catch (error) {
    console.error('Error initializing real-time data:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    
    // Initialize base data if not exists
    if (!realtimeData) {
      console.log('Initializing real-time hospital data system...');
      realtimeData = await initializeBaseData();
      lastUpdate = now;
    }
    
    // Check if we need to update the real-time fluctuations
    const timeSinceLastUpdate = now - (lastUpdate || 0);
    console.log(`Time since last update: ${timeSinceLastUpdate}ms, Update interval: ${UPDATE_INTERVAL}ms`);
    
    // Force update if requested via query parameter
    const forceUpdate = req.query.force === 'true';
    
    if (!lastUpdate || timeSinceLastUpdate >= UPDATE_INTERVAL || forceUpdate) {
      console.log('🔄 Updating real-time hospital fluctuations...');
      
      // Apply real-time fluctuations to the data
      const updatedHospitals = simulateRealtimeFluctuations(realtimeData);
      
      const newAvailableBeds = updatedHospitals.reduce((sum, h) => sum + h.availableBeds, 0);
      const oldAvailableBeds = realtimeData.stats.availableBeds;
      
      console.log(`📊 Beds changed: ${oldAvailableBeds} → ${newAvailableBeds} (${newAvailableBeds - oldAvailableBeds})`);
      
      realtimeData = {
        ...realtimeData,
        hospitals: updatedHospitals,
        stats: {
          ...realtimeData.stats,
          availableBeds: newAvailableBeds,
          occupancyRate: Math.round(
            (updatedHospitals.reduce((sum, h) => sum + h.occupiedBeds, 0) / 
             updatedHospitals.reduce((sum, h) => sum + h.totalBeds, 0)) * 100
          )
        },
        lastUpdated: new Date().toISOString()
      };
      
      lastUpdate = now;
      console.log('✅ Real-time data updated successfully');
    } else {
      console.log(`⏳ No update needed. Next update in ${Math.round((UPDATE_INTERVAL - timeSinceLastUpdate) / 1000)}s`);
    }
    
    // Add real-time metadata
    const responseData = {
      ...realtimeData,
      realtime: true,
      nextUpdate: new Date(lastUpdate + UPDATE_INTERVAL).toISOString(),
      secondsToNextUpdate: Math.round((UPDATE_INTERVAL - (now - lastUpdate)) / 1000),
      currentTime: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: responseData,
      cached: false,
      realtime: true,
      updateFrequency: '15 seconds'
    });

  } catch (error) {
    console.error('Error in real-time hospital data:', error);
    
    // Fallback to static data
    res.status(200).json({
      success: true,
      data: {
        hospitals: [
          {
            id: 'fallback_1',
            name: 'Hospital Kuala Lumpur',
            state: 'Kuala Lumpur',
            totalBeds: 1200,
            availableBeds: Math.floor(Math.random() * 100) + 20,
            occupancyRate: 85 + Math.floor(Math.random() * 10),
            status: 'medium',
            waitTime: '15-25 min',
            lastUpdated: new Date().toISOString()
          }
        ],
        stats: {
          totalHospitals: 1,
          totalBeds: 1200,
          availableBeds: 50,
          occupancyRate: 88
        },
        lastUpdated: new Date().toISOString()
      },
      cached: false,
      realtime: false,
      fallback: true,
      error: error.message
    });
  }
}
