
# IoT Platform

**EN**<br>
This project is a full-stack IoT platform designed to collect, process, visualize, store data from various IoT devices in real time, and generate alerts for abnormal situations.

**TR**<br>
Bu proje, çeşitli IoT cihazlarından gelen verileri gerçek zamanlı olarak toplamak, işlemek, görselleştirmek, depolamak ve anormal durumlar için uyarılar üretmek üzere tasarlanmış bir full-stack IoT platformudur.

https://github.com/user-attachments/assets/364b66b2-756c-4a4a-bd6d-7a9df8dc680b

---

## English

### ✨ Features

- **Real-time Data Processing**:  Instantly receives and processes sensor data using Apache Kafka for efficient streaming.
- **Live Dashboard**: A user-friendly web interface that displays real-time sensor metrics such as temperature, humidity, and pressure with interactive graphs.
- **WebSocket Communication**: Enables seamless, bidirectional communication between the backend and frontend via WebSocket technology.
- **Automatic Alert System**: Automatically triggers alerts when predefined anomalies occur — such as overheating or low battery.
- **Data Storage**: All sensor data and triggered alerts are securely stored in a PostgreSQL database for historical access and analysis.
- **Easy Deployment with Docker**: Fully containerized with Docker and Docker Compose, enabling quick and easy setup with a single command.


### ⚙️ Tech Stack

- **Backend**:
    - Java 21
    - Spring Boot 3
    - Spring Web / Data JPA / WebSocket
    - Spring for Apache Kafka
- **Frontend**:
    - Vanilla JavaScript
    - Chart.js (for data visualization)
    - Stomp.js & SockJS (for WebSocket communication)
    - Parcel (build tool)
    - Nginx (web server)
- **Database**:
    - PostgreSQL
- **Messaging**:
    - Apache Kafka
- **DevOps / Containerization**:
    - Docker & Docker Compose

### 📊 Data Flow

The platform processes data in a clear, sequential flow:

1.  **Data Ingestion**: IoT devices (or the built-in simulator) send sensor data (e.g., temperature, humidity) to an `Apache Kafka` topic named `sensor-data`.

2.  **Backend Processing**:
    - The `KafkaConsumer` service listens for new messages on the Kafka topic.
    - Upon receiving data, it passes it to the `SensorDataService`, which saves the data to the `PostgreSQL` database.

3.  **Alert Generation**:
    - After saving, the `AlertService` checks the data against predefined thresholds (e.g., high temperature, low battery).
    - If a condition is met, it generates an alert, stores it in the database, and prepares it for real-time notification.

4.  **Real-time Communication**:
    - Both the raw sensor data and any generated alerts are pushed from the backend to the frontend in real time using `WebSockets`.

5.  **Live Visualization**:
    - The frontend receives the data via WebSocket and instantly updates the dashboard charts and alert notifications, providing a live view of the IoT device status.

### 🚀 Getting Started

To run this project, you need to have Docker and Docker Compose installed on your machine.

1.  **Clone the repository:**
    ```bash
    git clone <https://github.com/Yusufsahin1/iot-platform.git>
    cd iot-platform
    ```

2.  **Build and run the services using Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    This command will build the images for the frontend and backend services and start all the containers (`frontend`, `backend`, `db`, `kafka`, `zookeeper`).

3.  **Access the application:**
    -   **Frontend / Dashboard**: Open your browser and navigate to `http://localhost`.
    -   **Backend API**: The backend service is available at `http://localhost:8080`.
    -   **Kafka**: Kafka is running on `localhost:9092`.

### ⚖️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Türkçe

### ✨ Özellikler

