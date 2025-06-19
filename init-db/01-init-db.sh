#!/bin/bash
set -e

echo "Creating database schema..."
psql -U postgres -d iot_platform -c "CREATE SCHEMA IF NOT EXISTS public;"

echo "Granting permissions..."
psql -U postgres -d iot_platform -c "GRANT ALL ON SCHEMA public TO postgres;"
psql -U postgres -d iot_platform -c "GRANT ALL ON SCHEMA public TO public;"

echo "Database initialization completed!"
