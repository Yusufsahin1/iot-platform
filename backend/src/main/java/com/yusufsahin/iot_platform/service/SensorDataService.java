package com.yusufsahin.iot_platform.service;

import com.yusufsahin.iot_platform.dto.SensorDataDto;
import com.yusufsahin.iot_platform.dto.converter.SensorDataDtoConverter;
import com.yusufsahin.iot_platform.model.SensorData;
import com.yusufsahin.iot_platform.repository.SensorDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class SensorDataService {

    private final SensorDataRepository sensorDataRepository;
    private final AlertService alertService;

    public SensorDataService(SensorDataRepository sensorDataRepository, AlertService alertService) {
        this.sensorDataRepository = sensorDataRepository;
        this.alertService = alertService;
    }

    @Transactional
    public SensorDataDto processAndSaveSensorData(SensorDataDto sensorDataDto) {

        SensorData sensorDataEntity = SensorDataDtoConverter.toEntity(sensorDataDto);
        SensorData savedSensorData = sensorDataRepository.save(sensorDataEntity);

        alertService.checkForAndProcessAlerts(savedSensorData);

        return SensorDataDtoConverter.toDto(savedSensorData);

    }

    public List<SensorDataDto> getAllSensorData() {
        return sensorDataRepository.findAll().stream().map(SensorDataDtoConverter::toDto).toList();
    }

    public List<SensorDataDto> getSensorDataByDeviceId(String deviceId) {
        return sensorDataRepository.findByDeviceId(deviceId).stream().map(SensorDataDtoConverter::toDto).toList();
    }

}

