package com.yusufsahin.iot_platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sensors")
public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String deviceId;

    private Double temperature; // °C
    private Double humidity;    // %
    private Double pressure;    // hPa

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private String location;
    private Integer batteryLevel; // 0-100

    @OneToMany(mappedBy = "sensorData", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AlertMessage> alerts;
}
