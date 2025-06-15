package com.yusufsahin.iot_platform.service;

import com.yusufsahin.iot_platform.dto.SensorDataDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate simpMessagingTemplate;

    public WebSocketService(SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    public void sendSensorData(SensorDataDto sensorData) {
        simpMessagingTemplate.convertAndSend("/topic/sensor-data", sensorData);
    }

    // Alert
}
