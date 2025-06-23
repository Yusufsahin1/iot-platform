package com.yusufsahin.iot_platform.controller;

import com.yusufsahin.iot_platform.dto.SensorDataDto;
import com.yusufsahin.iot_platform.service.SensorDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sensor-data")
public class SensorDataController {

    private final SensorDataService sensorDataService;

    public SensorDataController(SensorDataService sensorDataService) {
        this.sensorDataService = sensorDataService;
    }

    @GetMapping
    public List<SensorDataDto> getAllSensorData() {
        return sensorDataService.getAllSensorData();
    }

    @GetMapping("/device/{deviceId}")
    public List<SensorDataDto> getSensorDataByDeviceId(@PathVariable("deviceId") String deviceId) {
        return sensorDataService.getSensorDataByDeviceId(deviceId);
    }

}
