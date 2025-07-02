// Import required libraries
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
let alertMessages = []; 

// DOM Elements
const connectionIndicator = document.getElementById('connection-indicator');
const connectionText = document.getElementById('connection-text');
const deviceFilter = document.getElementById('device-filter');
const totalDevicesElement = document.getElementById('total-devices');
const activeAlertsElement = document.getElementById('active-alerts');
const lastUpdateElement = document.getElementById('last-update');
const alertsContainer = document.getElementById('alerts-container');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    connectWebSocket();
    fetchInitialData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    deviceFilter.addEventListener('change', (e) => {
        selectedDevice = e.target.value;
        updateChartsForSelectedDevice();
    });
}

// Extract deviceId from alert message
function extractDeviceIdFromMessage(message) {
    const deviceIdMatch = message.match(/device '([^']+)'/);
    return deviceIdMatch ? deviceIdMatch[1] : null;
}

// Initialize charts
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

// Connect to WebSocket
function connectWebSocket() {
    const socket = new SockJS(WS_ENDPOINT);
    stompClient = webstomp.over(socket);
    
    stompClient.connect({}, frame => {
        console.log('Connected to WebSocket:', frame);
        updateConnectionStatus(true);
        
        // Subscribe to sensor data topic
        stompClient.subscribe('/topic/sensor-data', message => {
            const sensorData = JSON.parse(message.body);
            processSensorData(sensorData);
        });
        
        // Subscribe to alerts topic
        stompClient.subscribe('/topic/alert', message => {
            const alertData = JSON.parse(message.body);
            processAlertData(alertData);
        });
    }, error => {
        console.error('WebSocket connection error:', error);
        updateConnectionStatus(false);
        
        // Try to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
    });
}

// Update connection status indicators
function updateConnectionStatus(connected) {
    connectionIndicator.className = connected ? 'connected' : 'disconnected';
    connectionText.textContent = connected ? 'Connected' : 'Disconnected';
}

// Fetch initial data
async function fetchInitialData() {
    try {
        // Fetch sensor data
        const sensorResponse = await fetch(`${API_URL}/sensor-data`);
        if (!sensorResponse.ok) {
            throw new Error(`HTTP error! Status: ${sensorResponse.status}`);
        }
        
        const sensorData = await sensorResponse.json();
        allSensorData = sensorData; // Store all data
        processInitialData(sensorData);
        
        // Fetch alerts data if endpoint exists
        try {
            const alertsResponse = await fetch(`${API_URL}/alert-messages`);
            if (alertsResponse.ok) {
                const alertsData = await alertsResponse.json();
                
                // Process each alert
                alertsData.forEach(alert => {
                    // Extract and add deviceId
                    alert.deviceId = extractDeviceIdFromMessage(alert.message);
                    alertMessages.push(alert);
                });
                
                // Update alerts UI
                updateAlertsForSelectedDevice();
            }
        } catch (alertError) {
            console.log('Alert endpoint might not exist or other error:', alertError);
        }
    } catch (error) {
        console.error('Error fetching initial data:', error);
    }
}

