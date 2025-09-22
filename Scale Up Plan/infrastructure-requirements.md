# Infrastructure Requirements: DevOps & Hosting Specifications

## Executive Summary

**Lead**: Raj Patel (DevOps Engineer) + Sarah Chen (Solution Architect)  
**Timeline**: 14 weeks  
**Goal**: Production-ready, scalable infrastructure for multi-tenant SaaS platform

---

## Current Infrastructure Assessment

### Existing Setup
- **Deployment**: Docker Compose (Development only)
- **Database**: SQLite file-based
- **Monitoring**: Basic console logging
- **Security**: No enterprise security measures
- **Scaling**: Single server, no horizontal scaling

### Critical Gaps
1. **No Production Environment**: Only development setup
2. **Database Limitations**: SQLite cannot handle production load
3. **No Monitoring**: No observability or alerting
4. **Security Vulnerabilities**: Missing enterprise security features
5. **No Backup Strategy**: No disaster recovery plan

---

## Target Infrastructure Architecture

### Cloud-Native Multi-Tenant Infrastructure
```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                           │
├─────────────────────────────────────────────────────────────┤
│  CloudFront CDN  │  Route 53  │  WAF  │  Certificate Manager │
├─────────────────────────────────────────────────────────────┤
│  Application Load Balancer (ALB)  │  Network Load Balancer │
├─────────────────────────────────────────────────────────────┤
│  EKS Cluster (Kubernetes)  │  Auto Scaling Groups         │
├─────────────────────────────────────────────────────────────┤
│  RDS PostgreSQL (Multi-AZ)  │  ElastiCache Redis          │
├─────────────────────────────────────────────────────────────┤
│  S3 Storage  │  Secrets Manager  │  CloudWatch  │  SNS     │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation Infrastructure (Weeks 1-4)

### Week 1-2: Database Infrastructure

#### PostgreSQL RDS Setup
```yaml
# Terraform configuration for RDS
resource "aws_db_instance" "boom_booking_db" {
  identifier = "boom-booking-prod"
  engine     = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  allocated_storage = 100
  max_allocated_storage = 1000
  storage_type = "gp3"
  storage_encrypted = true
  
  # Multi-AZ for high availability
  multi_az = true
  backup_retention_period = 7
  backup_window = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"
  
  # Security
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name = aws_db_subnet_group.main.name
  publicly_accessible = false
  
  # Performance
  performance_insights_enabled = true
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn
  
  # Backup
  delete_automated_backups = false
  skip_final_snapshot = false
  final_snapshot_identifier = "boom-booking-final-snapshot"
  
  tags = {
    Name = "Boom Booking Database"
    Environment = "production"
  }
}
```

#### Database Security Configuration
```sql
-- Row-level security setup
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_bookings_isolation ON bookings
  FOR ALL TO app_user
  USING (tenant_id = current_tenant_id());

-- Connection pooling with PgBouncer
-- pgbouncer.ini configuration
[databases]
boom_booking = host=boom-booking-prod.xyz.us-east-1.rds.amazonaws.com port=5432 dbname=boom_booking

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
max_db_connections = 100
```

### Week 3-4: Kubernetes Cluster Setup

#### EKS Cluster Configuration
```yaml
# EKS cluster with managed node groups
resource "aws_eks_cluster" "boom_booking" {
  name     = "boom-booking-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id,
      aws_subnet.private_3.id
    ]
    endpoint_private_access = true
    endpoint_public_access = true
    public_access_cidrs = ["0.0.0.0/0"]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_AmazonEKSClusterPolicy,
    aws_cloudwatch_log_group.eks_cluster
  ]
}

# Managed node group
resource "aws_eks_node_group" "boom_booking" {
  cluster_name    = aws_eks_cluster.boom_booking.name
  node_group_name = "boom-booking-nodes"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  capacity_type  = "ON_DEMAND"
  instance_types = ["t3.medium", "t3.large"]

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 2
  }

  update_config {
    max_unavailable_percentage = 25
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_group_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_node_group_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks_node_group_AmazonEC2ContainerRegistryReadOnly
  ]
}
```

---

## Phase 2: Application Infrastructure (Weeks 5-8)

### Week 5-6: Container Orchestration

#### Docker Image Optimization
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

# Security hardening
RUN apk add --no-cache dumb-init
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

#### Kubernetes Deployment Manifests
```yaml
# API service deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: boom-booking-api
  namespace: boom-booking
spec:
  replicas: 5
  selector:
    matchLabels:
      app: boom-booking-api
  template:
    metadata:
      labels:
        app: boom-booking-api
    spec:
      containers:
      - name: api
        image: boom-booking/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

### Week 7-8: Caching & CDN Setup

