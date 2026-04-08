import type { Lab, CodeStep } from "./labs";

export const pythonSecopsLabs: Lab[] = [
  {
    id: "py-vuln-scanner", name: "Vulnerability Scanner", category: "Python Security", mode: "Python Lab",
    objective: "Build a Python script that audits Cisco device configurations against CIS benchmark rules and generates a compliance score.",
    steps: [
      {
        code: `import re
from netmiko import ConnectHandler

# CIS Benchmark checks for Cisco IOS
CIS_CHECKS = {
    "password_encryption": r"service password-encryption",
    "enable_secret": r"enable secret",
    "no_ip_http_server": r"no ip http server",
    "ssh_version_2": r"ip ssh version 2",
    "exec_timeout": r"exec-timeout \\d+ \\d+",
    "login_local": r"login local",
    "banner_motd": r"banner motd",
    "ntp_configured": r"ntp server",
    "logging_buffered": r"logging buffered",
    "no_cdp_global": r"no cdp run",
}

device = {
    "device_type": "cisco_ios",
    "host": "192.168.1.1",
    "username": "admin",
    "password": "admin123",
}`,
        output: ["Initializing CIS benchmark scanner..."],
        explanation: "Define CIS benchmark rules as regex patterns. Each check maps to a security control that should be present in the running configuration."
      },
      {
        code: `def audit_config(config_text: str) -> dict:
    results = {}
    for check_name, pattern in CIS_CHECKS.items():
        match = re.search(pattern, config_text)
        results[check_name] = {
            "status": "PASS" if match else "FAIL",
            "pattern": pattern,
            "found": match.group(0) if match else None
        }
    return results

def calculate_score(results: dict) -> float:
    passed = sum(1 for r in results.values() if r["status"] == "PASS")
    return (passed / len(results)) * 100

# Simulate running config
sample_config = """
service password-encryption
enable secret 5 $1$xyz$abc
no ip http server
ip ssh version 2
line con 0
 exec-timeout 5 0
 login local
banner motd ^Authorized Access Only^
ntp server 10.0.0.50
logging buffered 16384
"""

results = audit_config(sample_config)
score = calculate_score(results)`,
        output: [
          "=== CIS Compliance Audit Report ===",
          "password_encryption  : PASS ✓",
          "enable_secret        : PASS ✓",
          "no_ip_http_server    : PASS ✓",
          "ssh_version_2        : PASS ✓",
          "exec_timeout         : PASS ✓",
          "login_local          : PASS ✓",
          "banner_motd          : PASS ✓",
          "ntp_configured       : PASS ✓",
          "logging_buffered     : PASS ✓",
          "no_cdp_global        : FAIL ✗",
          "",
          "Compliance Score: 90.0% (9/10 checks passed)",
          "Risk Level: LOW"
        ],
        explanation: "The audit function checks each CIS rule against the config using regex. A compliance score is calculated as percentage of passing checks."
      },
    ] as CodeStep[],
    validations: [
      { label: "CIS benchmark rules defined", pass: true },
      { label: "Config audit function working", pass: true },
      { label: "Compliance score calculated", pass: true },
    ],
    explanation: "Automated vulnerability scanning compares device configurations against industry benchmarks (CIS, DISA STIG). Regex-based pattern matching identifies missing hardening controls and calculates risk scores.",
    hints: ["Define checks as regex patterns for flexibility", "Handle both present and absent config lines", "Score = passing checks / total checks × 100"],
    logs: ["[SCAN] 10 CIS checks loaded", "[AUDIT] Running config analyzed", "[RESULT] Score: 90% — 1 finding"],
  },
  {
    id: "py-acl-analyzer", name: "ACL Analyzer", category: "Python Security", mode: "Python Lab",
    objective: "Parse Cisco ACLs, detect shadowed and redundant rules, and output a clean analysis report.",
    steps: [
      {
        code: `from dataclasses import dataclass
from ipaddress import ip_network
from typing import List

@dataclass
class ACLEntry:
    sequence: int
    action: str  # permit or deny
    protocol: str
    source: str
    destination: str
    port: str = "any"

    def covers(self, other: "ACLEntry") -> bool:
        """Check if this entry's networks encompass another entry."""
        try:
            self_src = ip_network(self.source, strict=False)
            other_src = ip_network(other.source, strict=False)
            self_dst = ip_network(self.destination, strict=False)
            other_dst = ip_network(other.destination, strict=False)
            return (other_src.subnet_of(self_src) and
                    other_dst.subnet_of(self_dst) and
                    self.protocol in (other.protocol, "ip"))
        except ValueError:
            return False`,
        output: ["ACL data structures initialized"],
        explanation: "Define an ACLEntry dataclass with a `covers()` method that uses Python's ipaddress module to check if one rule's networks encompass another's."
      },
      {
        code: `def analyze_acl(entries: List[ACLEntry]) -> dict:
    shadowed = []
    redundant = []

    for i, entry in enumerate(entries):
        for j, earlier in enumerate(entries[:i]):
            if earlier.covers(entry):
                if earlier.action == entry.action:
                    redundant.append((entry.sequence, earlier.sequence))
                else:
                    shadowed.append((entry.sequence, earlier.sequence))

    return {"shadowed": shadowed, "redundant": redundant}

# Sample ACL
acl = [
    ACLEntry(10, "deny",   "tcp", "10.0.0.0/8",     "0.0.0.0/0",     "23"),
    ACLEntry(20, "permit", "ip",  "10.0.0.0/8",     "172.16.0.0/16", "any"),
    ACLEntry(30, "deny",   "tcp", "10.1.1.0/24",    "0.0.0.0/0",     "23"),
    ACLEntry(40, "permit", "tcp", "10.1.1.0/24",    "172.16.1.0/24", "443"),
    ACLEntry(50, "permit", "ip",  "192.168.0.0/16", "0.0.0.0/0",     "any"),
]

report = analyze_acl(acl)`,
        output: [
          "=== ACL Analysis Report ===",
          "",
          "⚠ SHADOWED RULES (unreachable):",
          "  Seq 30 (deny tcp 10.1.1.0/24 -> any:23)",
          "    └─ Shadowed by Seq 10 (deny tcp 10.0.0.0/8 -> any:23)",
          "",
          "✓ REDUNDANT RULES (can be removed):",
          "  Seq 30 is redundant with Seq 10 (same action, subset network)",
          "",
          "Total rules: 5 | Shadowed: 1 | Redundant: 1",
          "Recommendation: Remove seq 30, consolidate ACL"
        ],
        explanation: "The analyzer iterates through ACL entries and checks if later rules are shadowed (unreachable due to earlier broader rules with different actions) or redundant (same action, subset network)."
      },
    ] as CodeStep[],
    validations: [
      { label: "ACL entries parsed correctly", pass: true },
      { label: "Shadowed rules detected", pass: true },
      { label: "Redundant rules identified", pass: true },
    ],
    explanation: "ACL analysis helps maintain clean firewall rules. Shadowed rules never match because a broader earlier rule handles the traffic. Redundant rules duplicate existing coverage. Both waste resources and obscure intent.",
    hints: ["Use Python's ipaddress module for subnet math", "Check if later entries are subsets of earlier ones", "Same action + subset = redundant; different action + subset = shadowed"],
    logs: ["[PARSE] 5 ACL entries loaded", "[ANALYSIS] 1 shadowed, 1 redundant found", "[REPORT] Optimization recommendations generated"],
  },
  {
    id: "py-config-compliance", name: "Config Compliance", category: "Python Security", mode: "Python Lab",
    objective: "Compare running device configs against a golden template using Jinja2, flag deviations, and generate a compliance report.",
    steps: [
      {
        code: `from jinja2 import Template

GOLDEN_TEMPLATE = """
service password-encryption
no ip http server
no ip http secure-server
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
banner motd ^{{ banner_text }}^
logging buffered {{ log_buffer_size }}
logging host {{ syslog_server }}
ntp server {{ ntp_server }}
snmp-server community {{ snmp_community }} RO
"""

template_vars = {
    "banner_text": "Authorized Access Only",
    "log_buffer_size": "16384",
    "syslog_server": "10.0.0.100",
    "ntp_server": "10.0.0.50",
    "snmp_community": "SecureRO",
}

golden = Template(GOLDEN_TEMPLATE).render(**template_vars)`,
        output: ["Golden template rendered with site-specific variables"],
        explanation: "Jinja2 templates define the expected configuration with variables for site-specific values. This separates policy (template) from parameters (variables)."
      },
      {
        code: `def compare_configs(golden: str, running: str) -> dict:
    golden_lines = set(l.strip() for l in golden.strip().splitlines() if l.strip())
    running_lines = set(l.strip() for l in running.strip().splitlines() if l.strip())

    missing = golden_lines - running_lines
    extra = running_lines - golden_lines
    compliant = golden_lines & running_lines

    return {
        "missing": sorted(missing),
        "extra": sorted(extra),
        "compliant": sorted(compliant),
        "score": len(compliant) / len(golden_lines) * 100 if golden_lines else 0
    }

running_config = """
service password-encryption
no ip http server
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
banner motd ^Authorized Access Only^
logging buffered 16384
ntp server 10.0.0.50
ip http secure-server
snmp-server community public RO
"""

result = compare_configs(golden, running_config)`,
        output: [
          "=== Config Compliance Report ===",
          "",
          "✓ COMPLIANT (7/10):",
          "  service password-encryption",
          "  no ip http server",
          "  ip ssh version 2",
          "  ip ssh time-out 60",
          "  ip ssh authentication-retries 3",
          "  banner motd ^Authorized Access Only^",
          "  logging buffered 16384",
          "",
          "✗ MISSING from running config (3):",
          "  no ip http secure-server",
          "  logging host 10.0.0.100",
          "  snmp-server community SecureRO RO",
          "",
          "⚠ EXTRA (not in template) (2):",
          "  ip http secure-server  ← SECURITY RISK",
          "  snmp-server community public RO  ← WEAK COMMUNITY",
          "",
          "Compliance Score: 70.0%"
        ],
        explanation: "Set comparison identifies missing (required but absent), extra (present but not in template), and compliant lines. Extra lines may indicate security risks like default SNMP communities."
      },
    ] as CodeStep[],
    validations: [
      { label: "Golden template rendered from Jinja2", pass: true },
      { label: "Config deviations detected", pass: true },
      { label: "Compliance score calculated", pass: true },
    ],
    explanation: "Configuration compliance ensures devices match organizational security policies. Golden templates define the expected state, and automated comparison catches drift, unauthorized changes, and missing hardening controls.",
    hints: ["Use Jinja2 for variable substitution in templates", "Set operations make line comparison efficient", "Flag 'extra' lines too — they may be security risks"],
    logs: ["[TEMPLATE] Golden config rendered", "[COMPARE] 3 missing, 2 extra lines found", "[SCORE] Compliance: 70%"],
  },
  {
    id: "py-cert-manager", name: "Certificate Manager", category: "Python Security", mode: "Python Lab",
    objective: "Monitor PKI certificate expiry dates and automate CSR generation using Python's cryptography library.",
    steps: [
      {
        code: `from datetime import datetime, timedelta

# Simulated certificate inventory
cert_inventory = [
    {"cn": "router1.lab.local", "issuer": "Lab-CA", "not_after": datetime(2025, 3, 15), "serial": "0A:1B:2C"},
    {"cn": "switch1.lab.local", "issuer": "Lab-CA", "not_after": datetime(2025, 8, 22), "serial": "3D:4E:5F"},
    {"cn": "vpn.lab.local",     "issuer": "Lab-CA", "not_after": datetime(2025, 1, 5),  "serial": "6G:7H:8I"},
    {"cn": "wlc.lab.local",     "issuer": "Lab-CA", "not_after": datetime(2026, 12, 1), "serial": "9J:0K:1L"},
]

def check_expiry(certs, warn_days=90):
    now = datetime(2025, 1, 1)  # Simulated current date
    results = []
    for cert in certs:
        days_left = (cert["not_after"] - now).days
        if days_left < 0:
            status = "EXPIRED"
        elif days_left <= warn_days:
            status = "EXPIRING_SOON"
        else:
            status = "VALID"
        results.append({**cert, "days_left": days_left, "status": status})
    return sorted(results, key=lambda x: x["days_left"])`,
        output: [
          "=== Certificate Expiry Report ===",
          "",
          "🔴 EXPIRED:",
          "  (none)",
          "",
          "🟡 EXPIRING SOON (≤90 days):",
          "  vpn.lab.local      — 4 days left  (expires 2025-01-05)",
          "  router1.lab.local  — 73 days left (expires 2025-03-15)",
          "",
          "🟢 VALID:",
          "  switch1.lab.local  — 233 days left",
          "  wlc.lab.local      — 700 days left",
          "",
          "Action Required: 2 certificates need renewal"
        ],
        explanation: "Certificate monitoring calculates days until expiry and categorizes certs. Certificates expiring within 90 days trigger renewal workflows."
      },
      {
        code: `# Simulated CSR generation (cryptography library pattern)
def generate_csr(common_name: str, org: str = "Lab Corp",
                 country: str = "US", key_size: int = 2048):
    """Generate a CSR using the cryptography library."""
    # In production:
    # from cryptography import x509
    # from cryptography.x509.oid import NameOID
    # from cryptography.hazmat.primitives import hashes, serialization
    # from cryptography.hazmat.primitives.asymmetric import rsa

    csr_data = {
        "subject": f"CN={common_name},O={org},C={country}",
        "key_algorithm": f"RSA-{key_size}",
        "signature_algorithm": "SHA256withRSA",
        "san": [common_name, f"*.{common_name.split('.', 1)[-1]}"],
    }
    return csr_data

# Generate CSRs for expiring certs
expiring = check_expiry(cert_inventory)
for cert in expiring:
    if cert["status"] == "EXPIRING_SOON":
        csr = generate_csr(cert["cn"])
        print(f"CSR generated for {cert['cn']}")`,
        output: [
          "=== CSR Generation ===",
          "",
          "Generating CSR for vpn.lab.local...",
          "  Subject: CN=vpn.lab.local,O=Lab Corp,C=US",
          "  Key: RSA-2048",
          "  SAN: vpn.lab.local, *.lab.local",
          "  ✓ CSR saved to vpn.lab.local.csr",
          "",
          "Generating CSR for router1.lab.local...",
          "  Subject: CN=router1.lab.local,O=Lab Corp,C=US",
          "  Key: RSA-2048",
          "  SAN: router1.lab.local, *.lab.local",
          "  ✓ CSR saved to router1.lab.local.csr",
          "",
          "2 CSRs generated — submit to CA for signing"
        ],
        explanation: "Automated CSR generation creates renewal requests for expiring certificates. The cryptography library handles key generation and CSR formatting with proper SANs."
      },
    ] as CodeStep[],
    validations: [
      { label: "Certificate inventory scanned", pass: true },
      { label: "Expiring certs identified", pass: true },
      { label: "CSRs auto-generated for renewal", pass: true },
    ],
    explanation: "PKI certificate lifecycle management prevents outages from expired certs. Automated monitoring checks expiry dates, and CSR generation streamlines the renewal process with proper subject and SAN fields.",
    hints: ["Sort by days_left to prioritize renewals", "Include SANs for wildcard coverage", "Use the cryptography library for production CSR generation"],
    logs: ["[SCAN] 4 certificates inventoried", "[ALERT] 2 certs expiring within 90 days", "[CSR] 2 renewal requests generated"],
  },
];
