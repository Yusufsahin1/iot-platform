package com.yusufsahin.iot_platform.dto.converter;

import com.yusufsahin.iot_platform.dto.SensorDataDto;
import com.yusufsahin.iot_platform.model.SensorData;

public class SensorDataDtoConverter {

    public static SensorDataDto toDto(SensorData sensorData) {
        return new SensorDataDto(
            sensorData.getId(),
            sensorData.getDeviceId(),
            sensorData.getTemperature(),
            sensorData.getHumidity(),
            sensorData.getPressure(),
            sensorData.getTimestamp(),
            sensorData.getLocation(),
            sensorData.getBatteryLevel()
        );
    }
}
