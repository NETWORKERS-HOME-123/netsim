export type LabMode = "Network Lab" | "Python Lab" | "Terraform Lab" | "AI Coding Lab";

export interface CommandStep {
  command: string;
  output: string[];
  delay?: number;
}

export interface CodeStep {
  code: string;
  output?: string[];
  explanation?: string;
}

export interface ValidationCheck {
  label: string;
  pass: boolean;
}

export interface Lab {
  id: string;
  name: string;
  category: string;
  mode: LabMode;
  objective: string;
  steps: CommandStep[] | CodeStep[];
  validations: ValidationCheck[];
  explanation: string;
  hints: string[];
  logs: string[];
}

import { advancedRoutingLabs, securityLabs, switchingAdvancedLabs, infraServicesLabs, haWanLabs, ipv6Labs } from "./labs-network-advanced";
import { terraformLabs } from "./labs-terraform";
import { aiCodingLabs } from "./labs-ai-coding";

const fundamentalLabs: Lab[] = [
  {
    id: "hostname-config", name: "Hostname Config", category: "Fundamentals", mode: "Network Lab",
    objective: "Configure the hostname of a Cisco router to 'Router1' using the CLI.",
    steps: [
      { command: "enable", output: ["Router#"] },
      { command: "configure terminal", output: ["Enter configuration commands, one per line.  End with CNTL/Z.", "Router(config)#"] },
      { command: "hostname Router1", output: ["Router1(config)#"] },
      { command: "end", output: ["Router1#", "%SYS-5-CONFIG_I: Configured from console by console"] },
      { command: "show running-config | include hostname", output: ["hostname Router1"] },
    ] as CommandStep[],
    validations: [
      { label: "Entered global config mode", pass: true },
      { label: "Hostname set to Router1", pass: true },
      { label: "Configuration saved", pass: true },
    ],
    explanation: "The `hostname` command changes the device's name in global configuration mode. This name appears in the CLI prompt and is used for identification in network management.",
    hints: ["First, enter privileged EXEC mode with 'enable'", "Use 'configure terminal' to enter global config", "The command is 'hostname <name>'"],
    logs: ["[INFO] Session started on Router", "[CONFIG] hostname Router1", "[VERIFY] Running-config shows hostname Router1"],
  },
  {
    id: "interface-basics", name: "Interface Basics", category: "Fundamentals", mode: "Network Lab",
    objective: "Configure an IP address on GigabitEthernet0/0 and bring the interface up.",
    steps: [
      { command: "enable", output: ["Router1#"] },
      { command: "configure terminal", output: ["Router1(config)#"] },
      { command: "interface GigabitEthernet0/0", output: ["Router1(config-if)#"] },
      { command: "ip address 192.168.1.1 255.255.255.0", output: ["Router1(config-if)#"] },
      { command: "no shutdown", output: ["Router1(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up", "%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to up"] },
      { command: "end", output: ["Router1#"] },
      { command: "show ip interface brief", output: ["Interface              IP-Address      OK? Method Status                Protocol", "GigabitEthernet0/0    192.168.1.1     YES manual up                    up"] },
    ] as CommandStep[],
    validations: [{ label: "Interface selected", pass: true }, { label: "IP address configured", pass: true }, { label: "Interface is up/up", pass: true }],
    explanation: "Configuring an interface requires entering interface config mode, assigning an IP with subnet mask, and enabling it with `no shutdown`. Cisco interfaces are administratively down by default.",
    hints: ["Select the interface with 'interface GigabitEthernet0/0'", "Assign IP: 'ip address <ip> <mask>'", "Don't forget 'no shutdown' to enable it"],
    logs: ["[CONFIG] Selected interface GigabitEthernet0/0", "[CONFIG] IP address 192.168.1.1/24 assigned", "[STATUS] Interface GigabitEthernet0/0 is up/up"],
  },
];

