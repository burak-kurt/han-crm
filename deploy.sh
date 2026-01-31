#!/bin/bash

# HAN CRM Production Deployment Script
# Usage: ./deploy.sh [build|start|stop|restart|logs|backup]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found!"
        print_info "Copy .env.production.example to .env.production and configure it"
        exit 1
    fi
    print_success "Environment file found"
}

build() {
    print_info "Building Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    print_success "Build completed"
}

start() {
    print_info "Starting services..."
    docker-compose -f $COMPOSE_FILE up -d
    print_success "Services started"

    print_info "Waiting for services to be healthy..."
    sleep 10

    docker-compose -f $COMPOSE_FILE ps
}

stop() {
    print_info "Stopping services..."
    docker-compose -f $COMPOSE_FILE down
    print_success "Services stopped"
}

restart() {
    stop
    start
}

logs() {
    SERVICE=${2:-}
    if [ -z "$SERVICE" ]; then
        docker-compose -f $COMPOSE_FILE logs -f --tail=100
    else
        docker-compose -f $COMPOSE_FILE logs -f --tail=100 $SERVICE
    fi
}

backup() {
    print_info "Creating backup..."

    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/hancrm_backup_$TIMESTAMP.sql"

    # Database backup
    docker-compose -f $COMPOSE_FILE exec -T database pg_dump -U hanuser hancrm > $BACKUP_FILE

    # Compress backup
    gzip $BACKUP_FILE

    print_success "Backup created: ${BACKUP_FILE}.gz"

    # Remove old backups (keep last 30 days)
    find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
    print_info "Old backups cleaned up"
}

restore() {
    BACKUP_FILE=$2

    if [ -z "$BACKUP_FILE" ]; then
        print_error "Please specify backup file"
        print_info "Usage: ./deploy.sh restore <backup-file.sql.gz>"
        exit 1
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    print_info "Restoring from backup: $BACKUP_FILE"

    # Decompress if needed
    if [[ $BACKUP_FILE == *.gz ]]; then
        gunzip -c $BACKUP_FILE | docker-compose -f $COMPOSE_FILE exec -T database psql -U hanuser hancrm
    else
        cat $BACKUP_FILE | docker-compose -f $COMPOSE_FILE exec -T database psql -U hanuser hancrm
    fi

    print_success "Restore completed"
}

status() {
    docker-compose -f $COMPOSE_FILE ps
}

ssl_init() {
    print_info "Initializing SSL certificates..."

    # Start nginx and certbot
    docker-compose -f $COMPOSE_FILE up -d nginx certbot

    # Request certificate
    print_info "Requesting SSL certificate for $DOMAIN..."
    docker-compose -f $COMPOSE_FILE run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $CERTBOT_EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d $API_DOMAIN

    print_success "SSL certificates created"

    # Restart nginx to load certificates
    docker-compose -f $COMPOSE_FILE restart nginx
}

health_check() {
    print_info "Running health checks..."

    # Check API
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_success "API is healthy"
    else
        print_error "API health check failed"
    fi

    # Check Frontend
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend health check failed"
    fi

    # Check Database
    if docker-compose -f $COMPOSE_FILE exec -T database pg_isready -U hanuser > /dev/null 2>&1; then
        print_success "Database is healthy"
    else
        print_error "Database health check failed"
    fi
}

# Main script
case "$1" in
    build)
        check_env
        build
        ;;
    start)
        check_env
        start
        ;;
    stop)
        stop
        ;;
    restart)
        check_env
        restart
        ;;
    logs)
        logs $@
        ;;
    backup)
        backup
        ;;
    restore)
        restore $@
        ;;
    status)
        status
        ;;
    ssl-init)
        check_env
        source $ENV_FILE
        ssl_init
        ;;
    health)
        health_check
        ;;
    *)
        echo "HAN CRM Deployment Manager"
        echo ""
        echo "Usage: $0 {build|start|stop|restart|logs|backup|restore|status|ssl-init|health}"
        echo ""
        echo "Commands:"
        echo "  build       - Build Docker images"
        echo "  start       - Start all services"
        echo "  stop        - Stop all services"
        echo "  restart     - Restart all services"
        echo "  logs [svc]  - Show logs (optionally for specific service)"
        echo "  backup      - Create database backup"
        echo "  restore <f> - Restore from backup file"
        echo "  status      - Show service status"
        echo "  ssl-init    - Initialize SSL certificates"
        echo "  health      - Run health checks"
        echo ""
        exit 1
        ;;
esac

exit 0
