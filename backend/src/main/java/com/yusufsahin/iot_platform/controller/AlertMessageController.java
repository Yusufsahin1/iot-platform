package com.yusufsahin.iot_platform.controller;

import com.yusufsahin.iot_platform.dto.AlertMessageDto;
import com.yusufsahin.iot_platform.service.AlertService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alert-messages")
public class AlertMessageController {

    private final AlertService alertService;

    public AlertMessageController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<AlertMessageDto> getAllAlertMessages() {
        return alertService.getAllAlertMessages();
    }
    
    @GetMapping("/device/{deviceId}")
    public List<AlertMessageDto> getAlertMessagesByDeviceId(@PathVariable("deviceId") String deviceId) {
        return alertService.getAlertMessagesByDeviceId(deviceId);
    }
} 