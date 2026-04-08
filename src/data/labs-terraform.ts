import type { Lab, CodeStep } from "./labs";

export const terraformLabs: Lab[] = [
  {
    id: "tf-vpc-subnets",
    name: "AWS VPC with Subnets",
    category: "Terraform",
    mode: "Terraform Lab",
    objective: "Create an AWS VPC with public and private subnets, internet gateway, and route tables using Terraform.",
    steps: [
      {
        code: `# main.tf — AWS VPC Infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5"
}

provider "aws" {
  region = var.aws_region
}

# --- VPC ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.project}-vpc"
    Environment = var.environment
  }
}

# --- Internet Gateway ---
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.project}-igw"
  }
}

# --- Public Subnet ---
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "\${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project}-public-subnet"
    Tier = "Public"
  }
}

# --- Private Subnet ---
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "\${var.aws_region}b"

  tags = {
    Name = "\${var.project}-private-subnet"
    Tier = "Private"
  }
}

# --- Public Route Table ---
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "\${var.project}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# --- NAT Gateway for Private Subnet ---
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "\${var.project}-nat-gw"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "\${var.project}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # aws_vpc.main will be created",
          "  + resource \"aws_vpc\" \"main\" {",
          "      + cidr_block           = \"10.0.0.0/16\"",
          "      + enable_dns_hostnames = true",
          "      + enable_dns_support   = true",
          "      + id                   = (known after apply)",
          "    }",
          "",
          "  # aws_internet_gateway.main will be created",
          "  + resource \"aws_internet_gateway\" \"main\" {",
          "      + vpc_id = (known after apply)",
          "    }",
          "",
          "  # aws_subnet.public will be created",
          "  + resource \"aws_subnet\" \"public\" {",
          "      + cidr_block              = \"10.0.1.0/24\"",
          "      + map_public_ip_on_launch = true",
          "    }",
          "",
          "  # aws_subnet.private will be created",
          "  + resource \"aws_subnet\" \"private\" {",
          "      + cidr_block = \"10.0.2.0/24\"",
          "    }",
          "",
          "  # aws_nat_gateway.main will be created",
          "  + resource \"aws_nat_gateway\" \"main\" {",
          "      + allocation_id = (known after apply)",
          "      + subnet_id    = (known after apply)",
          "    }",
          "",
          "Plan: 9 to add, 0 to change, 0 to destroy.",
        ],
        explanation: "This creates a complete VPC infrastructure with public/private subnet separation, internet access via IGW, and outbound-only access for private resources via NAT Gateway.",
      },
    ] as CodeStep[],
    validations: [
      { label: "VPC with DNS support created", pass: true },
      { label: "Public subnet with auto-assign public IP", pass: true },
      { label: "Private subnet without public IP", pass: true },
      { label: "Route tables correctly associated", pass: true },
      { label: "NAT Gateway for private subnet egress", pass: true },
    ],
    explanation: "A well-architected VPC separates resources into public subnets (internet-facing, via IGW) and private subnets (outbound-only via NAT Gateway). The NAT Gateway lives in the public subnet and provides outbound internet access for private resources. Route table associations control which subnets use which gateway.",
    hints: [
      "Public subnets route 0.0.0.0/0 to the Internet Gateway",
      "Private subnets route 0.0.0.0/0 to the NAT Gateway",
      "The NAT Gateway itself must be in a public subnet",
    ],
    logs: [
      "[TF] Initializing AWS provider v5.x",
      "[TF] Planning: 9 resources to create",
      "[TF] aws_vpc.main: Creating...",
      "[TF] aws_internet_gateway.main: Creating...",
      "[TF] aws_subnet.public: Creating (10.0.1.0/24)",
      "[TF] aws_subnet.private: Creating (10.0.2.0/24)",
      "[TF] aws_nat_gateway.main: Creating (takes ~2min)...",
      "[TF] Apply complete! 9 resources added.",
    ],
  },
  {
    id: "tf-ec2-deployment",
    name: "EC2 Instance with User Data",
    category: "Terraform",
    mode: "Terraform Lab",
    objective: "Deploy an EC2 instance with a security group, key pair, and user data bootstrap script.",
    steps: [
      {
        code: `# ec2.tf — Web Server Deployment

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "web" {
  name_prefix = "web-sg-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-server-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = var.key_pair_name

  user_data = <<-EOF
    #!/bin/bash
    dnf update -y
    dnf install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Terraform!</h1>" > /var/www/html/index.html
  EOF

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }

  tags = {
    Name = "web-server"
  }
}

output "public_ip" {
  value = aws_instance.web.public_ip
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # aws_security_group.web will be created",
          "  + resource \"aws_security_group\" \"web\" {",
          "      + name_prefix = \"web-sg-\"",
          "      + ingress: HTTP(80), HTTPS(443), SSH(22)",
          "      + egress: all traffic",
          "    }",
          "",
          "  # aws_instance.web will be created",
          "  + resource \"aws_instance\" \"web\" {",
          "      + ami           = \"ami-0abcdef1234567890\"",
          "      + instance_type = \"t3.micro\"",
          "      + user_data     = (bootstrap script)",
          "      + public_ip     = (known after apply)",
          "    }",
          "",
          "Plan: 2 to add, 0 to change, 0 to destroy.",
          "",
          "Apply complete! Resources: 2 added.",
          "",
          "Outputs:",
          "  public_ip = \"54.123.45.67\"",
        ],
        explanation: "This deploys an EC2 instance with best practices: encrypted root volume, IMDSv2 required, security group with least-privilege SSH access, and user data to bootstrap Apache.",
      },
    ] as CodeStep[],
    validations: [
      { label: "Latest Amazon Linux AMI resolved", pass: true },
      { label: "Security group with least-privilege rules", pass: true },
      { label: "EC2 instance with user data bootstrap", pass: true },
      { label: "Root volume encrypted with gp3", pass: true },
      { label: "IMDSv2 enforced (http_tokens required)", pass: true },
    ],
    explanation: "The `data` block dynamically fetches the latest AMI. Security groups use `name_prefix` with `create_before_destroy` to avoid downtime during updates. IMDSv2 (`http_tokens = required`) prevents SSRF attacks against the metadata service. User data runs on first boot to install and configure the web server.",
    hints: [
      "Use data sources for AMIs — hardcoded IDs become stale",
      "Always encrypt root volumes in production",
      "IMDSv2 (http_tokens = required) is an AWS security best practice",
    ],
    logs: [
      "[TF] data.aws_ami.amazon_linux: Resolving latest AL2023...",
      "[TF] aws_security_group.web: Creating with HTTP/HTTPS/SSH rules",
      "[TF] aws_instance.web: Launching t3.micro...",
      "[TF] aws_instance.web: User data script attached",
      "[TF] Apply complete! Public IP: 54.123.45.67",
    ],
  },
  {
    id: "tf-s3-policy",
    name: "S3 Bucket with Policies",
    category: "Terraform",
    mode: "Terraform Lab",
    objective: "Create an S3 bucket with versioning, encryption, lifecycle rules, and a restrictive bucket policy.",
    steps: [
      {
        code: `# s3.tf — Secure S3 Bucket

resource "aws_s3_bucket" "data" {
  bucket = "\${var.project}-data-\${var.environment}"

  tags = {
    Name        = "\${var.project}-data"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceTLS"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.data.arn,
          "\${aws_s3_bucket.data.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # aws_s3_bucket.data will be created",
          "  + resource \"aws_s3_bucket\" \"data\" {",
          "      + bucket = \"myproject-data-prod\"",
          "    }",
          "",
          "  # aws_s3_bucket_versioning.data will be created",
          "  + versioning_configuration { status = \"Enabled\" }",
          "",
          "  # aws_s3_bucket_server_side_encryption_configuration.data",
          "  + SSE algorithm: aws:kms (bucket key enabled)",
          "",
          "  # aws_s3_bucket_public_access_block.data",
          "  + All public access blocked",
          "",
          "  # aws_s3_bucket_lifecycle_configuration.data",
          "  + Glacier after 30 days, expire after 365 days",
          "",
          "  # aws_s3_bucket_policy.data",
          "  + Deny non-TLS access",
          "",
          "Plan: 6 to add, 0 to change, 0 to destroy.",
        ],
        explanation: "This creates a hardened S3 bucket following AWS security best practices: KMS encryption, public access fully blocked, TLS enforced via bucket policy, versioning for data protection, and lifecycle rules for cost optimization.",
      },
    ] as CodeStep[],
    validations: [
      { label: "Versioning enabled", pass: true },
      { label: "KMS server-side encryption configured", pass: true },
      { label: "All public access blocked", pass: true },
      { label: "TLS enforced via bucket policy", pass: true },
      { label: "Lifecycle rules for archival and cleanup", pass: true },
    ],
    explanation: "Modern Terraform S3 configuration uses separate resources for each bucket feature (versioning, encryption, lifecycle) rather than inline blocks. The public access block prevents accidental exposure. The bucket policy enforces TLS for all operations. Lifecycle rules transition old versions to Glacier and clean up incomplete uploads to reduce costs.",
    hints: [
      "Each S3 feature is a separate resource in Terraform AWS provider v4+",
      "Always block public access and enforce TLS via bucket policy",
      "Lifecycle rules on noncurrent versions save costs with versioning enabled",
    ],
    logs: [
      "[TF] aws_s3_bucket.data: Creating...",
      "[TF] Versioning: Enabled",
      "[TF] Encryption: KMS with bucket key",
      "[TF] Public access: All blocked",
      "[TF] Lifecycle: Glacier@30d, expire@365d",
      "[TF] Bucket policy: TLS enforced",
      "[TF] Apply complete! 6 resources added.",
    ],
  },
  {
    id: "tf-rds-database",
    name: "RDS Database",
    category: "Terraform",
    mode: "Terraform Lab",
    objective: "Deploy a PostgreSQL RDS instance with multi-AZ, encryption, and automated backups.",
    steps: [
      {
        code: `# rds.tf — PostgreSQL Database

resource "aws_db_subnet_group" "main" {
  name       = "\${var.project}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "\${var.project}-db-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from app servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = {
    Name = "rds-sg"
  }
}

resource "aws_db_instance" "main" {
  identifier = "\${var.project}-postgres"

  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t3.medium"
  allocated_storage    = 50
  max_allocated_storage = 200

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = true

  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection      = true
  skip_final_snapshot      = false
  final_snapshot_identifier = "\${var.project}-final-snapshot"

  performance_insights_enabled = true

  tags = {
    Name = "\${var.project}-postgres"
  }
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # aws_db_subnet_group.main will be created",
          "  + resource \"aws_db_subnet_group\" \"main\" {",
          "      + subnet_ids = [\"subnet-abc\", \"subnet-def\"]",
          "    }",
          "",
          "  # aws_security_group.rds will be created",
          "  + ingress: PostgreSQL(5432) from web-sg only",
          "",
          "  # aws_db_instance.main will be created",
          "  + resource \"aws_db_instance\" \"main\" {",
          "      + engine         = \"postgres\" (16.1)",
          "      + instance_class = \"db.t3.medium\"",
          "      + multi_az       = true",
          "      + encrypted      = true (KMS)",
          "      + backup_retention = 7 days",
          "      + deletion_protection = true",
          "    }",
          "",
          "Plan: 3 to add, 0 to change, 0 to destroy.",
          "",
          "Apply complete! (Note: RDS creation takes 5-10 minutes)",
          "",
          "Outputs:",
          "  rds_endpoint = \"myproject-postgres.abc123.us-east-1.rds.amazonaws.com:5432\"",
        ],
        explanation: "This creates a production-ready RDS PostgreSQL instance with multi-AZ for high availability, KMS encryption, automated backups, and storage autoscaling.",
      },
    ] as CodeStep[],
    validations: [
      { label: "DB subnet group spans multiple AZs", pass: true },
      { label: "Security group restricts to app servers only", pass: true },
      { label: "Multi-AZ enabled for HA", pass: true },
      { label: "Storage encryption with KMS", pass: true },
      { label: "Deletion protection enabled", pass: true },
      { label: "Automated backups configured", pass: true },
    ],
    explanation: "Production RDS deployments need: multi-AZ for automatic failover, KMS encryption at rest, security groups limiting access to app servers only, automated backups with sufficient retention, storage autoscaling, deletion protection, and Performance Insights for monitoring. Never skip final snapshot in production.",
    hints: [
      "Multi-AZ creates a standby in a different AZ for automatic failover",
      "Security group references allow access by resource, not CIDR — more secure",
      "Use max_allocated_storage for autoscaling without Terraform changes",
    ],
    logs: [
      "[TF] aws_db_subnet_group.main: Creating across 2 AZs",
      "[TF] aws_security_group.rds: Port 5432 from web-sg only",
      "[TF] aws_db_instance.main: Creating (multi-AZ, encrypted)...",
      "[TF] Waiting for RDS instance to become available...",
      "[TF] Apply complete! Endpoint: ...rds.amazonaws.com:5432",
    ],
  },
  {
    id: "tf-alb",
    name: "Application Load Balancer",
    category: "Terraform",
    mode: "Terraform Lab",
    objective: "Create an ALB with target groups, health checks, and HTTPS listener with ACM certificate.",
    steps: [
      {
        code: `# alb.tf — Application Load Balancer

resource "aws_lb" "main" {
  name               = "\${var.project}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  enable_deletion_protection = true
  drop_invalid_header_fields = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = {
    Name = "\${var.project}-alb"
  }
}

resource "aws_lb_target_group" "web" {
  name        = "\${var.project}-web-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    timeout             = 5
    unhealthy_threshold = 3
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 3600
    enabled         = true
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # aws_lb.main will be created",
          "  + resource \"aws_lb\" \"main\" {",
          "      + name     = \"myproject-alb\"",
          "      + internal = false",
          "      + type     = \"application\"",
          "      + subnets  = [public_a, public_b]",
          "    }",
          "",
          "  # aws_lb_target_group.web — /health check, 200 OK",
          "",
          "  # aws_lb_listener.https — 443 with TLS 1.3",
          "",
          "  # aws_lb_listener.http_redirect — 80 → 443 (301)",
          "",
          "Plan: 4 to add, 0 to change, 0 to destroy.",
          "",
          "Apply complete!",
          "  dns_name = \"myproject-alb-123456.us-east-1.elb.amazonaws.com\"",
        ],
        explanation: "This creates an internet-facing ALB with HTTPS termination, HTTP→HTTPS redirect, health checks, session stickiness, and access logging.",
      },
    ] as CodeStep[],
    validations: [
      { label: "ALB spans multiple availability zones", pass: true },
      { label: "HTTPS listener with TLS 1.3 policy", pass: true },
      { label: "HTTP to HTTPS redirect configured", pass: true },
      { label: "Health check on /health endpoint", pass: true },
      { label: "Access logs enabled to S3", pass: true },
    ],
    explanation: "An ALB distributes traffic across targets with layer 7 routing. Best practices: enforce HTTPS with automatic HTTP redirect, use modern TLS policy (TLS 1.3), configure proper health checks, enable access logging to S3, and drop invalid headers to prevent HTTP request smuggling.",
    hints: [
      "Use TLS 1.3 policy for best security — older clients may need TLS 1.2",
      "Health checks should hit a lightweight endpoint, not the homepage",
      "drop_invalid_header_fields prevents HTTP request smuggling attacks",
    ],
    logs: [
      "[TF] aws_lb.main: Creating ALB (internet-facing)...",
      "[TF] aws_lb_target_group.web: Health check on /health",
      "[TF] aws_lb_listener.https: TLS 1.3, ACM cert attached",
      "[TF] aws_lb_listener.http_redirect: 80 → 443 (301)",
      "[TF] Apply complete! DNS: ...elb.amazonaws.com",
    ],
  },
];
