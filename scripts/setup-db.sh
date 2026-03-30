#!/bin/bash

# AWS RDS Database Setup Script
# This script helps initialize the RDS MySQL database

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-admin}
DB_NAME=${DB_NAME:-football_booking_db}
DB_PASSWORD=${DB_PASSWORD:-}

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Validate inputs
validate_inputs() {
    if [ -z "$DB_PASSWORD" ]; then
        print_error "DB_PASSWORD environment variable is required"
        exit 1
    fi
    
    if [ -z "$DB_HOST" ]; then
        print_error "DB_HOST environment variable is required"
        exit 1
    fi
}

# Test connection
test_connection() {
    print_header "Testing Database Connection"
    
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Could not connect to database"
        return 1
    fi
}

# Create database
create_database() {
    print_header "Creating Database"
    
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
EOF
    
    print_success "Database created successfully"
}

# Run migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    cd backend
    NODE_ENV=production \
    DB_HOST="$DB_HOST" \
    DB_PORT="$DB_PORT" \
    DB_USER="$DB_USER" \
    DB_PASSWORD="$DB_PASSWORD" \
    DB_NAME="$DB_NAME" \
    DB_DIALECT=mysql \
    npm run db:create
    
    print_success "Database migrations completed"
}

# Seed database (optional)
seed_database() {
    print_header "Seeding Database (Optional)"
    
    read -p "Do you want to seed the database with demo data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        NODE_ENV=production \
        DB_HOST="$DB_HOST" \
        DB_PORT="$DB_PORT" \
        DB_USER="$DB_USER" \
        DB_PASSWORD="$DB_PASSWORD" \
        DB_NAME="$DB_NAME" \
        DB_DIALECT=mysql \
        npm run seed
        
        print_success "Database seeded with demo data"
    fi
}

# Main
main() {
    echo -e "${BLUE}Football Field Booking App - RDS Database Setup${NC}"
    
    validate_inputs || exit 1
    test_connection || exit 1
    create_database
    run_migrations
    seed_database
    
    echo -e "\n${GREEN}Database setup completed successfully!${NC}\n"
    echo "Database credentials:"
    echo "Host: $DB_HOST:$DB_PORT"
    echo "Database: $DB_NAME"
    echo "User: $DB_USER"
}

main "$@"
