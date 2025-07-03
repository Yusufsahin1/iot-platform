import SockJS from 'sockjs-client';
import webstomp from 'webstomp-client';
import Chart from 'chart.js/auto';

// Constants
const BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost' 
    : window.location.origin;
const WS_ENDPOINT = `${BACKEND_URL}/ws`;
const API_URL = `${BACKEND_URL}/api/v1`;

// Locale options for date formatting
const dateOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Istanbul'
};

// Time-only options for graphs
const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Istanbul'
};

// Global variables
let stompClient = null;
let devicesList = new Set();
let selectedDevice = 'all';
let activeAlerts = 0;
let charts = {};
let sensorDataHistory = {
    temperature: [],
    humidity: [],
    pressure: [],
    battery: []
};
let allSensorData = [];
let realtimeAlertMessages = [];
let historicalAlertMessages = [];
let isRealtimeView = true;
let historicalData = [];

// DOM Elements
const connectionIndicator = document.getElementById('connection-indicator');
const connectionText = document.getElementById('connection-text');
const deviceFilter = document.getElementById('device-filter');
const totalDevicesElement = document.getElementById('total-devices');
const activeAlertsElement = document.getElementById('active-alerts');
const lastUpdateElement = document.getElementById('last-update');
const alertsContainer = document.getElementById('alerts-container');
const realtimeBtn = document.getElementById('realtime-btn');
const historicalBtn = document.getElementById('historical-btn');
const dateFilterContainer = document.getElementById('date-filter');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const applyFilterBtn = document.getElementById('apply-filter');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    connectWebSocket();
    fetchInitialData();
    setupEventListeners();

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    startDateInput.valueAsDate = lastWeek;
    endDateInput.valueAsDate = today;
});

function setupEventListeners() {
    deviceFilter.addEventListener('change', (e) => {
        selectedDevice = e.target.value;
        if (isRealtimeView) {
            updateChartsForSelectedDevice();
        } else {
            fetchHistoricalData();
        }
    });
    
    realtimeBtn.addEventListener('click', () => {
        if (!isRealtimeView) {
            toggleView(true);
        }
    });
    
    historicalBtn.addEventListener('click', () => {
        if (isRealtimeView) {
            toggleView(false);
        }
    });
    
    applyFilterBtn.addEventListener('click', () => {
        if (!isRealtimeView) {
            fetchHistoricalData();
        }
    });
}

// Toggle between realtime and historical view
function toggleView(realtime) {
    // If already in the requested view, do nothing
    if (isRealtimeView === realtime) {
        return;
    }

    updateLoadingState(true);

    setTimeout(() => {
        isRealtimeView = realtime;
        
        if (realtime) {
            realtimeBtn.classList.add('active');
            historicalBtn.classList.remove('active');
            dateFilterContainer.style.display = 'none';
            document.body.classList.remove('historical-view');
            document.getElementById('info-container').style.display = 'none';
            // Restore real-time alerts
            updateAlertsForSelectedDevice();
        } else {
            historicalBtn.classList.add('active');
            realtimeBtn.classList.remove('active');
            dateFilterContainer.style.display = 'block';
            dateFilterContainer.classList.add('visible');
            document.body.classList.add('historical-view');
            document.getElementById('info-container').style.display = 'block';
            fetchHistoricalData();
        }
    }, 10);
}

function extractDeviceIdFromMessage(message) {
    const deviceIdMatch = message.match(/device '([^']+)'/);
    return deviceIdMatch ? deviceIdMatch[1] : null;
}

function initCharts() {
    // Temperature chart
    charts.temperature = new Chart(
        document.getElementById('temperature-chart'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperature',
                    data: [],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: '°C'
                        }
                    },
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );
    
    // Humidity chart
    charts.humidity = new Chart(
        document.getElementById('humidity-chart'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Humidity',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '%'
                        }
                    },
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );
    
    // Pressure chart
    charts.pressure = new Chart(
        document.getElementById('pressure-chart'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Pressure',
                    data: [],
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'hPa'
                        }
                    },
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );
    
    // Battery chart
    charts.battery = new Chart(
        document.getElementById('battery-chart'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Battery',
                    data: [],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '%'
                        }
                    },
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );
}

