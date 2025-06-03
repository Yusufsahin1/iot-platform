package com.yusufsahin.iot_platform.dto.converter;

import com.yusufsahin.iot_platform.dto.AlertMessageDto;

public class AlertMessageDtoConverter {

    public static AlertMessageDto toDto(com.yusufsahin.iot_platform.model.AlertMessage alertMessage) {
        return new AlertMessageDto(
            alertMessage.getId(),
            alertMessage.getMessage(),
            alertMessage.getSeverity(),
            alertMessage.getAlertType(),
            alertMessage.getTimestamp(),
            alertMessage.getSensorData().getId()
        );
    }
}
