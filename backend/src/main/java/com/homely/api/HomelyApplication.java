package com.homely.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HomelyApplication {

    public static void main(String[] args) {
        SpringApplication.run(HomelyApplication.class, args);
    }
}
