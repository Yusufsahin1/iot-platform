package com.yusufsahin.iot_platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IotPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(IotPlatformApplication.class, args);
	}

}