#### Redis ElastiCache Configuration
```yaml
# Redis cluster for caching and session storage
resource "aws_elasticache_replication_group" "boom_booking_redis" {
  replication_group_id = "boom-booking-redis"
  description = "Redis cluster for Boom Booking"
  
  node_type = "cache.t3.micro"
  port = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_clusters = 2
  automatic_failover_enabled = true
  multi_az_enabled = true
  
  # Security
  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name = aws_elasticache_subnet_group.main.name
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  # Backup
  snapshot_retention_limit = 5
  snapshot_window = "03:00-05:00"
  
  tags = {
    Name = "Boom Booking Redis"
    Environment = "production"
  }
}
```

#### CloudFront CDN Setup
```yaml
# CloudFront distribution for global content delivery
resource "aws_cloudfront_distribution" "boom_booking" {
  origin {
    domain_name = aws_lb.boom_booking.dns_name
    origin_id = "boom-booking-alb"
    
    custom_origin_config {
      http_port = 80
      https_port = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols = ["TLSv1.2"]
    }
  }

  enabled = true
  is_ipv6_enabled = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = "boom-booking-alb"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl = 0
    default_ttl = 3600
    max_ttl = 86400
  }

  # Cache behavior for API calls
  ordered_cache_behavior {
    path_pattern = "/api/*"
    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = "boom-booking-alb"

    forwarded_values {
      query_string = true
      headers = ["Authorization", "X-Tenant-ID"]
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl = 0
    default_ttl = 0
    max_ttl = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

---

## Phase 3: Monitoring & Security (Weeks 9-12)

### Week 9-10: Observability Stack

#### Prometheus & Grafana Setup
```yaml
# Prometheus configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "alert_rules.yml"
    
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093

---
# Grafana dashboard configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: monitoring
data:
  boom-booking-dashboard.json: |
    {
      "dashboard": {
        "title": "Boom Booking - Application Metrics",
        "panels": [
          {
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total[5m])",
                "legendFormat": "{{method}} {{route}}"
              }
            ]
          },
          {
            "title": "Response Time",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "95th percentile"
              }
            ]
          }
        ]
      }
    }
```

#### Application Monitoring
```javascript
// Custom metrics collection
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['tenant_id']
});

// Middleware for metrics collection
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### Week 11-12: Security Infrastructure

#### WAF Configuration
```yaml
# AWS WAF configuration
resource "aws_wafv2_web_acl" "boom_booking" {
  name  = "boom-booking-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # SQL injection protection
  rule {
    name     = "SQLInjectionRule"
    priority = 2

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionRule"
      sampled_requests_enabled   = true
    }
  }

  # XSS protection
  rule {
    name     = "XSSRule"
    priority = 3

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "XSSRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "BoomBookingWAF"
    sampled_requests_enabled   = true
  }
}
```

#### Secrets Management
```yaml
# AWS Secrets Manager integration
apiVersion: v1
kind: Secret
metadata:
  name: boom-booking-secrets
  namespace: boom-booking
type: Opaque
data:
  database-url: <base64-encoded-db-url>
  redis-url: <base64-encoded-redis-url>
  jwt-secret: <base64-encoded-jwt-secret>
  stripe-secret: <base64-encoded-stripe-secret>

---
# External secrets operator for automatic secret rotation
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: boom-booking
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        secretRef:
          accessKeyID:
            name: aws-credentials
            key: access-key-id
          secretAccessKey:
            name: aws-credentials
            key: secret-access-key

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: boom-booking-external-secrets
  namespace: boom-booking
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: boom-booking-secrets
    creationPolicy: Owner
  data:
  - secretKey: database-url
    remoteRef:
      key: boom-booking/database
      property: url
  - secretKey: redis-url
    remoteRef:
      key: boom-booking/redis
      property: url
```

---

## Phase 4: Backup & Disaster Recovery (Weeks 13-14)

### Week 13: Backup Strategy

#### Database Backup Configuration
```bash
#!/bin/bash
# Automated database backup script

# Configuration
DB_HOST="boom-booking-prod.xyz.us-east-1.rds.amazonaws.com"
DB_NAME="boom_booking"
S3_BUCKET="boom-booking-backups"
BACKUP_RETENTION_DAYS=30

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="boom_booking_backup_${TIMESTAMP}.sql"

# Create database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --compress=9 \
  --file="/tmp/${BACKUP_FILE}"

# Upload to S3
aws s3 cp "/tmp/${BACKUP_FILE}" "s3://${S3_BUCKET}/database/${BACKUP_FILE}"

# Cleanup old backups
aws s3 ls "s3://${S3_BUCKET}/database/" | \
  awk '{print $4}' | \
  head -n -$BACKUP_RETENTION_DAYS | \
  xargs -I {} aws s3 rm "s3://${S3_BUCKET}/database/{}"

# Cleanup local file
rm "/tmp/${BACKUP_FILE}"

echo "Backup completed: ${BACKUP_FILE}"
```

#### Application Data Backup
```yaml
# Velero for Kubernetes backup
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: boom-booking-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  template:
    includedNamespaces:
    - boom-booking
    - monitoring
    storageLocation: default
    volumeSnapshotLocations:
    - default
    ttl: 720h  # 30 days
```

