package com.yusufsahin.iot_platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "alert_messages")
public class AlertMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    private AlertSeverity severity = AlertSeverity.INFO;

    @Enumerated(EnumType.STRING)
    private AlertType alertType;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_data_id")
    private SensorData sensorData;

    public enum AlertSeverity {
        INFO, WARNING, ERROR, CRITICAL
    }

    public enum AlertType {
        TEMPERATURE_HIGH, TEMPERATURE_LOW,
        HUMIDITY_HIGH, HUMIDITY_LOW,
        PRESSURE_HIGH, PRESSURE_LOW,
        DEVICE_OFFLINE, BATTERY_LOW
    }
}
