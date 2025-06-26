package com.yusufsahin.iot_platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.yusufsahin.iot_platform.dto.SensorDataDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SensorDataProducer {

    private static final String TOPIC = "sensor-data";
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    private final Map<String, DeviceState> deviceStates = new ConcurrentHashMap<>();

    private record DeviceState(
            String deviceId,
            String location,
            double currentTemperature,
            double currentHumidity,
            double currentPressure,
            double batteryLevel
    ) {}

    public SensorDataProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        initializeDeviceStates();
    }

    private void initializeDeviceStates() {
        deviceStates.put("device-001", new DeviceState("device-001", "A", 28.0,
                35.0, 1015.0, 100.0));
        deviceStates.put("device-002", new DeviceState("device-002", "B", 22.0,
                75.0, 1010.0, 100.0));
        deviceStates.put("device-003", new DeviceState("device-003", "C", 15.0,
                60.0, 1005.0, 100.0));
        deviceStates.put("device-004", new DeviceState("device-004", "D", 4.0,
                50.0, 1020.0, 100.0));
        deviceStates.put("device-005", new DeviceState("device-005", "E", 24.0,
                55.0, 1012.0, 100.0));
    }

    @Scheduled(fixedRate = 5000) // Every 5 seconds
    public void generateAndSendSensorData() {
        deviceStates.forEach((deviceId, currentState) -> {
            if (currentState.batteryLevel() <= 0) {
                log.warn("Device {} has a dead battery. Skipping data generation.", deviceId);
                return;
            }

            double newTemp = currentState.currentTemperature() + (random.nextDouble() - 0.5);
            double newHumidity = currentState.currentHumidity() + (random.nextDouble() * 2.0 - 1.0);
            double newPressure = currentState.currentPressure() + (random.nextDouble() * 0.4 - 0.2);
            double newBattery = Math.max(0, currentState.batteryLevel() - (0.1 + random.nextDouble() * 0.2));

            DeviceState newState = new DeviceState(
                    deviceId,
                    currentState.location(),
                    newTemp,
                    newHumidity,
                    newPressure,
                    newBattery
            );

            deviceStates.put(deviceId, newState);

            SensorDataDto sensorDataDto = new SensorDataDto(
                    null,
                    newState.deviceId(),
                    newState.currentTemperature(),
                    newState.currentHumidity(),
                    newState.currentPressure(),
                    LocalDateTime.now(),
                    newState.location(),
                    (int) newState.batteryLevel()
            );

            sendSensorData(sensorDataDto);
        });
    }

    private void sendSensorData(SensorDataDto data) {
        try {
            String jsonData = objectMapper.writeValueAsString(data);
            kafkaTemplate.send(TOPIC, data.deviceId(), jsonData);
            log.info("Sent realistic sensor data to Kafka for device: {}", data.deviceId());
        } catch (JsonProcessingException e) {
            log.error("Error serializing sensor data for device {}: ", data.deviceId(), e);
        }
    }
}