package com.yusufsahin.iot_platform.repository;

import com.yusufsahin.iot_platform.model.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
}