function connectWebSocket() {
    const socket = new SockJS(WS_ENDPOINT);
    stompClient = webstomp.over(socket);
    
    stompClient.connect({}, frame => {
        console.log('Connected to WebSocket:', frame);
        updateConnectionStatus(true);
        
        // Subscribe to sensor data topic
        stompClient.subscribe('/topic/sensor-data', message => {
            const sensorData = JSON.parse(message.body);
            if (isRealtimeView) {
                processSensorData(sensorData);
            }
        });
        
        // Subscribe to alert topic
        stompClient.subscribe('/topic/alert', message => {
            const alertData = JSON.parse(message.body);
            processAlertData(alertData);
        });
    }, error => {
        console.error('WebSocket connection error:', error);
        updateConnectionStatus(false);
        
        // Retry after 5 seconds
        setTimeout(connectWebSocket, 5000);
    });
}

function updateConnectionStatus(connected) {
    connectionIndicator.className = connected ? 'connected' : 'disconnected';
    connectionText.textContent = connected ? 'Connected' : 'Disconnected';
}

// Fetch initial data
async function fetchInitialData() {
    try {
        if (!isRealtimeView) {
            // Fetch sensor data only in historical view
            const sensorResponse = await fetch(`${API_URL}/sensor-data`);
            if (!sensorResponse.ok) {
                throw new Error(`HTTP error! Status: ${sensorResponse.status}`);
            }
            
            const sensorData = await sensorResponse.json();
            allSensorData = sensorData;
            processInitialData(sensorData);
            
            // Fetch initial alerts
            try {
                const alertsResponse = await fetch(`${API_URL}/alert-messages`);
                if (alertsResponse.ok) {
                    const alertsData = await alertsResponse.json();
                    
                    // Process each alert
                    alertsData.forEach(alert => {
                        // Extract and add deviceId
                        alert.deviceId = extractDeviceIdFromMessage(alert.message);
                        historicalAlertMessages.push(alert); // Store in historicalAlertMessages
                    });
                    
                    // Update alerts UI
                    updateAlertsForSelectedDevice();
                }
            } catch (alertError) {
                console.log('Alert endpoint might not exist or other error:', alertError);
            }
        } else {
            allSensorData = [];
            realtimeAlertMessages = [];
            processInitialData([]);
        }
    } catch (error) {
        console.error('Error fetching initial data:', error);
    }
}