// Update charts based on selected device
function updateChartsForSelectedDevice() {
    // Clear current chart data
    sensorDataHistory = {
        temperature: [],
        humidity: [],
        pressure: [],
        battery: []
    };
    
    // Filter data based on selected device
    const filteredData = selectedDevice === 'all' 
        ? allSensorData 
        : allSensorData.filter(item => item.deviceId === selectedDevice);
    
    // Process the filtered data
    filteredData.forEach(sensorData => {
        processSensorData(sensorData, false);
    });
    
    // Clear and update alerts for selected device
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
    
    // Ensure all alert messages have deviceId property
    alertMessages.forEach(alert => {
        if (!alert.deviceId) {
            alert.deviceId = extractDeviceIdFromMessage(alert.message);
        }
    });
    
    // Filter alerts for selected device
    const filteredAlerts = selectedDevice === 'all' 
        ? alertMessages 
        : alertMessages.filter(alert => alert.deviceId === selectedDevice);
    
    
    filteredAlerts.forEach(alertData => {
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alertData.severity.toLowerCase()}`;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'alert-message';
        messageElement.textContent = alertData.message;
        
        const timeElement = document.createElement('div');
        timeElement.className = 'alert-time';
        const timestamp = new Date();
        timeElement.textContent = timestamp.toLocaleTimeString('tr-TR', dateOptions);
        
        alertElement.appendChild(messageElement);
        alertElement.appendChild(timeElement);
        
        alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
        activeAlerts++;
    });
    
    activeAlertsElement.textContent = activeAlerts;
    
    // Limit to 10 alerts
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
    
    // Format timestamp - use current time instead of backend timestamp
    const timestamp = new Date();
    const timeLabel = timestamp.toLocaleTimeString('tr-TR', dateOptions);
    
    // Add data to history (limit to 20 points)
    if (sensorData.temperature !== undefined) {
        sensorDataHistory.temperature.push({
            x: timeLabel,
            y: sensorData.temperature,
            timestamp: timestamp
        });
        if (sensorDataHistory.temperature.length > 20) {
            sensorDataHistory.temperature.shift();
        }
    }
    
    if (sensorData.humidity !== undefined) {
        sensorDataHistory.humidity.push({
            x: timeLabel,
            y: sensorData.humidity,
            timestamp: timestamp
        });
        if (sensorDataHistory.humidity.length > 20) {
            sensorDataHistory.humidity.shift();
        }
    }
    
    if (sensorData.pressure !== undefined) {
        sensorDataHistory.pressure.push({
            x: timeLabel,
            y: sensorData.pressure,
            timestamp: timestamp
        });
        if (sensorDataHistory.pressure.length > 20) {
            sensorDataHistory.pressure.shift();
        }
    }
    
    if (sensorData.batteryLevel !== undefined) {
        sensorDataHistory.battery.push({
            x: timeLabel,
            y: sensorData.batteryLevel,
            timestamp: timestamp
        });
        if (sensorDataHistory.battery.length > 20) {
            sensorDataHistory.battery.shift();
        }
    }
    
    // Update last update time
    lastUpdateElement.textContent = timeLabel;
    
    // Update charts if needed
    if (updateCharts) {
        updateAllCharts();
        updateCurrentValues();
    }
}

// Update all charts
function updateAllCharts() {
    // Update temperature chart
    charts.temperature.data.labels = sensorDataHistory.temperature.map(d => d.x);
    charts.temperature.data.datasets[0].data = sensorDataHistory.temperature.map(d => d.y);
    charts.temperature.update();
    
    // Update humidity chart
    charts.humidity.data.labels = sensorDataHistory.humidity.map(d => d.x);
    charts.humidity.data.datasets[0].data = sensorDataHistory.humidity.map(d => d.y);
    charts.humidity.update();
    
    // Update pressure chart
    charts.pressure.data.labels = sensorDataHistory.pressure.map(d => d.x);
    charts.pressure.data.datasets[0].data = sensorDataHistory.pressure.map(d => d.y);
    charts.pressure.update();
    
    // Update battery chart
    charts.battery.data.labels = sensorDataHistory.battery.map(d => d.x);
    charts.battery.data.datasets[0].data = sensorDataHistory.battery.map(d => d.y);
    charts.battery.update();
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
    // Extract deviceId from message (format: "... device 'deviceId': ...")
    const deviceId = extractDeviceIdFromMessage(alertData.message);
    
    // Add deviceId to alertData for filtering
    alertData.deviceId = deviceId;
    
    // Add to alerts array
    alertMessages.push(alertData);
    
    // Limit stored alerts to prevent memory issues
    if (alertMessages.length > 50) {
        alertMessages.shift();
    }
    
    // Skip if not matching selected device
    if (selectedDevice !== 'all' && deviceId !== selectedDevice) {
        return;
    }
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert-item ${alertData.severity.toLowerCase()}`;
    
    // Create message
    const messageElement = document.createElement('div');
    messageElement.className = 'alert-message';
    messageElement.textContent = alertData.message;
    
    // Create timestamp - use current time
    const timeElement = document.createElement('div');
    timeElement.className = 'alert-time';
    // Use the current time instead of the backend timestamp
    const timestamp = new Date();
    timeElement.textContent = timestamp.toLocaleTimeString('tr-TR', dateOptions);
    
    // Add elements to alert
    alertElement.appendChild(messageElement);
    alertElement.appendChild(timeElement);
    
    // Add to container (at the top)
    alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
    
    // Limit to 10 alerts
    while (alertsContainer.children.length > 10) {
        alertsContainer.removeChild(alertsContainer.lastChild);
    }
    
    // Update active alerts counter
    activeAlerts++;
    activeAlertsElement.textContent = activeAlerts;
}
