#!/bin/bash

# AWS Deployment Helper Script
# This script helps you deploy the Football Field Booking App to AWS

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="football-booking"
CLUSTER_NAME="${PROJECT_NAME}-cluster"
BACKEND_REPO="${PROJECT_NAME}-backend"
FRONTEND_REPO="${PROJECT_NAME}-frontend"

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    else
        print_success "Docker installed"
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        missing_tools+=("aws cli")
    else
        print_success "AWS CLI installed"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    else
        print_success "Git installed"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("node.js")
    else
        print_success "Node.js installed"
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing tools: ${missing_tools[*]}"
        return 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-calling-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        return 1
    fi
    print_success "AWS credentials configured"
    
    return 0
}

# Get AWS Account ID
get_account_id() {
    aws sts get-caller-identity --query Account --output text
}

# Create ECR repositories
create_ecr_repos() {
    print_header "Creating ECR Repositories"
    
    local account_id=$(get_account_id)
    
    # Backend repository
    if aws ecr describe-repositories --repository-names "$BACKEND_REPO" --region "$AWS_REGION" &> /dev/null; then
        print_warning "Backend ECR repository already exists"
    else
        print_success "Creating backend repository..."
        aws ecr create-repository \
            --repository-name "$BACKEND_REPO" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true
        print_success "Backend repository created"
    fi
    
    # Frontend repository
    if aws ecr describe-repositories --repository-names "$FRONTEND_REPO" --region "$AWS_REGION" &> /dev/null; then
        print_warning "Frontend ECR repository already exists"
    else
        print_success "Creating frontend repository..."
        aws ecr create-repository \
            --repository-name "$FRONTEND_REPO" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true
        print_success "Frontend repository created"
    fi
    
    echo "Backend Repository: $account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO"
    echo "Frontend Repository: $account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO"
}

# Build and push Docker images
build_and_push() {
    print_header "Building and Pushing Docker Images"
    
    local account_id=$(get_account_id)
    local image_tag="latest"
    local commit_hash=$(git rev-parse --short HEAD)
    
    # Login to ECR
    print_success "Logging in to ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build and push backend
    print_success "Building backend image..."
    docker build -t "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:$image_tag" \
                 -t "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:$commit_hash" \
                 ./backend
    
    print_success "Pushing backend image..."
    docker push "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:$image_tag"
    docker push "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_REPO:$commit_hash"
    
    # Build and push frontend
    print_success "Building frontend image..."
    docker build -t "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:$image_tag" \
                 -t "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:$commit_hash" \
                 ./frontend
    
    print_success "Pushing frontend image..."
    docker push "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:$image_tag"
    docker push "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO:$commit_hash"
    
    print_success "All images built and pushed successfully"
}

# Create ECS cluster
create_ecs_cluster() {
    print_header "Creating ECS Cluster"
    
    if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$AWS_REGION" --query 'clusters[0].clusterName' --output text &> /dev/null; then
        print_warning "ECS cluster already exists"
    else
        print_success "Creating ECS cluster..."
        aws ecs create-cluster \
            --cluster-name "$CLUSTER_NAME" \
            --region "$AWS_REGION" \
            --settings name=containerInsights,value=enabled
        
        print_success "ECS cluster created"
    fi
    
    # Create CloudWatch log group
    if aws logs describe-log-groups --log-group-name-prefix "/ecs/$PROJECT_NAME" --region "$AWS_REGION" --query 'logGroups[0].logGroupName' --output text &> /dev/null; then
        print_warning "CloudWatch log group already exists"
    else
        print_success "Creating CloudWatch log group..."
        aws logs create-log-group \
            --log-group-name "/ecs/$PROJECT_NAME" \
            --region "$AWS_REGION"
        
        aws logs put-retention-policy \
            --log-group-name "/ecs/$PROJECT_NAME" \
            --retention-in-days 7
        
        print_success "CloudWatch log group created"
    fi
}

# Show help
show_help() {
    cat <<EOF
Football Field Booking App - AWS Deployment Helper

Usage: ./deploy.sh [COMMAND] [OPTIONS]

Commands:
    check               Check all prerequisites
    create-repos        Create ECR repositories
    build               Build Docker images
    push                Push Docker images to ECR
    build-push          Build and push Docker images
    create-cluster      Create ECS cluster
    full-setup          Run all setup steps (check, create repos, build, push, create cluster)
    help                Show this help message

Environment Variables:
    AWS_REGION          AWS region (default: us-east-1)

Examples:
    ./deploy.sh check
    ./deploy.sh full-setup
    AWS_REGION=eu-west-1 ./deploy.sh build-push

EOF
}

# Main script
main() {
    local command=${1:-help}
    
    case "$command" in
        check)
            check_prerequisites
            ;;
        create-repos)
            check_prerequisites && create_ecr_repos
            ;;
        build)
            check_prerequisites && build_and_push | grep -E "Building|built"
            ;;
        push)
            check_prerequisites && build_and_push | grep -E "Pushing|pushed"
            ;;
        build-push)
            check_prerequisites && build_and_push
            ;;
        create-cluster)
            check_prerequisites && create_ecs_cluster
            ;;
        full-setup)
            check_prerequisites && \
            create_ecr_repos && \
            build_and_push && \
            create_ecs_cluster && \
            print_success "AWS setup completed successfully!"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
