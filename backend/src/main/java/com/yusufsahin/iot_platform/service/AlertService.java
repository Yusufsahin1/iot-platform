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

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final WebSocketService webSocketService;
    private final AlertMessageRepository alertMessageRepository;

    private static final double HIGH_TEMPERATURE_THRESHOLD = 30.0; // 30°C
    private static final double LOW_TEMPERATURE_THRESHOLD = 5.0;   // 5°C
    private static final int LOW_BATTERY_THRESHOLD = 20;        // %20 Pil Seviyesi
    private static final double HIGH_HUMIDITY_THRESHOLD = 70.0;  // %70 Nem

    public AlertService(WebSocketService webSocketService,
                        AlertMessageRepository alertMessageRepository) {
        this.webSocketService = webSocketService;
        this.alertMessageRepository = alertMessageRepository;
    }

    @Transactional
    public void checkForAndProcessAlerts(SensorData sensorData) {
        if (sensorData == null) {
            log.warn("SensorData is null, cannot check for alerts.");
            return;
        }

        String deviceId = sensorData.getDeviceId();

        // Yüksek Sıcaklık Uyarısı
        if (sensorData.getTemperature() != null && sensorData.getTemperature() > HIGH_TEMPERATURE_THRESHOLD) {
            String message = String.format("Cihaz '%s' için yüksek sıcaklık tespit edildi: %.2f°C (Eşik: %.1f°C)",
                    deviceId, sensorData.getTemperature(), HIGH_TEMPERATURE_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.CRITICAL, AlertMessage.AlertType.TEMPERATURE_HIGH);
        }

        // Düşük Sıcaklık Uyarısı
        if (sensorData.getTemperature() != null && sensorData.getTemperature() < LOW_TEMPERATURE_THRESHOLD) {
            String message = String.format("Cihaz '%s' için düşük sıcaklık tespit edildi: %.2f°C (Eşik: %.1f°C)",
                    deviceId, sensorData.getTemperature(), LOW_TEMPERATURE_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.WARNING, AlertMessage.AlertType.TEMPERATURE_LOW);
        }

        // Düşük Pil Seviyesi Uyarısı
        if (sensorData.getBatteryLevel() != null && sensorData.getBatteryLevel() < LOW_BATTERY_THRESHOLD) {
            String message = String.format("Cihaz '%s' için düşük pil seviyesi: %d%% (Eşik: %d%%)",
                    deviceId, sensorData.getBatteryLevel(), LOW_BATTERY_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.WARNING, AlertMessage.AlertType.BATTERY_LOW);
        }

        // Yüksek Nem Uyarısı
        if (sensorData.getHumidity() != null && sensorData.getHumidity() > HIGH_HUMIDITY_THRESHOLD) {
            String message = String.format("Cihaz '%s' için yüksek nem tespit edildi: %.2f%% (Eşik: %.1f%%)",
                    deviceId, sensorData.getHumidity(), HIGH_HUMIDITY_THRESHOLD);
            createAndSendAlert(sensorData, message, AlertMessage.AlertSeverity.INFO, AlertMessage.AlertType.HUMIDITY_HIGH);
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