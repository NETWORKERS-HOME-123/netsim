import type { Lab, CodeStep } from "./labs";

export const cloudInfraLabs: Lab[] = [
  {
    id: "tf-firewall-rules", name: "Terraform Firewall Rules", category: "Cloud Infrastructure", mode: "Terraform Lab",
    objective: "Deploy AWS Security Groups and Network ACLs as infrastructure-as-code using Terraform.",
    steps: [
      {
        code: `resource "aws_security_group" "web_sg" {
  name        = "web-server-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from management subnet"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.100.0/24"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "web-server-sg"
    Environment = "production"
  }
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # aws_security_group.web_sg will be created",
          "  + resource \"aws_security_group\" \"web_sg\" {",
          "      + name   = \"web-server-sg\"",
          "      + vpc_id = \"vpc-0abc123def456\"",
          "      + ingress: 443/tcp from 0.0.0.0/0",
          "      + ingress: 80/tcp from 0.0.0.0/0",
          "      + ingress: 22/tcp from 10.0.100.0/24",
          "      + egress:  all to 0.0.0.0/0",
          "    }",
          "",
          "Plan: 1 to add, 0 to change, 0 to destroy."
        ],
        explanation: "Security Groups are stateful firewalls at the instance level. Define ingress/egress rules with protocol, port, and CIDR. Restrict SSH to management subnets only."
      },
      {
        code: `resource "aws_network_acl" "public_nacl" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = [aws_subnet.public.id]

  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    rule_no    = 120
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  ingress {
    rule_no    = 999
    protocol   = "-1"
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  egress {
    rule_no    = 100
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = { Name = "public-nacl" }
}`,
        output: [
          "  # aws_network_acl.public_nacl will be created",
          "  + resource \"aws_network_acl\" \"public_nacl\" {",
          "      + ingress 100: allow 443/tcp from 0.0.0.0/0",
          "      + ingress 110: allow 80/tcp from 0.0.0.0/0",
          "      + ingress 120: allow 1024-65535/tcp (ephemeral)",
          "      + ingress 999: deny all (explicit deny)",
          "      + egress  100: allow all outbound",
          "    }",
          "",
          "Plan: 2 to add, 0 to change, 0 to destroy.",
          "",
          "aws_security_group.web_sg: Creating...",
          "aws_security_group.web_sg: Created (sg-0abc123)",
          "aws_network_acl.public_nacl: Creating...",
          "aws_network_acl.public_nacl: Created (acl-0def456)",
          "",
          "Apply complete! Resources: 2 added."
        ],
        explanation: "NACLs are stateless subnet-level firewalls with explicit rule ordering. Include ephemeral port range (1024-65535) for return traffic since NACLs don't track state."
      },
    ] as CodeStep[],
    validations: [
      { label: "Security Group with least-privilege rules", pass: true },
      { label: "NACL with ordered rules and explicit deny", pass: true },
      { label: "Both resources applied successfully", pass: true },
    ],
    explanation: "AWS provides two firewall layers: Security Groups (stateful, instance-level) and NACLs (stateless, subnet-level). Security Groups allow return traffic automatically; NACLs require explicit ephemeral port rules.",
    hints: ["Security Groups are stateful — no return rules needed", "NACLs are stateless — add ephemeral ports for return traffic", "Always end NACLs with explicit deny"],
    logs: ["[PLAN] 2 resources to create", "[APPLY] sg-0abc123 created", "[APPLY] acl-0def456 created"],
  },
  {
    id: "tf-sdwan-policy", name: "SD-WAN Policy", category: "Cloud Infrastructure", mode: "Terraform Lab",
    objective: "Define application-aware SD-WAN routing policies with SLA classes and path selection using Terraform.",
    steps: [
      {
        code: `# SD-WAN SLA Class Definition
resource "sdwan_sla_class" "voice_sla" {
  name = "voice-sla"

  latency    = 150
  loss       = 1
  jitter     = 30

  fallback_best_tunnel {
    criteria = "jitter"
  }
}

resource "sdwan_sla_class" "data_sla" {
  name = "data-sla"

  latency    = 300
  loss       = 5
  jitter     = 100
}

# Application-Aware Routing Policy
resource "sdwan_app_route_policy" "main" {
  name        = "enterprise-app-routing"
  description = "Application-aware routing for enterprise traffic"

  sequence {
    name = "voice-traffic"
    match {
      dscp = [46]  # EF - Expedited Forwarding
    }
    action {
      sla_class     = sdwan_sla_class.voice_sla.id
      preferred_color = ["mpls", "biz-internet"]
    }
  }

  sequence {
    name = "business-critical"
    match {
      app_list = ["salesforce", "office365", "sap"]
    }
    action {
      sla_class     = sdwan_sla_class.data_sla.id
      preferred_color = ["mpls"]
    }
  }

  default_action {
    sla_class     = sdwan_sla_class.data_sla.id
    preferred_color = ["biz-internet", "lte"]
  }
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # sdwan_sla_class.voice_sla will be created",
          "  + SLA: voice-sla (latency≤150ms, loss≤1%, jitter≤30ms)",
          "",
          "  # sdwan_sla_class.data_sla will be created",
          "  + SLA: data-sla (latency≤300ms, loss≤5%, jitter≤100ms)",
          "",
          "  # sdwan_app_route_policy.main will be created",
          "  + Policy: enterprise-app-routing",
          "    Seq 1: voice (DSCP EF) → MPLS/biz-internet",
          "    Seq 2: business-critical → MPLS preferred",
          "    Default: biz-internet/LTE",
          "",
          "Plan: 3 to add."
        ],
        explanation: "SD-WAN policies route traffic based on application type and SLA requirements. Voice traffic requires strict latency/jitter guarantees over MPLS, while bulk data can use cheaper internet links."
      },
      {
        code: `# vSmart Policy for Centralized Control
resource "sdwan_control_policy" "hub_spoke" {
  name = "hub-spoke-topology"

  sequence {
    name = "direct-internet"
    match {
      site_list = ["branch-sites"]
      vpn_list  = ["vpn-10"]
    }
    action {
      type = "accept"
      set {
        service     = "DIA"  # Direct Internet Access
        next_hop    = "0.0.0.0"
      }
    }
  }

  sequence {
    name = "dc-traffic"
    match {
      site_list = ["branch-sites"]
      vpn_list  = ["vpn-20"]
    }
    action {
      type = "accept"
      set {
        tloc_list = ["dc-tlocs"]
      }
    }
  }
}

# Apply policy to vSmart
resource "sdwan_policy_definition" "active" {
  name    = "production-policy"
  type    = "active"

  app_route_policy = sdwan_app_route_policy.main.id
  control_policy   = sdwan_control_policy.hub_spoke.id

  site_list = ["all-sites"]
}`,
        output: [
          "  # sdwan_control_policy.hub_spoke will be created",
          "  + Control Policy: hub-spoke-topology",
          "    Branch → Internet: Direct Internet Access (DIA)",
          "    Branch → DC: via datacenter TLOCs",
          "",
          "  # sdwan_policy_definition.active will be created",
          "  + Activating production-policy on all-sites",
          "",
          "Plan: 5 to add, 0 to change, 0 to destroy.",
          "",
          "sdwan_sla_class.voice_sla: Created",
          "sdwan_sla_class.data_sla: Created",
          "sdwan_app_route_policy.main: Created",
          "sdwan_control_policy.hub_spoke: Created",
          "sdwan_policy_definition.active: Activated",
          "",
          "Apply complete! Resources: 5 added."
        ],
        explanation: "vSmart control policies define topology and traffic flow. Hub-spoke directs branch internet traffic via DIA (Direct Internet Access) while enterprise app traffic routes through the datacenter."
      },
    ] as CodeStep[],
    validations: [
      { label: "SLA classes with latency/loss/jitter thresholds", pass: true },
      { label: "App-aware routing with preferred transports", pass: true },
      { label: "Centralized policy activated", pass: true },
    ],
    explanation: "SD-WAN separates the data plane from the control plane. SLA classes define performance thresholds, app-route policies match traffic to SLAs with preferred transports, and control policies manage topology at scale.",
    hints: ["Define SLA classes before referencing them in policies", "DSCP 46 (EF) is standard for voice", "Use preferred_color to set transport priority"],
    logs: ["[SLA] Voice: ≤150ms/1%/30ms", "[POLICY] 3 routing sequences defined", "[ACTIVATE] Policy pushed to all sites"],
  },
  {
    id: "tf-k8s-netpol", name: "K8s Network Policies", category: "Cloud Infrastructure", mode: "Terraform Lab",
    objective: "Define Kubernetes NetworkPolicy resources for pod-to-pod segmentation with ingress and egress rules.",
    steps: [
      {
        code: `resource "kubernetes_network_policy" "api_policy" {
  metadata {
    name      = "api-server-policy"
    namespace = "production"
  }

  spec {
    pod_selector {
      match_labels = {
        app  = "api-server"
        tier = "backend"
      }
    }

    policy_types = ["Ingress", "Egress"]

    ingress {
      from {
        pod_selector {
          match_labels = {
            app  = "web-frontend"
            tier = "frontend"
          }
        }
      }
      from {
        namespace_selector {
          match_labels = {
            name = "monitoring"
          }
        }
      }
      ports {
        protocol = "TCP"
        port     = "8080"
      }
    }

    egress {
      to {
        pod_selector {
          match_labels = {
            app  = "postgres"
            tier = "database"
          }
        }
      }
      ports {
        protocol = "TCP"
        port     = "5432"
      }
    }

    egress {
      to {
        ip_block {
          cidr = "10.0.0.0/8"
        }
      }
      ports {
        protocol = "UDP"
        port     = "53"
      }
    }
  }
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # kubernetes_network_policy.api_policy will be created",
          "  + NetworkPolicy: api-server-policy (production)",
          "    Target: pods with app=api-server, tier=backend",
          "",
          "    Ingress Rules:",
          "      ✓ Allow from web-frontend pods on TCP/8080",
          "      ✓ Allow from monitoring namespace on TCP/8080",
          "",
          "    Egress Rules:",
          "      ✓ Allow to postgres pods on TCP/5432",
          "      ✓ Allow DNS (UDP/53) to 10.0.0.0/8",
          "",
          "    All other traffic: DENIED (implicit)"
        ],
        explanation: "Kubernetes NetworkPolicies provide micro-segmentation at the pod level. Specifying both Ingress and Egress in policy_types means all non-matching traffic is denied by default."
      },
      {
        code: `# Database tier - most restrictive policy
resource "kubernetes_network_policy" "db_policy" {
  metadata {
    name      = "database-policy"
    namespace = "production"
  }

  spec {
    pod_selector {
      match_labels = {
        app  = "postgres"
        tier = "database"
      }
    }

    policy_types = ["Ingress", "Egress"]

    ingress {
      from {
        pod_selector {
          match_labels = {
            app  = "api-server"
            tier = "backend"
          }
        }
      }
      ports {
        protocol = "TCP"
        port     = "5432"
      }
    }

    # Egress: only DNS for service discovery
    egress {
      to {
        namespace_selector {}
      }
      ports {
        protocol = "UDP"
        port     = "53"
      }
    }
  }
}`,
        output: [
          "  # kubernetes_network_policy.db_policy will be created",
          "  + NetworkPolicy: database-policy (production)",
          "    Target: pods with app=postgres, tier=database",
          "",
          "    Ingress: ONLY from api-server on TCP/5432",
          "    Egress:  ONLY DNS (UDP/53)",
          "",
          "Plan: 2 to add.",
          "",
          "kubernetes_network_policy.api_policy: Created",
          "kubernetes_network_policy.db_policy: Created",
          "",
          "Apply complete! Resources: 2 added.",
          "",
          "Verification:",
          "  web-frontend → api-server:8080  ✓ ALLOWED",
          "  api-server → postgres:5432      ✓ ALLOWED",
          "  web-frontend → postgres:5432    ✗ DENIED",
          "  api-server → internet           ✗ DENIED"
        ],
        explanation: "Database pods should have the most restrictive policies — only accepting connections from the API tier on the database port. Egress is limited to DNS for service discovery."
      },
    ] as CodeStep[],
    validations: [
      { label: "API server policy with ingress/egress rules", pass: true },
      { label: "Database policy with minimal access", pass: true },
      { label: "Cross-tier access properly segmented", pass: true },
    ],
    explanation: "Kubernetes NetworkPolicies implement zero-trust networking at the pod level. Each tier (frontend, backend, database) gets its own policy. The database tier is most restrictive, only accepting connections from the API tier.",
    hints: ["Always specify both Ingress and Egress policy_types", "Don't forget DNS egress — pods need service discovery", "Database tier should only accept from API tier"],
    logs: ["[NETPOL] api-server-policy created", "[NETPOL] database-policy created", "[VERIFY] Cross-tier segmentation validated"],
  },
  {
    id: "tf-ztna", name: "Zero Trust Access", category: "Cloud Infrastructure", mode: "Terraform Lab",
    objective: "Implement Zero Trust Network Access with micro-segmentation, VPC endpoints, and identity-based access controls.",
    steps: [
      {
        code: `# VPC Endpoint for private AWS service access (no internet)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [aws_route_table.private.id]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowSpecificBucket"
      Effect    = "Allow"
      Principal = "*"
      Action    = ["s3:GetObject", "s3:PutObject"]
      Resource  = [
        "arn:aws:s3:::app-data-prod/*",
        "arn:aws:s3:::app-logs-prod/*"
      ]
    }]
  })

  tags = { Name = "s3-endpoint" }
}

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private.id]
  security_group_ids  = [aws_security_group.endpoint_sg.id]
  private_dns_enabled = true

  tags = { Name = "ssm-endpoint" }
}`,
        output: [
          "Terraform will perform the following actions:",
          "",
          "  # aws_vpc_endpoint.s3 (Gateway)",
          "  + S3 endpoint — private access, no internet required",
          "    Policy: Allow s3:Get/Put on app-data-prod, app-logs-prod only",
          "",
          "  # aws_vpc_endpoint.ssm (Interface)",
          "  + SSM endpoint — private management, no bastion needed",
          "    Private DNS enabled for transparent access"
        ],
        explanation: "VPC Endpoints enable private access to AWS services without internet. Gateway endpoints (S3, DynamoDB) use route tables; Interface endpoints use ENIs with security groups. Endpoint policies restrict to specific resources."
      },
      {
        code: `# Micro-segmentation with security groups
