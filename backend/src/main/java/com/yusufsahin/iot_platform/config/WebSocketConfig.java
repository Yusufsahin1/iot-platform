package com.yusufsahin.iot_platform.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Basit bir bellek içi mesaj broker'ı etkinleştirir.
        // "/topic" ile başlayan hedeflere mesaj gönderilmesini sağlar.
        config.enableSimpleBroker("/topic");
        // Client'lardan sunucuya gelen mesajların prefix'ini ayarlar.
        // Örneğin, client @MessageMapping("/app/sendData") gibi bir adrese mesaj gönderebilir.
        config.setApplicationDestinationPrefixes("/app");
    }

    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // "/ws" endpoint'ini STOMP bağlantıları için kaydeder.
        // SockJS, WebSocket'i desteklemeyen tarayıcılar için fallback seçenekleri sunar.
        registry.addEndpoint("/ws").withSockJS();
    }
}