const routingLabs: Lab[] = [
  {
    id: "static-routing", name: "Static Routing", category: "Routing", mode: "Network Lab",
    objective: "Add a static route to reach the 10.0.0.0/24 network via next-hop 192.168.1.2.",
    steps: [
      { command: "enable", output: ["Router1#"] },
      { command: "configure terminal", output: ["Router1(config)#"] },
      { command: "ip route 10.0.0.0 255.255.255.0 192.168.1.2", output: ["Router1(config)#"] },
      { command: "end", output: ["Router1#"] },
      { command: "show ip route static", output: ["S    10.0.0.0/24 [1/0] via 192.168.1.2"] },
      { command: "ping 10.0.0.1", output: ["Sending 5, 100-byte ICMP Echos to 10.0.0.1, timeout is 2 seconds:", "!!!!!", "Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms"] },
    ] as CommandStep[],
    validations: [{ label: "Static route added", pass: true }, { label: "Route visible in routing table", pass: true }, { label: "Ping to destination successful", pass: true }],
    explanation: "Static routes manually define paths to destination networks. The syntax is `ip route <network> <mask> <next-hop>`.",
    hints: ["Static route syntax: ip route <dest> <mask> <next-hop>", "Verify with 'show ip route static'"],
    logs: ["[CONFIG] Static route: 10.0.0.0/24 via 192.168.1.2", "[TEST] Ping 10.0.0.1 — 5/5 success"],
  },
  {
    id: "ospf-setup", name: "OSPF Setup", category: "Routing", mode: "Network Lab",
    objective: "Enable OSPF process 1 and advertise the 192.168.1.0/24 network in area 0.",
    steps: [
      { command: "enable", output: ["Router1#"] },
      { command: "configure terminal", output: ["Router1(config)#"] },
      { command: "router ospf 1", output: ["Router1(config-router)#"] },
      { command: "router-id 1.1.1.1", output: ["Router1(config-router)#"] },
      { command: "network 192.168.1.0 0.0.0.255 area 0", output: ["Router1(config-router)#"] },
      { command: "end", output: ["Router1#", "%OSPF-5-ADJCHG: Process 1, Nbr 2.2.2.2 on GigabitEthernet0/0 from LOADING to FULL, Loading Done"] },
      { command: "show ip ospf neighbor", output: ["Neighbor ID  Pri  State      Dead Time  Address       Interface", "2.2.2.2        1  FULL/DR    00:00:38   192.168.1.2   GigabitEthernet0/0"] },
    ] as CommandStep[],
    validations: [{ label: "OSPF process created", pass: true }, { label: "Network advertised in area 0", pass: true }, { label: "OSPF neighbor adjacency formed", pass: true }],
    explanation: "OSPF is a link-state routing protocol. Create a process with `router ospf <id>`, set a router-id, and use the `network` command with wildcard mask.",
    hints: ["Start OSPF with 'router ospf 1'", "Advertise network with wildcard mask, not subnet mask"],
    logs: ["[OSPF] Process 1 created", "[OSPF] Network 192.168.1.0/24 added to area 0", "[OSPF] Neighbor 2.2.2.2 state: FULL/DR"],
  },
];