### Week 14: Disaster Recovery

#### Multi-Region Setup
```yaml
# Cross-region replication for RDS
resource "aws_db_instance" "boom_booking_replica" {
  identifier = "boom-booking-replica"
  replicate_source_db = aws_db_instance.boom_booking.identifier
  instance_class = "db.t3.medium"
  
  # Replica configuration
  replicate_source_db = aws_db_instance.boom_booking.identifier
  availability_zone = "us-west-2a"
  
  # Security
  vpc_security_group_ids = [aws_security_group.rds_replica.id]
  publicly_accessible = false
  
  tags = {
    Name = "Boom Booking Database Replica"
    Environment = "production"
  }
}
```

#### Disaster Recovery Plan
```bash
#!/bin/bash
# Disaster recovery script

# Configuration
PRIMARY_REGION="us-east-1"
DR_REGION="us-west-2"
CLUSTER_NAME="boom-booking-cluster"

# Check primary region health
if ! kubectl --context=$PRIMARY_REGION get nodes | grep Ready; then
  echo "Primary region unhealthy, initiating failover..."
  
  # Update Route 53 to point to DR region
  aws route53 change-resource-record-sets \
    --hosted-zone-id Z1234567890 \
    --change-batch file://failover.json
  
  # Scale up DR region
  kubectl --context=$DR_REGION scale deployment boom-booking-api --replicas=10
  
  # Notify team
  aws sns publish \
    --topic-arn arn:aws:sns:us-west-2:123456789012:boom-booking-alerts \
    --message "Disaster recovery initiated - Primary region down"
fi
```

---

## Infrastructure Costs

### Monthly Cost Breakdown

#### Development Environment
- **EKS Cluster**: $75/month
- **RDS (db.t3.micro)**: $25/month
- **ElastiCache (cache.t3.micro)**: $15/month
- **S3 Storage**: $5/month
- **Total**: $120/month

#### Production Environment
- **EKS Cluster**: $200/month
- **RDS (db.t3.medium, Multi-AZ)**: $150/month
- **ElastiCache (cache.t3.medium)**: $80/month
- **CloudFront**: $50/month
- **S3 Storage**: $20/month
- **WAF**: $30/month
- **Monitoring**: $100/month
- **Total**: $630/month

#### Staging Environment
- **EKS Cluster**: $100/month
- **RDS (db.t3.small)**: $50/month
- **ElastiCache (cache.t3.small)**: $30/month
- **S3 Storage**: $10/month
- **Total**: $190/month

**Total Monthly Infrastructure Cost**: $940/month

---

## Performance Targets

### Infrastructure Performance Goals
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 50ms average
- **Page Load Time**: < 2 seconds
- **Uptime**: 99.9% SLA
- **Auto-scaling**: Scale within 2 minutes

### Capacity Planning
- **Concurrent Users**: 10,000+
- **Requests per Second**: 1,000+
- **Database Connections**: 500+
- **Storage Growth**: 100GB/month
- **Bandwidth**: 1TB/month

---

## Security Compliance

### Security Standards
- **SOC 2 Type II**: Security controls and audit trails
- **GDPR**: Data protection and privacy compliance
- **ISO 27001**: Information security management
- **PCI DSS**: Payment card data security (if applicable)

### Security Controls
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: RBAC with least privilege
- **Monitoring**: 24/7 security monitoring
- **Vulnerability Scanning**: Daily automated scans
- **Penetration Testing**: Quarterly security assessments

---

## Monitoring & Alerting

### Key Metrics
- **Application**: Response time, error rate, throughput
- **Infrastructure**: CPU, memory, disk, network
- **Database**: Connection count, query performance, replication lag
- **Security**: Failed logins, suspicious activity, WAF blocks

### Alert Thresholds
- **High Error Rate**: > 5% for 5 minutes
- **High Response Time**: > 500ms for 5 minutes
- **High CPU Usage**: > 80% for 10 minutes
- **Database Connections**: > 80% of max connections
- **Disk Space**: > 85% full

---

## Conclusion

This infrastructure requirements document provides a comprehensive blueprint for building a production-ready, scalable SaaS platform. The phased approach ensures minimal risk while delivering enterprise-grade infrastructure capabilities.

**Key Infrastructure Principles:**
- **Scalability**: Auto-scaling from day one
- **Reliability**: 99.9% uptime SLA
- **Security**: Zero trust security model
- **Performance**: Sub-200ms response times
- **Cost Optimization**: Right-sized resources

**Success Metrics:**
- Support 10,000+ concurrent users
- Process 1,000+ requests per second
- Maintain 99.9% uptime
- Scale automatically based on demand
- Complete disaster recovery in < 4 hours

---

*This infrastructure requirements document provides the DevOps foundation for the SaaS transformation. Each phase builds upon the previous one, ensuring a smooth transition to a production-ready, scalable platform.*