- **Gerçek Zamanlı Veri İşleme**: Apache Kafka aracılığıyla sensör verilerinin anlık olarak alınması ve işlenmesi.
- **Canlı Gösterge Paneli**: Web tabanlı arayüz üzerinden sensör verilerinin (sıcaklık, nem, basınç vb.) grafiklerle anlık olarak izlenmesi.
- **Anlık İletişim (WebSocket)**: Sunucu (backend) ve istemci (frontend) arasında WebSocket teknolojisi ile kurulan anlık ve çift yönlü iletişim.
- **Otomatik Uyarı Sistemi**: Sıcaklığın aşırı yükselmesi veya pilin zayıflaması gibi önceden tanımlanmış anormal durumlarda otomatik olarak uyarılar oluşturulması.
- **Veri Depolama**: Tüm sensör verilerinin ve oluşturulan uyarıların PostgreSQL veritabanında güvenle saklanması.
- **Docker ile Kolay Kurulum**: Projenin Docker ve Docker Compose ile konteyner haline getirilmesi sayesinde tek komutla hızlı ve kolay kurulum imkanı.

### ⚙️ Teknoloji Yığını

- **Backend**:
    - Java 21
    - Spring Boot 3
    - Spring Web / Data JPA / WebSocket
    - Spring for Apache Kafka
- **Frontend**:
    - Vanilla JavaScript
    - Chart.js (veri görselleştirme için)
    - Stomp.js & SockJS (WebSocket iletişimi için)
    - Parcel (build aracı)
    - Nginx (web sunucusu)
- **Veritabanı**:
    - PostgreSQL
- **Mesajlaşma**:
    - Apache Kafka
- **DevOps / Konteynerleştirme**:
    - Docker & Docker Compose

### 📊 Veri Akışı

Platform, verileri net ve sıralı bir akışla işler:

1.  **Veri Alımı**: IoT cihazları (veya yerleşik simülatör), `sensor-data` adlı `Apache Kafka` konusuna (topic) sensör verilerini (ör. sıcaklık, nem) gönderir.

2.  **Backend İşlemleri**:
    - `KafkaConsumer` servisi, Kafka topiğindeki yeni mesajları dinler.
    - Veriyi aldığında, `PostgreSQL` veritabanına kaydeden `SensorDataService`'e iletir.

3.  **Uyarı Üretimi**:
    - Kayıttan sonra, `AlertService` veriyi önceden tanımlanmış eşiklere (ör. yüksek sıcaklık, düşük pil) göre kontrol eder.
    - Bir koşul karşılanırsa, bir uyarı oluşturur, veritabanında saklar ve gerçek zamanlı bildirim için hazırlar.

4.  **Gerçek Zamanlı İletişim**:
    - Hem ham sensör verileri hem de oluşturulan uyarılar, `WebSocket` kullanılarak backend'den frontend'e gerçek zamanlı olarak gönderilir.
    
5.  **Canlı Görselleştirme**:
    - Frontend, verileri WebSocket aracılığıyla alır ve pano grafiklerini ve uyarı bildirimlerini anında güncelleyerek IoT cihaz durumunun canlı bir görünümünü sağlar.

### 🚀 Projeyi Çalıştırma

Bu projeyi çalıştırmak için makinenizde Docker ve Docker Compose'un kurulu olması gerekmektedir.

1.  **Projeyi klonlayın:**
    ```bash
    git clone <https://github.com/Yusufsahin1/iot-platform.git>
    cd iot-platform
    ```

2.  **Docker Compose ile servisleri derleyin ve çalıştırın:**
    ```bash
    docker-compose up --build
    ```
    Bu komut, `frontend` ve `backend` servisleri için imajları oluşturacak ve tüm konteynerleri (`frontend`, `backend`, `db`, `kafka`, `zookeeper`) başlatacaktır.

3.  **Uygulamaya erişim:**
    -   **Frontend / Pano**: Tarayıcınızı açın ve `http://localhost` adresine gidin.
    -   **Backend API**: Backend servisi `http://localhost:8080` adresinde çalışmaktadır.
    -   **Kafka**: Kafka `localhost:9092` adresinde çalışmaktadır.

### ⚖️ Lisans

Bu proje MIT Lisansı ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.