async function fetchHistoricalData() {
    try {
        updateLoadingState(true);
        
        // Sensor data URL
        let url = `${API_URL}/sensor-data`;
        if (selectedDevice !== 'all') {
            url = `${API_URL}/sensor-data/device/${selectedDevice}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        let data = await response.json();

        if (startDateInput.value && endDateInput.value) {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            endDate.setHours(23, 59, 59, 999); // Set to end of day
            
            data = data.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        setTimeout(() => {
            processHistoricalData(data);

            fetchHistoricalAlerts();
        }, 10);
        
    } catch (error) {
        console.error('Error fetching historical data:', error);
        updateLoadingState(false);
    }
}

async function fetchHistoricalAlerts() {
    try {
        // Alerts URL
        let alertsUrl = `${API_URL}/alert-messages`;
        if (selectedDevice !== 'all') {
            alertsUrl = `${API_URL}/alert-messages/device/${selectedDevice}`;
        }
        
        const alertsResponse = await fetch(alertsUrl);
        if (alertsResponse.ok) {
            let alertsData = await alertsResponse.json();
            
            // Filter alerts by date
            if (startDateInput.value && endDateInput.value) {
                const startDate = new Date(startDateInput.value);
                const endDate = new Date(endDateInput.value);
                endDate.setHours(23, 59, 59, 999);
                
                alertsData = alertsData.filter(alert => {
                    const alertDate = new Date(alert.timestamp);
                    return alertDate >= startDate && alertDate <= endDate;
                });
            }

            historicalAlertMessages = [];

            alertsData.forEach(alert => {
                alert.deviceId = extractDeviceIdFromMessage(alert.message);
                historicalAlertMessages.push(alert);
            });

            updateAlertsForSelectedDevice();
        }
    } catch (alertError) {
        console.error('Error fetching alert data:', alertError);
    } finally {
        updateLoadingState(false);
    }
}

function updateLoadingState(isLoading) {
    applyFilterBtn.disabled = isLoading;
    applyFilterBtn.textContent = isLoading ? 'Loading...' : 'Apply Filter';
}

function processHistoricalData(data) {
    sensorDataHistory = {
        temperature: [],
        humidity: [],
        pressure: [],
        battery: []
    };
    
    // Sort data by timestamp
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Show data count information
    const dataCountInfo = document.createElement('div');
    dataCountInfo.className = 'data-count-info';
    dataCountInfo.textContent = `${data.length} records found. Date range: ${startDateInput.value} - ${endDateInput.value}${selectedDevice !== 'all' ? `, Device: ${selectedDevice}` : ', All Devices'}`;
    
    // Add info message to the page
    const infoContainer = document.getElementById('info-container');
    if (infoContainer) {
        infoContainer.innerHTML = '';
        infoContainer.appendChild(dataCountInfo);
    }
    
    // Limit data points to prevent overcrowding and improve performance
    const maxDataPoints = 20; // Reduced from 30 to 20 for better performance
    let step = 1;
    
    if (data.length > maxDataPoints) {
        step = Math.ceil(data.length / maxDataPoints);
        
        // Add sampling info if data is sampled
        if (infoContainer && step > 1) {
            const samplingInfo = document.createElement('div');
            samplingInfo.className = 'sampling-info';
            samplingInfo.textContent = `Showing every ${step} records for better readability.`;
            infoContainer.appendChild(samplingInfo);
        }
    }

    const processedData = {
        temperature: [],
        humidity: [],
        pressure: [],
        battery: []
    };
    
    // Process data
    for (let i = 0; i < data.length; i += step) {
        const sensorData = data[i];
        const timestamp = new Date(sensorData.timestamp);
        
        // Format timestamp
        const timeLabel = timestamp.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
        
        if (sensorData.temperature !== undefined) {
            processedData.temperature.push({
                x: timeLabel,
                y: sensorData.temperature,
                timestamp: timestamp
            });
        }
        
        if (sensorData.humidity !== undefined) {
            processedData.humidity.push({
                x: timeLabel,
                y: sensorData.humidity,
                timestamp: timestamp
            });
        }
        
        if (sensorData.pressure !== undefined) {
            processedData.pressure.push({
                x: timeLabel,
                y: sensorData.pressure,
                timestamp: timestamp
            });
        }
        
        if (sensorData.batteryLevel !== undefined) {
            processedData.battery.push({
                x: timeLabel,
                y: sensorData.batteryLevel,
                timestamp: timestamp
            });
        }
    }

    sensorDataHistory = processedData;

    setTimeout(() => {
        updateAllCharts();
        updateCurrentValues();

        if (data.length > 0) {
            const lastDataPoint = data[data.length - 1];
            const lastTimestamp = new Date(lastDataPoint.timestamp);
            lastUpdateElement.textContent = lastTimestamp.toLocaleString('tr-TR', dateOptions);
        }
    }, 10);
}

function updateChartsForSelectedDevice() {
    sensorDataHistory = {
        temperature: [],
        humidity: [],
        pressure: [],
        battery: []
    };

    const filteredData = selectedDevice === 'all' 
        ? allSensorData 
        : allSensorData.filter(item => item.deviceId === selectedDevice);

    filteredData.forEach(sensorData => {
        processSensorData(sensorData, false);
    });

    updateAlertsForSelectedDevice();
    
    // Update UI
    updateAllCharts();
    updateCurrentValues();
}

// Update alerts based on selected device
function updateAlertsForSelectedDevice() {
    // Clear all existing alerts from UI
    while (alertsContainer.firstChild) {
        alertsContainer.removeChild(alertsContainer.firstChild);
    }
    
    // Reset active alerts counter
    activeAlerts = 0;
    
    // Seç hangi alert listesini kullanacağımızı
    const currentAlertMessages = isRealtimeView ? realtimeAlertMessages : historicalAlertMessages;
    
    // Ensure all alert messages have deviceId property
    currentAlertMessages.forEach(alert => {
        if (!alert.deviceId) {
            alert.deviceId = extractDeviceIdFromMessage(alert.message);
        }
    });
    
    // Filter alerts for selected device
    const filteredAlerts = selectedDevice === 'all' 
        ? currentAlertMessages 
        : currentAlertMessages.filter(alert => alert.deviceId === selectedDevice);
    
    // Sort alerts by timestamp in descending order (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    filteredAlerts.forEach(alertData => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alertData.severity.toLowerCase()}`;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'alert-message';
        messageElement.textContent = alertData.message;
        
        const timeElement = document.createElement('div');
        timeElement.className = 'alert-time';
        const timestamp = alertData.timestamp ? new Date(alertData.timestamp) : new Date();
        timeElement.textContent = timestamp.toLocaleString('tr-TR', dateOptions);
        
        alertElement.appendChild(messageElement);
        alertElement.appendChild(timeElement);
        
        alertsContainer.appendChild(alertElement);
        activeAlerts++;
    });
    
    activeAlertsElement.textContent = activeAlerts;
    
    // Limit to 10 alerts in UI but keep all in memory
    while (alertsContainer.children.length > 10) {
        alertsContainer.removeChild(alertsContainer.lastChild);
    }
}

