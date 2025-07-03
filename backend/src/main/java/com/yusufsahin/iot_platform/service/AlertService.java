package com.yusufsahin.iot_platform.service;

import com.yusufsahin.iot_platform.dto.AlertMessageDto;
import com.yusufsahin.iot_platform.dto.converter.AlertMessageDtoConverter;
import com.yusufsahin.iot_platform.model.AlertMessage;
import com.yusufsahin.iot_platform.model.SensorData;
import com.yusufsahin.iot_platform.repository.AlertMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final WebSocketService webSocketService;
    private final AlertMessageRepository alertMessageRepository;

    private static final double HIGH_TEMPERATURE_THRESHOLD = 30.0; // 30°C
    private static final double LOW_TEMPERATURE_THRESHOLD = 5.0;   // 5°C
    private static final int LOW_BATTERY_THRESHOLD = 20;        // %20 Battery Level
    private static final double HIGH_HUMIDITY_THRESHOLD = 70.0;  // %70 Humidity
    private static final double LOW_HUMIDITY_THRESHOLD = 30.0;   // %30 Humidity
    private static final double HIGH_PRESSURE_THRESHOLD = 1030.0; // 1030 hPa
    private static final double LOW_PRESSURE_THRESHOLD = 980.0;   // 980 hPa

    public AlertService(WebSocketService webSocketService,
                        AlertMessageRepository alertMessageRepository) {
        this.webSocketService = webSocketService;
        this.alertMessageRepository = alertMessageRepository;
    }

    public List<AlertMessageDto> getAllAlertMessages() {
        return alertMessageRepository.findAll().stream()
                .map(AlertMessageDtoConverter::toDto)
                .collect(Collectors.toList());
    }
    
    public List<AlertMessageDto> getAlertMessagesByDeviceId(String deviceId) {
        return alertMessageRepository.findAll().stream()
                .filter(alert -> alert.getSensorData() != null && 
                        alert.getSensorData().getDeviceId().equals(deviceId))
                .map(AlertMessageDtoConverter::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void checkForAndProcessAlerts(SensorData sensorData) {
        if (sensorData == null) {
            log.warn("SensorData is null, cannot check for alerts.");
            return;
        }

        String deviceId = sensorData.getDeviceId();

        // High Temperature Alert
        if (sensorData.getTemperature() != null && sensorData.getTemperature() > HIGH_TEMPERATURE_THRESHOLD) {
            String message = String.format("High temperature detected for device '%s': %.2f°C (Threshold: %.1f°C)",
                    deviceId, sensorData.getTemperature(), HIGH_TEMPERATURE_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.CRITICAL, AlertMessage.AlertType.TEMPERATURE_HIGH);
        }

        // Low Temperature Alert
        if (sensorData.getTemperature() != null && sensorData.getTemperature() < LOW_TEMPERATURE_THRESHOLD) {
            String message = String.format("Low temperature detected for device '%s': %.2f°C (Threshold: %.1f°C)",
                    deviceId, sensorData.getTemperature(), LOW_TEMPERATURE_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.WARNING, AlertMessage.AlertType.TEMPERATURE_LOW);
        }

        // Low Battery Level Alert
        if (sensorData.getBatteryLevel() != null && sensorData.getBatteryLevel() < LOW_BATTERY_THRESHOLD) {
            String message = String.format("Low battery level for device '%s': %d%% (Threshold: %d%%)",
                    deviceId, sensorData.getBatteryLevel(), LOW_BATTERY_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.WARNING, AlertMessage.AlertType.BATTERY_LOW);
        }

        // High Humidity Alert
        if (sensorData.getHumidity() != null && sensorData.getHumidity() > HIGH_HUMIDITY_THRESHOLD) {
            String message = String.format("High humidity detected for device '%s': %.2f%% (Threshold: %.1f%%)",
                    deviceId, sensorData.getHumidity(), HIGH_HUMIDITY_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.INFO, AlertMessage.AlertType.HUMIDITY_HIGH);
        }

        // Low Humidity Alert
        if (sensorData.getHumidity() != null && sensorData.getHumidity() < LOW_HUMIDITY_THRESHOLD) {
            String message = String.format("Low humidity detected for device '%s': %.2f%% (Threshold: %.1f%%)",
                    deviceId, sensorData.getHumidity(), LOW_HUMIDITY_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.WARNING, AlertMessage.AlertType.HUMIDITY_LOW);
        }

        // High Pressure Alert
        if (sensorData.getPressure() != null && sensorData.getPressure() > HIGH_PRESSURE_THRESHOLD) {
            String message = String.format("High pressure detected for device '%s': %.2f hPa (Threshold: %.1f hPa)",
                    deviceId, sensorData.getPressure(), HIGH_PRESSURE_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.WARNING, AlertMessage.AlertType.PRESSURE_HIGH);
        }

        // Low Pressure Alert
        if (sensorData.getPressure() != null && sensorData.getPressure() < LOW_PRESSURE_THRESHOLD) {
            String message = String.format("Low pressure detected for device '%s': %.2f hPa (Threshold: %.1f hPa)",
                    deviceId, sensorData.getPressure(), LOW_PRESSURE_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.WARNING, AlertMessage.AlertType.PRESSURE_LOW);
        }
    }

    private void createAndSendAlert(SensorData sensorData, String message, AlertMessage.AlertSeverity severity, AlertMessage.AlertType alertType) {
        AlertMessage alert = new AlertMessage();
        alert.setSensorData(sensorData);
        alert.setMessage(message);
        alert.setSeverity(severity);
        alert.setAlertType(alertType);
        alert.setTimestamp(LocalDateTime.now());

        try {
            AlertMessage savedAlert = alertMessageRepository.save(alert);
            log.info("Alert generated & sent: ID {}, Device: {}, Type: {}, Message: {}",
                    savedAlert.getId(),
                    savedAlert.getSensorData() != null ? savedAlert.getSensorData().getDeviceId() : "UNKNOWN_DEVICE",
                    savedAlert.getAlertType(),
                    savedAlert.getMessage());

            AlertMessageDto alertDto = AlertMessageDtoConverter.toDto(savedAlert);
            webSocketService.sendAlert(alertDto);

        } catch (Exception e) {
            log.error("Error creating or sending alert for device {}: {}",
                    sensorData != null ? sensorData.getDeviceId() : "UNKNOWN_DEVICE", message, e);
        }
    }
}