package com.yusufsahin.iot_platform.dto;

import com.yusufsahin.iot_platform.model.AlertMessage;
import java.time.LocalDateTime;

public record AlertMessageDto(
        Long id,
        String message,
        AlertMessage.AlertSeverity severity,
        AlertMessage.AlertType alertType,
        LocalDateTime timestamp,
        Long sensorDataId
) {
}
