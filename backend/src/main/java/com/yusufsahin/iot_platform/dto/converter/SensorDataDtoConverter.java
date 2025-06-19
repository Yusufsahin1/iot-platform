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

    public static SensorData toEntity(SensorDataDto sensorDataDto) {
        SensorData sensorData = new SensorData();
        sensorData.setId(sensorDataDto.id());
        sensorData.setDeviceId(sensorDataDto.deviceId());
        sensorData.setTemperature(sensorDataDto.temperature());
        sensorData.setHumidity(sensorDataDto.humidity());
        sensorData.setPressure(sensorDataDto.pressure());
        sensorData.setTimestamp(sensorDataDto.timestamp());
        sensorData.setLocation(sensorDataDto.location());
        sensorData.setBatteryLevel(sensorDataDto.batteryLevel());
        return sensorData;
    }

}
