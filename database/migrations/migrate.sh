#!/bin/bash

# ═════════════════════════════════════════════════════════════════════════════
# NOOR AL-ILM DATABASE MIGRATION SCRIPT
# Version: 1.0.0
# Description: Automated database migration runner
# ═════════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME=${DB_NAME:-noor_ilm}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-$(dirname "$0")}
SEEDS_DIR=${SEEDS_DIR:-$(dirname "$0")/../seeds}
BACKUP_DIR=${BACKUP_DIR:-$(dirname "$0")/../backups}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check database connection
check_db_connection() {
    print_status "Checking database connection..."
    
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Cannot connect to database. Please check your connection parameters."
        return 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    print_status "Creating database if it doesn't exist..."
    
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" | grep -q 1; then
        print_success "Database '$DB_NAME' already exists"
    else
        print_status "Creating database '$DB_NAME'..."
        PGPASSWORD=$DB_PASSWORD createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
        print_success "Database '$DB_NAME' created successfully"
    fi
}

# Function to backup database before migration
backup_database() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/${DB_NAME}_backup_${timestamp}.sql"
    
    print_status "Creating database backup: $backup_file"
    
    if PGPASSWORD=$DB_PASSWORD pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"; then
        print_success "Database backup created successfully"
        
        # Compress backup
        gzip "$backup_file"
        print_status "Backup compressed: ${backup_file}.gz"
        
        # Keep only last 5 backups
        find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f | sort -r | tail -n +6 | xargs -r rm
        print_status "Old backups cleaned up"
    else
        print_error "Failed to create database backup"
        return 1
    fi
}

# Function to run migration file
run_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file" .sql)
    
    print_status "Running migration: $migration_name"
    
    # Check if migration already exists
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 FROM schema_migrations WHERE migration_name = '$migration_name';" 2>/dev/null | grep -q 1; then
        print_warning "Migration '$migration_name' already applied, skipping"
        return 0
    fi
    
    # Run migration
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
        print_success "Migration '$migration_name' applied successfully"
        
        # Record migration
        PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO schema_migrations (migration_name, applied_at) VALUES ('$migration_name', CURRENT_TIMESTAMP);" 2>/dev/null || true
        
        return 0
    else
        print_error "Failed to apply migration '$migration_name'"
        return 1
    fi
}

# Function to run seed file
run_seed() {
    local seed_file="$1"
    local seed_name=$(basename "$seed_file" .sql)
    
    print_status "Running seed: $seed_name"
    
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$seed_file" > /dev/null 2>&1; then
        print_success "Seed '$seed_name' applied successfully"
        return 0
    else
        print_error "Failed to apply seed '$seed_name'"
        return 1
    fi
}

# Function to create migrations table
create_migrations_table() {
    print_status "Creating migrations table if it doesn't exist..."
    
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    " 2>/dev/null || true
}

# Function to get list of migration files
get_migration_files() {
    find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort -V
}

# Function to get list of seed files
get_seed_files() {
    find "$SEEDS_DIR" -name "*.sql" -type f | sort -V
}

# Function to rollback migration
rollback_migration() {
    local migration_name="$1"
    
    print_status "Rolling back migration: $migration_name"
    
    # Remove migration record
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM schema_migrations WHERE migration_name = '$migration_name';" > /dev/null 2>&1; then
        print_success "Migration '$migration_name' rolled back successfully"
        return 0
    else
        print_error "Failed to rollback migration '$migration_name'"
        return 1
    fi
}

# Function to show migration status
show_status() {
    print_status "Migration status:"
    
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            migration_name,
            applied_at,
            CASE 
                WHEN applied_at IS NOT NULL THEN 'Applied'
                ELSE 'Pending'
            END as status
        FROM schema_migrations 
        ORDER BY migration_name;
    " 2>/dev/null || print_warning "Could not retrieve migration status"
}