resource "aws_security_group" "app_tier" {
  name   = "app-tier-sg"
  vpc_id = aws_vpc.main.id

  # Only from ALB
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Only to database tier
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.db_tier.id]
  }

  # To VPC endpoints only
  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.endpoint_sg.id]
  }
}

# IAM role with least-privilege (identity-based access)
resource "aws_iam_role" "app_role" {
  name = "app-server-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Condition = {
        StringEquals = {
          "aws:SourceVpc" = aws_vpc.main.id
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "app_policy" {
  name = "app-least-privilege"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "arn:aws:s3:::app-data-prod/*"
        Condition = {
          IpAddress = {
            "aws:VpcSourceIp" = "10.0.0.0/16"
          }
        }
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = "arn:aws:ssm:*:*:parameter/app/prod/*"
      }
    ]
  })
}`,
        output: [
          "  # aws_security_group.app_tier — micro-segmented",
          "  + Ingress: ONLY from ALB on 8080/tcp",
          "  + Egress:  ONLY to DB on 5432/tcp + endpoints on 443/tcp",
          "  + No internet access (zero trust)",
          "",
          "  # aws_iam_role.app_role — identity-based",
          "  + AssumeRole restricted to VPC source",
          "  + S3 access conditioned on VPC source IP",
          "  + SSM parameter access for secrets",
          "",
          "Plan: 5 to add.",
          "",
          "aws_vpc_endpoint.s3: Created (vpce-s3-abc)",
          "aws_vpc_endpoint.ssm: Created (vpce-ssm-def)",
          "aws_security_group.app_tier: Created (sg-app-123)",
          "aws_iam_role.app_role: Created",
          "aws_iam_role_policy.app_policy: Created",
          "",
          "Apply complete! Resources: 5 added.",
          "",
          "Zero Trust Verification:",
          "  ✓ No internet gateway routes in private subnets",
          "  ✓ All AWS API calls via VPC endpoints",
          "  ✓ Security groups reference each other (no CIDRs)",
          "  ✓ IAM policies scoped to specific resources + VPC"
        ],
        explanation: "Zero Trust eliminates implicit trust. Network access uses security group references (not CIDRs), AWS service access uses VPC endpoints (not internet), and IAM policies add identity-based conditions on top of network controls."
      },
    ] as CodeStep[],
    validations: [
      { label: "VPC endpoints for private service access", pass: true },
      { label: "Security groups with micro-segmentation", pass: true },
      { label: "IAM least-privilege with VPC conditions", pass: true },
    ],
    explanation: "Zero Trust Network Access (ZTNA) assumes no implicit trust. Every access request is verified: network segmentation (security groups referencing each other), private service access (VPC endpoints), and identity verification (IAM with conditions).",
    hints: ["Use security group references instead of CIDRs for micro-segmentation", "VPC endpoints eliminate the need for internet gateways", "Add VPC source conditions to IAM policies"],
    logs: ["[ZTNA] VPC endpoints: S3 + SSM created", "[ZTNA] Micro-segmented security groups applied", "[ZTNA] Identity-based IAM with VPC conditions"],
  },
];