const switchingLabs: Lab[] = [
  {
    id: "vlan-setup", name: "VLAN Setup", category: "Switching", mode: "Network Lab",
    objective: "Create VLAN 10 (Engineering) and assign interface FastEthernet0/1 to it.",
    steps: [
      { command: "enable", output: ["Switch1#"] },
      { command: "configure terminal", output: ["Switch1(config)#"] },
      { command: "vlan 10", output: ["Switch1(config-vlan)#"] },
      { command: "name Engineering", output: ["Switch1(config-vlan)#"] },
      { command: "exit", output: ["Switch1(config)#"] },
      { command: "interface FastEthernet0/1", output: ["Switch1(config-if)#"] },
      { command: "switchport mode access", output: ["Switch1(config-if)#"] },
      { command: "switchport access vlan 10", output: ["Switch1(config-if)#"] },
      { command: "end", output: ["Switch1#"] },
      { command: "show vlan brief", output: ["VLAN Name                Status    Ports", "---- ------------------- --------- ------", "1    default             active    Fa0/2-24", "10   Engineering         active    Fa0/1"] },
    ] as CommandStep[],
    validations: [{ label: "VLAN 10 created", pass: true }, { label: "VLAN named Engineering", pass: true }, { label: "Fa0/1 assigned to VLAN 10", pass: true }],
    explanation: "VLANs segment a switch into logical broadcast domains. Create with `vlan <id>`, name it, then assign ports using `switchport access vlan <id>`.",
    hints: ["Create VLAN first: 'vlan 10'", "Set port to access mode before assigning VLAN"],
    logs: ["[CONFIG] VLAN 10 created: Engineering", "[CONFIG] Fa0/1 assigned to VLAN 10"],
  },
  {
    id: "trunk-config", name: "Trunk Config", category: "Switching", mode: "Network Lab",
    objective: "Configure a trunk link on GigabitEthernet0/1 allowing VLANs 10 and 20.",
    steps: [
      { command: "enable", output: ["Switch1#"] },
      { command: "configure terminal", output: ["Switch1(config)#"] },
      { command: "interface GigabitEthernet0/1", output: ["Switch1(config-if)#"] },
      { command: "switchport trunk encapsulation dot1q", output: ["Switch1(config-if)#"] },
      { command: "switchport mode trunk", output: ["Switch1(config-if)#"] },
      { command: "switchport trunk allowed vlan 10,20", output: ["Switch1(config-if)#"] },
      { command: "end", output: ["Switch1#"] },
      { command: "show interfaces trunk", output: ["Port      Mode     Encapsulation  Status     Native vlan", "Gi0/1     on       802.1q         trunking   1", "", "Port      Vlans allowed on trunk", "Gi0/1     10,20"] },
    ] as CommandStep[],
    validations: [{ label: "Trunk mode configured", pass: true }, { label: "802.1Q encapsulation set", pass: true }, { label: "Allowed VLANs restricted to 10,20", pass: true }],
    explanation: "Trunk links carry traffic for multiple VLANs between switches using 802.1Q tagging. Always restrict allowed VLANs for security.",
    hints: ["Set encapsulation first: 'switchport trunk encapsulation dot1q'", "Restrict VLANs: 'switchport trunk allowed vlan 10,20'"],
    logs: ["[CONFIG] Gi0/1 set to trunk mode", "[CONFIG] Trunk allowed VLANs: 10,20"],
  },
];

const troubleshootingLabs: Lab[] = [
  {
    id: "fix-down-interface", name: "Fix Down Interface", category: "Troubleshooting", mode: "Network Lab",
    objective: "Diagnose why GigabitEthernet0/0 is down and bring it back up.",
    steps: [
      { command: "enable", output: ["Router1#"] },
      { command: "show ip interface brief", output: ["Interface              IP-Address      OK? Method Status                Protocol", "GigabitEthernet0/0    192.168.1.1     YES manual administratively down down"] },
      { command: "configure terminal", output: ["Router1(config)#"] },
      { command: "interface GigabitEthernet0/0", output: ["Router1(config-if)#"] },
      { command: "no shutdown", output: ["Router1(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up", "%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to up"] },
      { command: "end", output: ["Router1#"] },
      { command: "show ip interface brief", output: ["Interface              IP-Address      OK? Method Status                Protocol", "GigabitEthernet0/0    192.168.1.1     YES manual up                    up"] },
    ] as CommandStep[],
    validations: [{ label: "Issue diagnosed: administratively down", pass: true }, { label: "Interface enabled with no shutdown", pass: true }, { label: "Interface status: up/up", pass: true }],
    explanation: "'Administratively down' means the interface was manually disabled with the `shutdown` command. The fix is `no shutdown`.",
    hints: ["Check 'show ip interface brief' first", "Look for 'administratively down'"],
    logs: ["[DIAG] Gi0/0: administratively down", "[FIX] 'no shutdown' issued", "[RESOLVED] Gi0/0 up/up"],
  },
];

