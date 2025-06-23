package com.yusufsahin.iot_platform.repository;

import com.yusufsahin.iot_platform.model.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    Optional<SensorData> findById(Long id);
    List<SensorData> findByDeviceId(String deviceId);
}
