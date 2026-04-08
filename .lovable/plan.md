

# Add 5 New Lab Sections as Routes

## Summary
Add 5 new navigation tabs/routes with ~20 new labs total, each with technically accurate content following existing patterns.

## New Routes

| Tab | Route | Color | Icon | Lab Modes |
|-----|-------|-------|------|-----------|
| NetOps | `/netops` | blue | Activity | Network Lab |
| Security | `/security` | red | Shield | Network Lab |
| Python SecOps | `/python-secops` | cyan | Lock | Python Lab |
| Cloud | `/cloud` | indigo | Cloud | Terraform Lab |
| Forensics | `/forensics` | orange | Search | Network Lab |

## New Lab Data Files

### 1. `src/data/labs-netops.ts` (4 labs, mode: "Network Lab")
- **snmp-trap-lab** — Configure SNMP trap receiver, `snmp-server host`, community strings, `show snmp`, trap correlation
- **netflow-analysis** — `ip flow-export`, `ip cef`, NetFlow v9/IPFIX config, `show ip cache flow`, anomaly detection
- **change-management** — Pre/post config diffs via `show archive config differences`, `configure replace`, rollback
- **syslog-pipeline** — `logging host`, severity levels, `logging trap`, `show logging`, regex-based alerting

### 2. `src/data/labs-security.ts` (6 labs, mode: "Network Lab")
- **zbf-firewall** — Zone pairs, class-maps, policy-maps, `inspect` action, `show zone-pair security`
- **ids-ips-snort** — Snort rule syntax (`alert tcp`), signature tuning, inline vs passive, `show ip ips signatures`
- **dot1x-nac** — `dot1x system-auth-control`, RADIUS server config, MAB fallback, dynamic VLAN, `show dot1x`
- **dmvpn-flexvpn** — DMVPN Phase 3 vs FlexVPN IKEv2, `crypto ikev2`, `show dmvpn`, migration steps
- **copp-lab** — Control plane policing with MQC, `class-map`/`policy-map` on control-plane, `show policy-map control-plane`
- **dhcp-snooping-dai** — `ip dhcp snooping`, trusted ports, DAI `ip arp inspection`, IP Source Guard, `show ip dhcp snooping`

### 3. `src/data/labs-python-secops.ts` (4 labs, mode: "Python Lab")
- **py-vuln-scanner** — Python script auditing configs against CIS benchmarks, regex parsing, compliance scoring
- **py-acl-analyzer** — Parse ACLs, detect shadowed/redundant rules, visualization output
- **py-config-compliance** — Golden template comparison, Jinja2 diff, deviation flagging
- **py-cert-manager** — PKI cert expiry monitoring with `cryptography` lib, CSR automation

### 4. `src/data/labs-cloud-infra.ts` (4 labs, mode: "Terraform Lab")
- **tf-firewall-rules** — Security groups + NACLs as code, `aws_security_group`, `aws_network_acl`
- **tf-sdwan-policy** — SD-WAN application-aware routing model, SLA classes, policy templates
- **tf-k8s-netpol** — Kubernetes NetworkPolicy resources, ingress/egress rules, Calico selectors
- **tf-ztna** — Zero Trust micro-segmentation, identity-based access, `aws_vpc_endpoint`

### 5. `src/data/labs-forensics.ts` (4 labs, mode: "Network Lab")
- **pcap-analysis** — Guided tcpdump filters, packet decode, TCP handshake analysis, `show ip traffic`
- **bgp-hijack** — BGP route leak simulation, RPKI ROA validation, prefix filtering with route-maps
- **stp-forensics** — STP loop diagnosis, `show spanning-tree detail`, topology change counters, root guard
- **mtu-troubleshoot** — Path MTU discovery, `ping df-bit`, GRE overhead calc, `ip tcp adjust-mss`

## Updated Files

### `src/data/labs.ts`
- Add new LabMode values: keep existing modes, new labs reuse "Network Lab", "Python Lab", "Terraform Lab"
- Import all 5 new lab arrays and spread into `labs[]`
- Add new categories to `categories[]`: "Network Operations", "Security", "Python Security", "Cloud Infrastructure", "Forensics"

### `src/components/simulator/LabNavToggle.tsx`
- Add 5 new nav items with colors: NetOps (blue-600), Security (red-600), Python SecOps (teal-600), Cloud (indigo-600), Forensics (orange-600)
- Total 9 tabs — use smaller text (`text-[10px]`) and tighter padding to fit

### `src/App.tsx`
- Add 5 new route imports and `<Route>` entries

### New Page Files (5 pages following AutomationLab.tsx pattern)
- `src/pages/NetOpsLab.tsx` — filters categories ["Network Operations"]
- `src/pages/SecurityLab.tsx` — filters ["Security"]
- `src/pages/PythonSecOpsLab.tsx` — filters ["Python Security"]
- `src/pages/CloudLab.tsx` — filters ["Cloud Infrastructure"]
- `src/pages/ForensicsLab.tsx` — filters ["Forensics"]

Each page: WorkspaceProvider wrapper, custom sidebar filtering relevant categories, auto-selects first lab on mount.

## Technical Accuracy Notes
- All IOS commands use correct syntax (global config → sub-mode → verification)
- SNMP: proper `snmp-server` command hierarchy
- ZBF: correct zone-pair → class-map → policy-map → inspect chain
- 802.1X: accurate `aaa`/`radius-server`/`dot1x` command sequence
- CoPP: proper control-plane service-policy attachment
- BGP hijack: realistic AS-path prepend leak + RPKI ROV filtering
- Python labs use real libraries (netmiko, cryptography, jinja2)
- Terraform labs use valid HCL with correct AWS provider resources