// Process initial data
function processInitialData(data) {
    // Clear existing data
    sensorDataHistory = {
        temperature: [],
        humidity: [],
        pressure: [],
        battery: []
    };
    
    // Update device list
    devicesList.clear();
    
    // Process each data point
    data.forEach(sensorData => {
        // Add to device list
        if (sensorData.deviceId) {
            devicesList.add(sensorData.deviceId);
        }
        
        // Only process data for the selected device or all devices
        if (selectedDevice === 'all' || sensorData.deviceId === selectedDevice) {
            processSensorData(sensorData, false);
        }
    });
    
    // Update UI
    updateDevicesList();
    updateAllCharts();
    updateCurrentValues();
    
    // Update statistics
    totalDevicesElement.textContent = devicesList.size;
}

// Process incoming sensor data
function processSensorData(sensorData, updateCharts = true) {
    // Skip if not matching selected device
    if (selectedDevice !== 'all' && sensorData.deviceId !== selectedDevice) {
        return;
    }
    
    // Add to all sensor data if it's new
    if (!allSensorData.some(data => 
        data.deviceId === sensorData.deviceId && 
        data.timestamp === sensorData.timestamp)) {
        allSensorData.push(sensorData);
    }
    
    // Add device to list if new
    if (sensorData.deviceId && !devicesList.has(sensorData.deviceId)) {
        devicesList.add(sensorData.deviceId);
        updateDevicesList();
        totalDevicesElement.textContent = devicesList.size;
    }
    
    // Format timestamp using backend timestamp
    const timestamp = new Date(sensorData.timestamp);
    const timeLabel = timestamp.toLocaleTimeString('tr-TR', timeOptions);

    // For "all" devices, calculate average values for the same timestamp
    if (selectedDevice === 'all') {
        // Find all sensor data with the same timestamp
        const sameTimeData = allSensorData.filter(data => 
            new Date(data.timestamp).getTime() === timestamp.getTime()
        );

        if (sameTimeData.length > 0) {
            // Calculate averages
            const avgTemp = sameTimeData.reduce((sum, data) => sum + (data.temperature || 0), 0) / sameTimeData.length;
            const avgHumidity = sameTimeData.reduce((sum, data) => sum + (data.humidity || 0), 0) / sameTimeData.length;
            const avgPressure = sameTimeData.reduce((sum, data) => sum + (data.pressure || 0), 0) / sameTimeData.length;
            const avgBattery = sameTimeData.reduce((sum, data) => sum + (data.batteryLevel || 0), 0) / sameTimeData.length;

            // Update history with averages
            if (!isNaN(avgTemp)) {
                const existingTempIndex = sensorDataHistory.temperature.findIndex(item => item.x === timeLabel);
                if (existingTempIndex === -1) {
                    sensorDataHistory.temperature.push({ x: timeLabel, y: avgTemp, timestamp });
                } else {
                    sensorDataHistory.temperature[existingTempIndex].y = avgTemp;
                }
            }

            if (!isNaN(avgHumidity)) {
                const existingHumIndex = sensorDataHistory.humidity.findIndex(item => item.x === timeLabel);
                if (existingHumIndex === -1) {
                    sensorDataHistory.humidity.push({ x: timeLabel, y: avgHumidity, timestamp });
                } else {
                    sensorDataHistory.humidity[existingHumIndex].y = avgHumidity;
                }
            }

            if (!isNaN(avgPressure)) {
                const existingPressIndex = sensorDataHistory.pressure.findIndex(item => item.x === timeLabel);
                if (existingPressIndex === -1) {
                    sensorDataHistory.pressure.push({ x: timeLabel, y: avgPressure, timestamp });
                } else {
                    sensorDataHistory.pressure[existingPressIndex].y = avgPressure;
                }
            }

            if (!isNaN(avgBattery)) {
                const existingBattIndex = sensorDataHistory.battery.findIndex(item => item.x === timeLabel);
                if (existingBattIndex === -1) {
                    sensorDataHistory.battery.push({ x: timeLabel, y: avgBattery, timestamp });
                } else {
                    sensorDataHistory.battery[existingBattIndex].y = avgBattery;
                }
            }
        }
    } else {
        // Single device - process data as before
        if (sensorData.temperature !== undefined) {
            sensorDataHistory.temperature.push({
                x: timeLabel,
                y: sensorData.temperature,
                timestamp: timestamp
            });
        }
        
        if (sensorData.humidity !== undefined) {
            sensorDataHistory.humidity.push({
                x: timeLabel,
                y: sensorData.humidity,
                timestamp: timestamp
            });
        }
        
        if (sensorData.pressure !== undefined) {
            sensorDataHistory.pressure.push({
                x: timeLabel,
                y: sensorData.pressure,
                timestamp: timestamp
            });
        }
        
        if (sensorData.batteryLevel !== undefined) {
            sensorDataHistory.battery.push({
                x: timeLabel,
                y: sensorData.batteryLevel,
                timestamp: timestamp
            });
        }
    }

    // Limit history size for all metrics
    const maxPoints = 20;
    ['temperature', 'humidity', 'pressure', 'battery'].forEach(metric => {
        if (sensorDataHistory[metric].length > maxPoints) {
            sensorDataHistory[metric] = sensorDataHistory[metric].slice(-maxPoints);
        }
    });
    
    // Update charts if needed
    if (updateCharts) {
        updateAllCharts();
        updateCurrentValues();
        
        // Update last update time
        lastUpdateElement.textContent = timeLabel;
    }
}

