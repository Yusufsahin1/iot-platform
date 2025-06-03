package com.yusufsahin.iot_platform.dto;

import java.time.LocalDateTime;

public record SensorDataDto(
        Long id,
        String deviceId,
        Double temperature,
        Double humidity,
        Double pressure,
        LocalDateTime timestamp,
        String location,
        Integer batteryLevel
) {
}
