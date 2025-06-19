-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS iot_platform;

-- Grant all privileges on schema to postgres user
GRANT ALL ON SCHEMA iot_platform TO postgres;
GRANT ALL ON SCHEMA iot_platform TO public;

-- Set the search path for the current session
SET search_path TO iot_platform, public;

-- Create extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables will be handled by Hibernate with ddl-auto=create-drop
-- But we can add any additional SQL statements here if needed