// Update all charts
function updateAllCharts() {
    // Configure chart options based on view mode
    const xAxisOptions = isRealtimeView ? {
        display: true,
        title: {
            display: true,
            text: 'Time'
        }
    } : {
        display: true,
        title: {
            display: true,
            text: 'Date/Time'
        },
        ticks: {
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 10 // Reduced from 15 to 10 for better performance
        }
    };
    
    // Update chart scales
    Object.values(charts).forEach(chart => {
        chart.options.scales.x = xAxisOptions;
        chart.options.plugins.tooltip = {
            callbacks: {
                title: function(context) {
                    return context[0].label;
                }
            }
        };
        
        // Set animation duration based on view mode
        chart.options.animation = {
            duration: isRealtimeView ? 800 : 0 // Disable animations in historical view
        };
    });
    
    // Batch update all charts to improve performance
    requestAnimationFrame(() => {
        // Update temperature chart
        charts.temperature.data.labels = sensorDataHistory.temperature.map(d => d.x);
        charts.temperature.data.datasets[0].data = sensorDataHistory.temperature.map(d => d.y);
        charts.temperature.update('none'); // Use 'none' mode for better performance
        
        // Update humidity chart
        charts.humidity.data.labels = sensorDataHistory.humidity.map(d => d.x);
        charts.humidity.data.datasets[0].data = sensorDataHistory.humidity.map(d => d.y);
        charts.humidity.update('none');
        
        // Update pressure chart
        charts.pressure.data.labels = sensorDataHistory.pressure.map(d => d.x);
        charts.pressure.data.datasets[0].data = sensorDataHistory.pressure.map(d => d.y);
        charts.pressure.update('none');
        
        // Update battery chart
        charts.battery.data.labels = sensorDataHistory.battery.map(d => d.x);
        charts.battery.data.datasets[0].data = sensorDataHistory.battery.map(d => d.y);
        charts.battery.update('none');
    });
}