# Function to reset database
reset_database() {
    print_warning "This will drop all tables and recreate the database. Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Dropping database..."
        PGPASSWORD=$DB_PASSWORD dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
        
        print_status "Recreating database..."
        PGPASSWORD=$DB_PASSWORD createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
        
        print_success "Database reset successfully"
        return 0
    else
        print_status "Database reset cancelled"
        return 1
    fi
}

# Main execution
main() {
    print_status "Starting Noor Al-Ilm database migration..."
    
    # Check if password is set
    if [ -z "$DB_PASSWORD" ]; then
        print_error "DB_PASSWORD environment variable is required"
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-migrate}" in
        "migrate")
            # Create database if needed
            create_database
            
            # Check connection
            check_db_connection || exit 1
            
            # Create migrations table
            create_migrations_table
            
            # Create backup
            backup_database
            
            # Run migrations
            print_status "Running migrations..."
            migration_files=$(get_migration_files)
            migration_count=0
            
            for migration_file in $migration_files; do
                if run_migration "$migration_file"; then
                    ((migration_count++))
                else
                    print_error "Migration failed. Stopping."
                    exit 1
                fi
            done
            
            print_success "$migration_count migrations applied successfully"
            
            # Run seeds
            if [ "${2:-}" != "--no-seed" ]; then
                print_status "Running seeds..."
                seed_files=$(get_seed_files)
                seed_count=0
                
                for seed_file in $seed_files; do
                    if run_seed "$seed_file"; then
                        ((seed_count++))
                    else
                        print_error "Seed failed. Stopping."
                        exit 1
                    fi
                done
                
                print_success "$seed_count seeds applied successfully"
            fi
            
            print_success "Migration completed successfully!"
            ;;
            
        "seed")
            # Check connection
            check_db_connection || exit 1
            
            # Run seeds only
            print_status "Running seeds..."
            seed_files=$(get_seed_files)
            seed_count=0
            
            for seed_file in $seed_files; do
                if run_seed "$seed_file"; then
                    ((seed_count++))
                else
                    print_error "Seed failed. Stopping."
                    exit 1
                fi
            done
            
            print_success "$seed_count seeds applied successfully"
            ;;
            
        "rollback")
            if [ -z "$2" ]; then
                print_error "Migration name is required for rollback"
                exit 1
            fi
            
            # Check connection
            check_db_connection || exit 1
            
            rollback_migration "$2"
            ;;
            
        "status")
            # Check connection
            check_db_connection || exit 1
            
            show_status
            ;;
            
        "reset")
            # Check connection
            check_db_connection || exit 1
            
            reset_database
            ;;
            
        "backup")
            backup_database
            ;;
            
        "help"|"-h"|"--help")
            echo "Noor Al-Ilm Database Migration Tool"
            echo ""
            echo "Usage: $0 [COMMAND] [OPTIONS]"
            echo ""
            echo "Commands:"
            echo "  migrate [--no-seed]    Run all migrations and optionally seeds"
            echo "  seed                   Run all seed files"
            echo "  rollback <migration>   Rollback a specific migration"
            echo "  status                 Show migration status"
            echo "  reset                  Reset database (drops and recreates)"
            echo "  backup                 Create database backup"
            echo "  help                   Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DB_NAME        Database name (default: noor_ilm)"
            echo "  DB_USER        Database user (default: postgres)"
            echo "  DB_HOST        Database host (default: localhost)"
            echo "  DB_PORT        Database port (default: 5432)"
            echo "  DB_PASSWORD    Database password (required)"
            echo "  MIGRATIONS_DIR  Migrations directory (default: ./migrations)"
            echo "  SEEDS_DIR      Seeds directory (default: ./seeds)"
            echo "  BACKUP_DIR     Backup directory (default: ./backups)"
            echo ""
            echo "Examples:"
            echo "  $0 migrate                    # Run migrations and seeds"
            echo "  $0 migrate --no-seed           # Run migrations only"
            echo "  $0 seed                       # Run seeds only"
            echo "  $0 rollback 001_initial_schema # Rollback specific migration"
            echo "  $0 status                     # Show migration status"
            echo "  DB_PASSWORD=pass $0 migrate    # Run with password"
            ;;
            
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