const automationLabs: Lab[] = [
  {
    id: "python-netmiko", name: "Python Netmiko Task", category: "Automation", mode: "Python Lab",
    objective: "Write a Python script using Netmiko to connect to a router and retrieve the running configuration.",
    steps: [{
      code: `from netmiko import ConnectHandler

device = {
    "device_type": "cisco_ios",
    "host": "192.168.1.1",
    "username": "admin",
    "password": "cisco123",
}

print("Connecting to device...")
net_connect = ConnectHandler(**device)

print("Retrieving running config...")
output = net_connect.send_command("show running-config")

print("=" * 50)
print(output[:500])
print("=" * 50)

net_connect.disconnect()
print("Connection closed.")`,
      output: ["Connecting to device...", "Retrieving running config...", "==================================================", "Building configuration...", "", "Current configuration : 1234 bytes", "!", "hostname Router1", "!", "interface GigabitEthernet0/0", " ip address 192.168.1.1 255.255.255.0", "==================================================", "Connection closed."],
    }] as CodeStep[],
    validations: [{ label: "SSH connection established", pass: true }, { label: "Running config retrieved", pass: true }, { label: "Connection properly closed", pass: true }],
    explanation: "Netmiko simplifies SSH connections to network devices. ConnectHandler establishes the session, send_command() executes commands.",
    hints: ["Import ConnectHandler from netmiko", "Define device dict with device_type, host, username, password"],
    logs: ["[NETMIKO] SSH session to 192.168.1.1", "[EXEC] show running-config", "[NETMIKO] Session disconnected"],
  },
];

export const labs: Lab[] = [
  ...fundamentalLabs,
  ...routingLabs,
  ...switchingLabs,
  ...troubleshootingLabs,
  ...automationLabs,
  ...advancedRoutingLabs,
  ...securityLabs,
  ...switchingAdvancedLabs,
  ...infraServicesLabs,
  ...haWanLabs,
  ...ipv6Labs,
  ...terraformLabs,
  ...aiCodingLabs,
];

export const categories = [
  { name: "Fundamentals", labs: ["hostname-config", "interface-basics"] },
  { name: "Routing", labs: ["static-routing", "ospf-setup"] },
  { name: "Switching", labs: ["vlan-setup", "trunk-config"] },
  { name: "Troubleshooting", labs: ["fix-down-interface"] },
  { name: "Automation", labs: ["python-netmiko"] },
  { name: "Advanced Routing", labs: ["eigrp-basic", "eigrp-named-mode", "bgp-ebgp", "bgp-ibgp", "ospf-multi-area", "ospf-stub-area", "route-redistribution", "policy-based-routing", "bgp-route-filtering", "ospf-authentication"] },
  { name: "Security", labs: ["standard-acl", "extended-acl", "static-nat", "dynamic-nat-pat", "ipsec-vpn", "aaa-tacacs", "ssh-hardening", "port-security"] },
  { name: "Switching Advanced", labs: ["intervlan-routing", "etherchannel-lacp", "stp-root-bridge", "rstp-config", "vtp-config", "span-config"] },
  { name: "Infrastructure Services", labs: ["dhcp-server", "ntp-config", "snmp-config", "syslog-config", "ip-sla-tracking", "qos-dscp"] },
  { name: "High Availability", labs: ["hsrp-config", "vrrp-config", "gre-tunnel", "dmvpn-phase1"] },
  { name: "IPv6", labs: ["ipv6-interface", "ipv6-static-routing", "ospfv3-config"] },
  { name: "Terraform", labs: ["tf-vpc-subnets", "tf-ec2-deployment", "tf-s3-policy", "tf-rds-database", "tf-alb"] },
  { name: "AI Coding", labs: ["ai-rest-api-client", "ai-refactor-legacy", "ai-unit-tests", "ai-debug-async"] },
];

export function getLabById(id: string): Lab | undefined {
  return labs.find((l) => l.id === id);
}

export function getLabsByCategory(category: string): Lab[] {
  return labs.filter((l) => l.category === category);
}