// Update device list in filter dropdown
function updateDevicesList() {
    // Save current selection
    const currentSelection = deviceFilter.value;
    
    // Clear existing options except 'all'
    while (deviceFilter.options.length > 1) {
        deviceFilter.remove(1);
    }
    
    // Add device options
    devicesList.forEach(deviceId => {
        const option = document.createElement('option');
        option.value = deviceId;
        option.textContent = `Device ${deviceId}`;
        deviceFilter.appendChild(option);
    });
    
    // Restore selection if possible
    if (Array.from(deviceFilter.options).some(opt => opt.value === currentSelection)) {
        deviceFilter.value = currentSelection;
    }
}

// Update current values display
function updateCurrentValues() {
    const temperatureElement = document.getElementById('current-temperature');
    const humidityElement = document.getElementById('current-humidity');
    const pressureElement = document.getElementById('current-pressure');
    const batteryElement = document.getElementById('current-battery');
    
    // Get latest values
    const latestTemperature = sensorDataHistory.temperature.length > 0 
        ? sensorDataHistory.temperature[sensorDataHistory.temperature.length - 1].y 
        : null;
    
    const latestHumidity = sensorDataHistory.humidity.length > 0 
        ? sensorDataHistory.humidity[sensorDataHistory.humidity.length - 1].y 
        : null;
    
    const latestPressure = sensorDataHistory.pressure.length > 0 
        ? sensorDataHistory.pressure[sensorDataHistory.pressure.length - 1].y 
        : null;
    
    const latestBattery = sensorDataHistory.battery.length > 0 
        ? sensorDataHistory.battery[sensorDataHistory.battery.length - 1].y 
        : null;
    
    // Update display
    temperatureElement.textContent = latestTemperature !== null ? latestTemperature.toFixed(1) : '--';
    humidityElement.textContent = latestHumidity !== null ? latestHumidity.toFixed(1) : '--';
    pressureElement.textContent = latestPressure !== null ? latestPressure.toFixed(1) : '--';
    batteryElement.textContent = latestBattery !== null ? latestBattery.toFixed(1) : '--';
}

// Process alert data
function processAlertData(alertData) {
    // If in historical view, ignore real-time alerts
    if (!isRealtimeView) {
        return;
    }

    // Extract deviceId from the alert message
    const deviceId = extractDeviceIdFromMessage(alertData.message);
    if (deviceId) {
        alertData.deviceId = deviceId;
    }

    // Add the new alert to the beginning of the real-time array
    realtimeAlertMessages.unshift(alertData);

    // Skip if not matching selected device
    if (selectedDevice !== 'all' && deviceId !== selectedDevice) {
        return;
    }

    updateAlertsForSelectedDevice();
}