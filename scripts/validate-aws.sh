#!/bin/bash

# AWS Infrastructure Validation Script
# Validates that all required AWS resources are properly configured

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="football-booking"
CLUSTER_NAME="${PROJECT_NAME}-cluster"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

# Check AWS credentials
check_aws_credentials() {
    print_header "AWS Credentials"
    
    if aws sts get-caller-identity &> /dev/null; then
        local account_id=$(aws sts get-caller-identity --query Account --output text)
        check_pass "AWS credentials configured (Account: $account_id)"
    else
        check_fail "AWS credentials not configured"
    fi
}

# Check ECS Cluster
check_ecs_cluster() {
    print_header "ECS Cluster"
    
    if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$AWS_REGION" --query 'clusters[0].clusterName' --output text &> /dev/null; then
        check_pass "ECS cluster exists: $CLUSTER_NAME"
    else
        check_fail "ECS cluster not found: $CLUSTER_NAME"
        return 1
    fi
    
    # Check cluster status
    local status=$(aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$AWS_REGION" --query 'clusters[0].status' --output text)
    if [ "$status" = "ACTIVE" ]; then
        check_pass "ECS cluster is ACTIVE"
    else
        check_fail "ECS cluster status is $status (expected ACTIVE)"
    fi
}

# Check ECS Services
check_ecs_services() {
    print_header "ECS Services"
    
    local services=$(aws ecs list-services --cluster "$CLUSTER_NAME" --region "$AWS_REGION" --query 'serviceArns' --output text)
    
    if [ -z "$services" ]; then
        check_warn "No ECS services found in cluster"
        return
    fi
    
    for service_arn in $services; do
        local service_name=$(echo "$service_arn" | awk -F/ '{print $NF}')
        local status=$(aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$service_name" --region "$AWS_REGION" --query 'services[0].status' --output text)
        
        if [ "$status" = "ACTIVE" ]; then
            check_pass "Service is ACTIVE: $service_name"
        else
            check_fail "Service status is $status: $service_name"
        fi
    done
}

# Check RDS Database
check_rds_database() {
    print_header "RDS Database"
    
    local db_instances=$(aws rds describe-db-instances --region "$AWS_REGION" --query 'DBInstances[].DBInstanceIdentifier' --output text)
    
    if [ -z "$db_instances" ]; then
        check_warn "No RDS instances found"
        return
    fi
    
    for db_instance in $db_instances; do
        local status=$(aws rds describe-db-instances --db-instance-identifier "$db_instance" --region "$AWS_REGION" --query 'DBInstances[0].DBInstanceStatus' --output text)
        
        if [ "$status" = "available" ]; then
            check_pass "RDS instance is available: $db_instance"
        else
            check_fail "RDS instance status is $status: $db_instance"
        fi
    done
}

# Check CloudWatch Logs
check_cloudwatch_logs() {
    print_header "CloudWatch Logs"
    
    local log_group="/ecs/$PROJECT_NAME"
    
    if aws logs describe-log-groups --log-group-name-prefix "$log_group" --region "$AWS_REGION" --query "logGroups[?logGroupName=='$log_group'].logGroupName" --output text &> /dev/null; then
        check_pass "CloudWatch log group exists: $log_group"
        
        # Check for recent logs
        local log_events=$(aws logs describe-log-streams --log-group-name "$log_group" --order-by LastEventTime --descending --region "$AWS_REGION" --query 'logStreams[0].lastEventTimestamp' --output text)
        
        if [ -n "$log_events" ] && [ "$log_events" != "None" ]; then
            check_pass "Recent logs found in log group"
        else
            check_warn "No recent logs found (application may not be running)"
        fi
    else
        check_fail "CloudWatch log group not found: $log_group"
    fi
}

# Check ECR Repositories
check_ecr_repos() {
    print_header "ECR Repositories"
    
    local repos=$(aws ecr describe-repositories --region "$AWS_REGION" --query 'repositories[].repositoryName' --output text)
    
    if [ -z "$repos" ]; then
        check_warn "No ECR repositories found"
        return
    fi
    
    for repo in $repos; do
        local image_count=$(aws ecr describe-images --repository-name "$repo" --region "$AWS_REGION" --query 'imageDetails | length(@)' --output text)
        check_pass "ECR repository has $image_count images: $repo"
    done
}

# Check Load Balancers
check_load_balancers() {
    print_header "Load Balancers"
    
    local albs=$(aws elbv2 describe-load-balancers --region "$AWS_REGION" --query 'LoadBalancers[].LoadBalancerArn' --output text)
    
    if [ -z "$albs" ]; then
        check_warn "No Application Load Balancers found"
        return
    fi
    
    for alb_arn in $albs; do
        local alb_name=$(echo "$alb_arn" | awk -F: '{print $NF}' | awk -F/ '{print $NF}')
        local state=$(aws elbv2 describe-load-balancers --load-balancer-arns "$alb_arn" --region "$AWS_REGION" --query 'LoadBalancers[0].State.Code' --output text)
        
        if [ "$state" = "active" ]; then
            check_pass "Load Balancer is ACTIVE: $alb_name"
        else
            check_fail "Load Balancer state is $state: $alb_name"
        fi
    done
}

# Check Security Groups
check_security_groups() {
    print_header "Security Groups"
    
    local sgs=$(aws ec2 describe-security-groups --region "$AWS_REGION" --filters "Name=group-name,Values=*football*" --query 'SecurityGroups[].GroupId' --output text)
    
    if [ -z "$sgs" ]; then
        check_warn "No security groups found with 'football' in name"
        return
    fi
    
    for sg_id in $sgs; do
        check_pass "Security group exists: $sg_id"
    done
}

# Check IAM Roles
check_iam_roles() {
    print_header "IAM Roles"
    
    # Check ECS Task Execution Role
    if aws iam get-role --role-name ecsTaskExecutionRole &> /dev/null; then
        check_pass "ECS Task Execution Role exists"
    else
        check_fail "ECS Task Execution Role not found"
    fi
}

# Show summary
show_summary() {
    print_header "Validation Summary"
    
    echo "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
    echo "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
    echo "Warnings: ${YELLOW}$CHECKS_WARNING${NC}"
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ Infrastructure validation passed!${NC}\n"
        return 0
    else
        echo -e "\n${RED}✗ Some checks failed. Please address the issues above.${NC}\n"
        return 1
    fi
}

# Main
main() {
    echo -e "${BLUE}Football Field Booking App - AWS Infrastructure Validator${NC}"
    echo "Region: $AWS_REGION"
    
    check_aws_credentials
    check_ecs_cluster
    check_ecs_services
    check_rds_database
    check_cloudwatch_logs
    check_ecr_repos
    check_load_balancers
    check_security_groups
    check_iam_roles
    
    show_summary
}

main "$@"
