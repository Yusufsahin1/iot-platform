package com.yusufsahin.iot_platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.yusufsahin.iot_platform.dto.SensorDataDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class KafkaConsumer {

    private static final String TOPIC = "sensor-data";
    private static final String GROUP_ID = "iot-platform-group";

    private final ObjectMapper objectMapper;
    private final WebSocketService webSocketService;
    private final SensorDataService sensorDataService;

    public KafkaConsumer(ObjectMapper objectMapper, WebSocketService webSocketService, SensorDataService sensorDataService) {
        this.objectMapper = objectMapper;
        this.webSocketService = webSocketService;
        this.sensorDataService = sensorDataService;
        // Module to deserialize LocalDateTime correctly
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @KafkaListener(topics = TOPIC, groupId = GROUP_ID)
    public void consumeSensorData(String message) {
        log.info("Received message from Kafka topic {}: {}", TOPIC, message);
        try {
            SensorDataDto sensorDataDto = objectMapper.readValue(message, SensorDataDto.class);
            //log.info("Deserialized SensorDataDto: {}", sensorDataDto);

            // DB
            sensorDataService.processAndSaveSensorData(sensorDataDto);
            //log.debug("Processed sensor data: {}", sensorDataDto);

            webSocketService.sendSensorData(sensorDataDto);
            log.info("Sent sensor data to WebSocket: {}", sensorDataDto);

            System.out.println("Consumed and deserialized: " + sensorDataDto.toString());

        } catch (JsonProcessingException e) {
            log.error("Error deserializing sensor data from Kafka: {}", message, e);
        } catch (Exception e) {
            log.error("Error processing message from Kafka: {}", message, e);
        }
    }

}
