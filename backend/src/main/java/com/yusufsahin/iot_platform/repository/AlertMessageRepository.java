package com.yusufsahin.iot_platform.repository;

import com.yusufsahin.iot_platform.model.AlertMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertMessageRepository extends JpaRepository<AlertMessage, Long> {
}
