import type { Lab, CodeStep } from "./labs";

export const pythonNetworkLabs: Lab[] = [
  {
    id: "py-netmiko-show", name: "Netmiko: Show Commands", category: "Python Networking", mode: "Python Lab",
    objective: "Use Netmiko to SSH into a Cisco router and collect show commands output.",
    steps: [{
      code: `from netmiko import ConnectHandler

device = {
    "device_type": "cisco_ios",
    "host": "192.168.1.1",
    "username": "admin",
    "password": "cisco123",
}

net_connect = ConnectHandler(**device)
print("Connected to", device["host"])

output = net_connect.send_command("show ip interface brief")
print(output)

net_connect.disconnect()
print("Session closed.")`,
      output: [
        "Connected to 192.168.1.1",
        "Interface              IP-Address      OK? Method Status                Protocol",
        "GigabitEthernet0/0    192.168.1.1     YES manual up                    up",
        "GigabitEthernet0/1    10.0.0.1        YES manual up                    up",
        "Loopback0             1.1.1.1         YES manual up                    up",
        "Session closed."
      ],
    }] as CodeStep[],
    validations: [
      { label: "SSH connection established", pass: true },
      { label: "show ip interface brief retrieved", pass: true },
      { label: "Session disconnected cleanly", pass: true },
    ],
    explanation: "Netmiko's ConnectHandler handles SSH negotiation. send_command() runs a single command and waits for the prompt before returning output.",
    hints: ["Use device_type 'cisco_ios' for IOS devices", "send_command() is for non-config commands"],
    logs: ["[SSH] Connected to 192.168.1.1:22", "[EXEC] show ip interface brief", "[SSH] Disconnected"],
  },
  {
    id: "py-netmiko-config", name: "Netmiko: Push Config", category: "Python Networking", mode: "Python Lab",
    objective: "Push a multi-line configuration to a router using Netmiko's send_config_set().",
    steps: [{
      code: `from netmiko import ConnectHandler

device = {
    "device_type": "cisco_ios",
    "host": "192.168.1.1",
    "username": "admin",
    "password": "cisco123",
}

net_connect = ConnectHandler(**device)

config_commands = [
    "interface Loopback99",
    "ip address 99.99.99.99 255.255.255.255",
    "description Configured-by-Python",
    "no shutdown",
]

output = net_connect.send_config_set(config_commands)
print(output)

# Verify
verify = net_connect.send_command("show ip interface brief | include Loopback99")
print("Verification:", verify)

net_connect.save_config()
print("Config saved to startup-config.")
net_connect.disconnect()`,
      output: [
        "configure terminal",
        "Enter configuration commands, one per line.  End with CNTL/Z.",
        "Router1(config)#interface Loopback99",
        "Router1(config-if)#ip address 99.99.99.99 255.255.255.255",
        "Router1(config-if)#description Configured-by-Python",
        "Router1(config-if)#no shutdown",
        "Router1(config-if)#end",
        "Router1#",
        "Verification: Loopback99             99.99.99.99     YES manual up                    up",
        "Config saved to startup-config."
      ],
    }] as CodeStep[],
    validations: [
      { label: "Config commands sent successfully", pass: true },
      { label: "Loopback99 created with correct IP", pass: true },
      { label: "Configuration saved to NVRAM", pass: true },
    ],
    explanation: "send_config_set() enters config mode, sends each command, then exits. save_config() writes to startup-config (equivalent to 'copy run start').",
    hints: ["Pass a list of commands to send_config_set()", "Always verify config changes after pushing"],
    logs: ["[CONFIG] 4 commands pushed", "[VERIFY] Loopback99 up/up", "[SAVE] write memory"],
  },
  {
    id: "py-multi-device", name: "Multi-Device Inventory", category: "Python Networking", mode: "Python Lab",
    objective: "Loop through multiple devices, collect hostname and version, and build an inventory dictionary.",
    steps: [{
      code: `from netmiko import ConnectHandler
import re

devices = [
    {"device_type": "cisco_ios", "host": "192.168.1.1", "username": "admin", "password": "cisco123"},
    {"device_type": "cisco_ios", "host": "192.168.1.2", "username": "admin", "password": "cisco123"},
    {"device_type": "cisco_ios", "host": "192.168.1.3", "username": "admin", "password": "cisco123"},
]

inventory = {}

for device in devices:
    print(f"Connecting to {device['host']}...")
    conn = ConnectHandler(**device)
    
    hostname = conn.find_prompt().rstrip("#>")
    version_output = conn.send_command("show version | include IOS")
    
    match = re.search(r"Version ([\\w.()]+)", version_output)
    ios_version = match.group(1) if match else "Unknown"
    
    inventory[hostname] = {
        "ip": device["host"],
        "ios_version": ios_version,
    }
    conn.disconnect()

print("\\n=== Network Inventory ===")
for name, info in inventory.items():
    print(f"  {name}: IP={info['ip']}, IOS={info['ios_version']}")`,
      output: [
        "Connecting to 192.168.1.1...",
        "Connecting to 192.168.1.2...",
        "Connecting to 192.168.1.3...",
        "",
        "=== Network Inventory ===",
        "  Router1: IP=192.168.1.1, IOS=15.7(3)M5",
        "  Router2: IP=192.168.1.2, IOS=15.7(3)M5",
        "  Switch1: IP=192.168.1.3, IOS=15.2(7)E2"
      ],
    }] as CodeStep[],
    validations: [
      { label: "All 3 devices contacted", pass: true },
      { label: "Hostnames extracted from prompts", pass: true },
      { label: "IOS versions parsed with regex", pass: true },
    ],
    explanation: "Looping through a device list is the foundation of network automation at scale. find_prompt() returns the CLI prompt, and regex extracts structured data from show output.",
    hints: ["Use find_prompt() to get the device hostname", "re.search() with named groups makes parsing reliable"],
    logs: ["[INVENTORY] 3/3 devices scanned", "[PARSE] Versions extracted via regex"],
  },
  {
    id: "py-concurrent-ssh", name: "Concurrent SSH with Threading", category: "Python Networking", mode: "Python Lab",
    objective: "Use concurrent.futures to SSH into 5 devices simultaneously and collect interface status.",
    steps: [{
      code: `from netmiko import ConnectHandler
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

devices = [
    {"device_type": "cisco_ios", "host": f"192.168.1.{i}", "username": "admin", "password": "cisco123"}
    for i in range(1, 6)
]

def get_interfaces(device):
    conn = ConnectHandler(**device)
    hostname = conn.find_prompt().rstrip("#>")
    output = conn.send_command("show ip interface brief")
    conn.disconnect()
    return hostname, output

start = time.time()

results = {}
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(get_interfaces, d): d["host"] for d in devices}
    for future in as_completed(futures):
        hostname, output = future.result()
        results[hostname] = output
        print(f"✓ {hostname} collected")

elapsed = time.time() - start
print(f"\\nCompleted {len(results)} devices in {elapsed:.1f}s")`,
      output: [
        "✓ Router1 collected",
        "✓ Router3 collected",
        "✓ Router2 collected",
        "✓ Switch1 collected",
        "✓ Switch2 collected",
        "",
        "Completed 5 devices in 3.2s"
      ],
    }] as CodeStep[],
    validations: [
      { label: "ThreadPoolExecutor with 5 workers", pass: true },
      { label: "All 5 devices queried concurrently", pass: true },
      { label: "Results collected via as_completed()", pass: true },
    ],
    explanation: "ThreadPoolExecutor runs SSH sessions in parallel threads. as_completed() yields futures as they finish, regardless of submission order. This is critical for scaling to hundreds of devices.",
    hints: ["max_workers controls parallelism", "as_completed() returns results as they arrive, not in order"],
    logs: ["[THREAD] 5 workers spawned", "[SSH] All sessions completed", "[PERF] 3.2s total (vs ~15s sequential)"],
  },
  {
    id: "py-backup-configs", name: "Automated Config Backup", category: "Python Networking", mode: "Python Lab",
    objective: "Backup running-config from multiple routers to timestamped local files.",
    steps: [{
      code: `from netmiko import ConnectHandler
from datetime import datetime
import os

devices = [
    {"device_type": "cisco_ios", "host": "192.168.1.1", "username": "admin", "password": "cisco123"},
    {"device_type": "cisco_ios", "host": "192.168.1.2", "username": "admin", "password": "cisco123"},
]

backup_dir = "./backups"
os.makedirs(backup_dir, exist_ok=True)
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

for device in devices:
    conn = ConnectHandler(**device)
    hostname = conn.find_prompt().rstrip("#>")
    
    config = conn.send_command("show running-config")
    
    filename = f"{backup_dir}/{hostname}_{timestamp}.cfg"
    with open(filename, "w") as f:
        f.write(config)
    
    print(f"✓ {hostname} backed up → {filename} ({len(config)} bytes)")
    conn.disconnect()

print(f"\\nBackup complete. Files saved to {backup_dir}/")`,
      output: [
        "✓ Router1 backed up → ./backups/Router1_20250115_143022.cfg (4823 bytes)",
        "✓ Router2 backed up → ./backups/Router2_20250115_143025.cfg (3912 bytes)",
        "",
        "Backup complete. Files saved to ./backups/"
      ],
    }] as CodeStep[],
    validations: [
      { label: "Backup directory created", pass: true },
      { label: "Configs saved with timestamp filenames", pass: true },
      { label: "File sizes logged for verification", pass: true },
    ],
    explanation: "Automated config backup is a critical operational task. Timestamped filenames allow versioned history. This script forms the basis of a nightly backup cron job.",
    hints: ["Use os.makedirs with exist_ok=True", "strftime formats the timestamp for filenames"],
    logs: ["[BACKUP] 2 configs saved", "[FS] ./backups/ directory created"],
  },
  {
    id: "py-parse-cdp", name: "Parse CDP Neighbors", category: "Python Networking", mode: "Python Lab",
    objective: "Parse 'show cdp neighbors detail' with regex to build a neighbor adjacency map.",
    steps: [{
      code: `from netmiko import ConnectHandler
import re

device = {
    "device_type": "cisco_ios",
    "host": "192.168.1.1",
    "username": "admin",
    "password": "cisco123",
}

conn = ConnectHandler(**device)
cdp_output = conn.send_command("show cdp neighbors detail")
conn.disconnect()

# Parse CDP entries
pattern = r"Device ID: (\\S+).*?IP address: (\\S+).*?Interface: (\\S+),.*?Port ID.*?: (\\S+)"
matches = re.findall(pattern, cdp_output, re.DOTALL)

neighbors = []
for device_id, ip, local_intf, remote_intf in matches:
    neighbors.append({
        "neighbor": device_id,
        "ip": ip,
        "local_interface": local_intf,
        "remote_interface": remote_intf,
    })

print("=== CDP Neighbor Map ===")
for n in neighbors:
    print(f"  {n['local_interface']} ←→ {n['neighbor']}({n['remote_interface']}) IP: {n['ip']}")
print(f"\\nTotal neighbors: {len(neighbors)}")`,
      output: [
        "=== CDP Neighbor Map ===",
        "  GigabitEthernet0/0 ←→ Switch1(GigabitEthernet0/1) IP: 192.168.1.2",
        "  GigabitEthernet0/1 ←→ Router2(GigabitEthernet0/0) IP: 10.0.0.2",
        "  Serial0/0/0 ←→ Router3(Serial0/0/1) IP: 172.16.0.2",
        "",
        "Total neighbors: 3"
      ],
    }] as CodeStep[],
    validations: [
      { label: "CDP detail output collected", pass: true },
      { label: "Regex extracts device, IP, interfaces", pass: true },
      { label: "Adjacency map printed correctly", pass: true },
    ],
    explanation: "CDP (Cisco Discovery Protocol) reveals directly connected neighbors. Regex with re.DOTALL handles multi-line blocks. This data feeds topology visualization tools.",
    hints: ["Use re.DOTALL so '.' matches newlines", "Each CDP entry spans multiple lines"],
    logs: ["[CDP] 3 neighbors discovered", "[PARSE] Regex matched all entries"],
  },
  {
    id: "py-textfsm-parse", name: "TextFSM Structured Parsing", category: "Python Networking", mode: "Python Lab",
    objective: "Use TextFSM with ntc-templates to parse 'show ip route' into structured data.",
    steps: [{
      code: `from netmiko import ConnectHandler

device = {
    "device_type": "cisco_ios",
    "host": "192.168.1.1",
    "username": "admin",
    "password": "cisco123",
}

conn = ConnectHandler(**device)

# use_textfsm=True auto-selects the correct TextFSM template
routes = conn.send_command("show ip route", use_textfsm=True)
conn.disconnect()

print(f"{'Protocol':<10} {'Network':<20} {'Mask':<18} {'Next Hop':<16} {'Interface'}")
print("-" * 80)

for route in routes:
    print(f"{route['protocol']:<10} {route['network']:<20} {route['mask']:<18} "
          f"{route.get('nexthop_ip', 'direct'):<16} {route.get('nexthop_if', '')}")

print(f"\\nTotal routes: {len(routes)}")`,
      output: [
        "Protocol   Network              Mask               Next Hop         Interface",
        "--------------------------------------------------------------------------------",
        "C          192.168.1.0          255.255.255.0      direct           GigabitEthernet0/0",
        "S          10.0.0.0             255.255.255.0      192.168.1.2      GigabitEthernet0/0",
        "O          172.16.0.0           255.255.0.0        192.168.1.3      GigabitEthernet0/1",
        "O IA       10.10.0.0            255.255.255.0      192.168.1.3      GigabitEthernet0/1",
        "S*         0.0.0.0              0.0.0.0            192.168.1.254    GigabitEthernet0/0",
        "",
        "Total routes: 5"
      ],
    }] as CodeStep[],
    validations: [
      { label: "TextFSM parsing enabled", pass: true },
      { label: "Routes returned as list of dicts", pass: true },
      { label: "Protocol, network, mask, next-hop extracted", pass: true },
    ],
    explanation: "TextFSM converts unstructured CLI output into structured Python dicts. ntc-templates provides pre-built templates for hundreds of commands across vendors.",
    hints: ["use_textfsm=True is the easiest integration", "ntc-templates must be installed: pip install ntc-templates"],
    logs: ["[TEXTFSM] Template: cisco_ios_show_ip_route.textfsm", "[PARSE] 5 routes parsed"],
  },
  {
    id: "py-napalm-getters", name: "NAPALM: Vendor-Agnostic Getters", category: "Python Networking", mode: "Python Lab",
    objective: "Use NAPALM to retrieve facts, interfaces, and ARP table in a vendor-neutral way.",
    steps: [{
      code: `from napalm import get_network_driver

driver = get_network_driver("ios")
device = driver(
    hostname="192.168.1.1",
    username="admin",
    password="cisco123",
)

device.open()
print("Connected via NAPALM\\n")

# Get device facts
facts = device.get_facts()
print(f"Hostname: {facts['hostname']}")
print(f"Vendor: {facts['vendor']}")
print(f"Model: {facts['model']}")
print(f"OS Version: {facts['os_version']}")
print(f"Uptime: {facts['uptime']}s\\n")

# Get interfaces
interfaces = device.get_interfaces()
print("=== Interfaces ===")
for name, info in interfaces.items():
    status = "UP" if info["is_up"] else "DOWN"
    print(f"  {name}: {status}, Speed: {info['speed']}Mbps, MAC: {info['mac_address']}")

# Get ARP table
arp = device.get_arp_table()
print(f"\\nARP entries: {len(arp)}")
for entry in arp[:3]:
    print(f"  {entry['ip']} → {entry['mac']} (VLAN {entry.get('interface', 'N/A')})")

device.close()`,
      output: [
        "Connected via NAPALM",
        "",
        "Hostname: Router1",
        "Vendor: Cisco",
        "Model: ISR4331",
        "OS Version: 16.9.5",
        "Uptime: 864000s",
        "",
        "=== Interfaces ===",
        "  GigabitEthernet0/0/0: UP, Speed: 1000Mbps, MAC: aa:bb:cc:00:01:01",
        "  GigabitEthernet0/0/1: UP, Speed: 1000Mbps, MAC: aa:bb:cc:00:01:02",
        "  Loopback0: UP, Speed: 0Mbps, MAC: ",
        "",
        "ARP entries: 12",
        "  192.168.1.2 → aa:bb:cc:00:02:01 (VLAN GigabitEthernet0/0/0)",
        "  192.168.1.3 → aa:bb:cc:00:03:01 (VLAN GigabitEthernet0/0/0)",
        "  10.0.0.2 → aa:bb:cc:00:04:01 (VLAN GigabitEthernet0/0/1)"
      ],
    }] as CodeStep[],
    validations: [
      { label: "NAPALM driver loaded for IOS", pass: true },
      { label: "Device facts retrieved", pass: true },
      { label: "Interfaces and ARP table collected", pass: true },
    ],
    explanation: "NAPALM provides vendor-agnostic getters (get_facts, get_interfaces, get_arp_table, etc.) that return consistent Python dicts regardless of whether the device is Cisco, Juniper, or Arista.",
    hints: ["get_network_driver('ios') for Cisco IOS", "All getters return Python dicts with standardized keys"],
    logs: ["[NAPALM] Driver: ios", "[GET] facts, interfaces, arp_table"],
  },
  {
    id: "py-napalm-config-replace", name: "NAPALM: Config Replace & Diff", category: "Python Networking", mode: "Python Lab",
    objective: "Use NAPALM to load a candidate config, view the diff, and commit or discard changes.",
    steps: [{
      code: `from napalm import get_network_driver

driver = get_network_driver("ios")
device = driver(
    hostname="192.168.1.1",
    username="admin",
    password="cisco123",
)
device.open()

# Load candidate config (merge mode)
config = \"\"\"
interface Loopback100
 ip address 100.100.100.100 255.255.255.255
 description NAPALM-Managed
!
\"\"\"

device.load_merge_candidate(config=config)

# Show diff before committing
diff = device.compare_config()
print("=== Configuration Diff ===")
print(diff)

if diff:
    print("\\nCommitting changes...")
    device.commit_config()
    print("✓ Changes committed successfully")
else:
    print("\\nNo changes to commit")
    device.discard_config()

device.close()`,
      output: [
        "=== Configuration Diff ===",
        "+interface Loopback100",
        "+ ip address 100.100.100.100 255.255.255.255",
        "+ description NAPALM-Managed",
        "",
        "Committing changes...",
        "✓ Changes committed successfully"
      ],
    }] as CodeStep[],
    validations: [
      { label: "Candidate config loaded", pass: true },
      { label: "Config diff generated before commit", pass: true },
      { label: "Changes committed atomically", pass: true },
    ],
    explanation: "NAPALM's config management follows a candidate/commit model. load_merge_candidate() stages changes, compare_config() shows the diff, and commit_config() applies atomically. discard_config() rolls back if needed.",
    hints: ["load_merge_candidate for additive changes", "load_replace_candidate for full config replacement"],
    logs: ["[NAPALM] Candidate loaded (merge)", "[DIFF] +3 lines", "[COMMIT] Applied"],
  },
  {
    id: "py-paramiko-raw", name: "Paramiko: Raw SSH Session", category: "Python Networking", mode: "Python Lab",
    objective: "Use Paramiko directly for low-level SSH control — send commands and read output byte-by-byte.",
    steps: [{
      code: `import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("Connecting via Paramiko...")
ssh.connect("192.168.1.1", username="admin", password="cisco123", look_for_keys=False)

remote_conn = ssh.invoke_shell()
time.sleep(1)

# Clear banner
output = remote_conn.recv(65535).decode("utf-8")
print("Banner:", output.strip().split("\\n")[-1])

# Send commands
commands = ["terminal length 0", "show version | include uptime"]
for cmd in commands:
    remote_conn.send(cmd + "\\n")
    time.sleep(1)
    output = remote_conn.recv(65535).decode("utf-8")
    for line in output.strip().split("\\n"):
        if line and not line.startswith(cmd):
            print(f"  {line.strip()}")

ssh.close()
print("\\nSSH session closed.")`,
      output: [
        "Connecting via Paramiko...",
        "Banner: Router1>",
        "  Router1 uptime is 10 days, 4 hours, 32 minutes",
        "",
        "SSH session closed."
      ],
    }] as CodeStep[],
    validations: [
      { label: "Paramiko SSH connection established", pass: true },
      { label: "invoke_shell() opened interactive session", pass: true },
      { label: "Command output read from buffer", pass: true },
    ],
    explanation: "Paramiko gives raw SSH control — useful when Netmiko's abstractions don't fit (e.g., interactive prompts, custom timing). invoke_shell() opens an interactive channel. You must manage timing and buffer reads manually.",
    hints: ["Always set terminal length 0 to avoid --More-- prompts", "recv(65535) reads up to 64KB from the buffer"],
    logs: ["[PARAMIKO] SSH-2.0 session to 192.168.1.1", "[SHELL] Interactive channel opened"],
  },
  {
    id: "py-jinja2-templates", name: "Jinja2: Config Templates", category: "Python Networking", mode: "Python Lab",
    objective: "Generate device configs from Jinja2 templates and YAML data for consistent multi-device deployment.",
    steps: [{
      code: `from jinja2 import Template
import yaml

# Device data (normally loaded from YAML file)
data = {
    "devices": [
        {"hostname": "Branch-RTR-01", "mgmt_ip": "10.1.1.1", "ospf_area": 0,
         "interfaces": [
             {"name": "GigabitEthernet0/0", "ip": "192.168.10.1", "mask": "255.255.255.0", "description": "LAN"},
             {"name": "GigabitEthernet0/1", "ip": "10.0.0.1", "mask": "255.255.255.252", "description": "WAN"},
         ]},
        {"hostname": "Branch-RTR-02", "mgmt_ip": "10.1.2.1", "ospf_area": 1,
         "interfaces": [
             {"name": "GigabitEthernet0/0", "ip": "192.168.20.1", "mask": "255.255.255.0", "description": "LAN"},
             {"name": "GigabitEthernet0/1", "ip": "10.0.0.5", "mask": "255.255.255.252", "description": "WAN"},
         ]},
    ]
}

template_str = \"\"\"!
hostname {{ device.hostname }}
!
{% for intf in device.interfaces %}
interface {{ intf.name }}
 description {{ intf.description }}
 ip address {{ intf.ip }} {{ intf.mask }}
 no shutdown
!
{% endfor %}
router ospf 1
 router-id {{ device.mgmt_ip }}
 network {{ device.interfaces[0].ip }} 0.0.0.255 area {{ device.ospf_area }}
!
\"\"\"

template = Template(template_str)

for device in data["devices"]:
    config = template.render(device=device)
    print(f"=== {device['hostname']} ===")
    print(config)`,
      output: [
        "=== Branch-RTR-01 ===",
        "!",
        "hostname Branch-RTR-01",
        "!",
        "interface GigabitEthernet0/0",
        " description LAN",
        " ip address 192.168.10.1 255.255.255.0",
        " no shutdown",
        "!",
        "interface GigabitEthernet0/1",
        " description WAN",
        " ip address 10.0.0.1 255.255.255.252",
        " no shutdown",
        "!",
        "router ospf 1",
        " router-id 10.1.1.1",
        " network 192.168.10.1 0.0.0.255 area 0",
        "!",
        "",
        "=== Branch-RTR-02 ===",
        "!",
        "hostname Branch-RTR-02",
        "!",
        "interface GigabitEthernet0/0",
        " description LAN",
        " ip address 192.168.20.1 255.255.255.0",
        " no shutdown",
        "!",
        "interface GigabitEthernet0/1",
        " description WAN",
        " ip address 10.0.0.5 255.255.255.252",
        " no shutdown",
        "!",
        "router ospf 1",
        " router-id 10.1.2.1",
        " network 192.168.20.1 0.0.0.255 area 1",
        "!",
      ],
    }] as CodeStep[],
    validations: [
      { label: "Jinja2 template rendered for 2 devices", pass: true },
      { label: "Interface blocks generated with loops", pass: true },
      { label: "OSPF config injected per device", pass: true },
    ],
    explanation: "Jinja2 templates separate config logic from data. Combined with YAML, this is the standard approach for generating consistent configs across hundreds of devices — the foundation of Network as Code.",
    hints: ["{% for %} loops generate repeating blocks", "{{ variable }} inserts values"],
    logs: ["[JINJA2] 2 configs rendered", "[TEMPLATE] 2 interfaces per device"],
  },
  {
    id: "py-ping-sweep", name: "Ping Sweep & Subnet Scanner", category: "Python Networking", mode: "Python Lab",
    objective: "Scan a /24 subnet using concurrent pings and report live hosts with response times.",
    steps: [{
      code: `import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def ping_host(ip):
    result = subprocess.run(
        ["ping", "-c", "1", "-W", "1", str(ip)],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        # Extract RTT from output
        for line in result.stdout.split("\\n"):
            if "time=" in line:
                rtt = line.split("time=")[1].split()[0]
                return ip, True, rtt
    return ip, False, None

subnet = "192.168.1"
print(f"Scanning {subnet}.0/24...")
start = time.time()

live_hosts = []
with ThreadPoolExecutor(max_workers=50) as executor:
    futures = {executor.submit(ping_host, f"{subnet}.{i}"): i for i in range(1, 255)}
    for future in as_completed(futures):
        ip, alive, rtt = future.result()
        if alive:
            live_hosts.append((ip, rtt))
            print(f"  ✓ {ip} — {rtt}ms")

elapsed = time.time() - start
print(f"\\nScan complete: {len(live_hosts)}/254 hosts alive ({elapsed:.1f}s)")`,
      output: [
        "Scanning 192.168.1.0/24...",
        "  ✓ 192.168.1.1 — 1.23ms",
        "  ✓ 192.168.1.2 — 0.89ms",
        "  ✓ 192.168.1.3 — 2.14ms",
        "  ✓ 192.168.1.10 — 1.56ms",
        "  ✓ 192.168.1.20 — 3.21ms",
        "  ✓ 192.168.1.254 — 0.45ms",
        "",
        "Scan complete: 6/254 hosts alive (2.8s)"
      ],
    }] as CodeStep[],
    validations: [
      { label: "Subnet scanned with 50 threads", pass: true },
      { label: "Live hosts detected with RTT", pass: true },
      { label: "Scan completed in under 5 seconds", pass: true },
    ],
    explanation: "Ping sweeps discover active hosts on a subnet. ThreadPoolExecutor with 50 workers scans 254 IPs in parallel. subprocess.run() executes OS-level ping commands.",
    hints: ["Use -c 1 -W 1 for a single ping with 1s timeout", "50 workers is a good balance for most networks"],
    logs: ["[SCAN] 254 IPs queued", "[RESULT] 6 live hosts"],
  },
  {
    id: "py-snmp-poll", name: "SNMP Polling with PySNMP", category: "Python Networking", mode: "Python Lab",
    objective: "Poll SNMP OIDs (sysName, sysUpTime, ifOperStatus) from a network device using PySNMP.",
    steps: [{
      code: `from pysnmp.hlapi import (
    getCmd, SnmpEngine, CommunityData, UdpTransportTarget,
    ContextData, ObjectType, ObjectIdentity
)

target = "192.168.1.1"
community = "public"

oids = {
    "sysName": "1.3.6.1.2.1.1.5.0",
    "sysUpTime": "1.3.6.1.2.1.1.3.0",
    "sysDescr": "1.3.6.1.2.1.1.1.0",
    "ifNumber": "1.3.6.1.2.1.2.1.0",
}

print(f"SNMP polling {target} (community: {community})\\n")

for name, oid in oids.items():
    errorIndication, errorStatus, errorIndex, varBinds = next(
        getCmd(
            SnmpEngine(),
            CommunityData(community),
            UdpTransportTarget((target, 161)),
            ContextData(),
            ObjectType(ObjectIdentity(oid))
        )
    )
    
    if errorIndication:
        print(f"  ✗ {name}: {errorIndication}")
    elif errorStatus:
        print(f"  ✗ {name}: {errorStatus.prettyPrint()}")
    else:
        for varBind in varBinds:
            print(f"  ✓ {name}: {varBind[1].prettyPrint()}")

print("\\nSNMP polling complete.")`,
      output: [
        "SNMP polling 192.168.1.1 (community: public)",
        "",
        "  ✓ sysName: Router1.lab.local",
        "  ✓ sysUpTime: 8640000 (100 days, 0:00:00)",
        "  ✓ sysDescr: Cisco IOS Software, ISR Software (ISR4331), Version 16.9.5",
        "  ✓ ifNumber: 5",
        "",
        "SNMP polling complete."
      ],
    }] as CodeStep[],
    validations: [
      { label: "SNMP GET requests sent to device", pass: true },
      { label: "sysName, sysUpTime, sysDescr retrieved", pass: true },
      { label: "Error handling for SNMP failures", pass: true },
    ],
    explanation: "PySNMP implements SNMP v1/v2c/v3 in pure Python. getCmd() sends GET requests for specific OIDs. This is essential for monitoring tools, CMDB population, and health dashboards.",
    hints: ["Standard OIDs: 1.3.6.1.2.1.1.x for system MIB", "Use SNMPv3 in production for security"],
    logs: ["[SNMP] 4 OIDs polled via SNMPv2c", "[RESULT] All OIDs returned successfully"],
  },
  {
    id: "py-netconf-yang", name: "NETCONF/YANG with ncclient", category: "Python Networking", mode: "Python Lab",
    objective: "Use ncclient to retrieve and edit device configuration via NETCONF (RFC 6241) with YANG models.",
    steps: [{
      code: `from ncclient import manager
from xml.dom.minidom import parseString

device = {
    "host": "192.168.1.1",
    "port": 830,
    "username": "admin",
    "password": "cisco123",
    "hostkey_verify": False,
    "device_params": {"name": "csr"},
}

print("Connecting via NETCONF...")
with manager.connect(**device) as m:
    print(f"Session ID: {m.session_id}")
    print(f"NETCONF capabilities: {len(m.server_capabilities)}")
    
    # Get running config for interfaces
    filter_xml = """
    <filter>
      <native xmlns="http://cisco.com/ns/yang/Cisco-IOS-XE-native">
        <interface>
          <GigabitEthernet>
            <name>1</name>
          </GigabitEthernet>
        </interface>
      </native>
    </filter>
    """
    
    reply = m.get_config(source="running", filter=filter_xml)
    pretty = parseString(str(reply)).toprettyxml(indent="  ")
    
    # Print relevant lines
    for line in pretty.split("\\n")[2:12]:
        if line.strip():
            print(line)
    
    # Edit config — change description
    edit_config = """
    <config>
      <native xmlns="http://cisco.com/ns/yang/Cisco-IOS-XE-native">
        <interface>
          <GigabitEthernet>
            <name>1</name>
            <description>NETCONF-Managed</description>
          </GigabitEthernet>
        </interface>
      </native>
    </config>
    """
    
    m.edit_config(target="running", config=edit_config)
    print("\\n✓ Interface description updated via NETCONF")`,
      output: [
        "Connecting via NETCONF...",
        "Session ID: 42",
        "NETCONF capabilities: 87",
        "  <native xmlns=\"http://cisco.com/ns/yang/Cisco-IOS-XE-native\">",
        "    <interface>",
        "      <GigabitEthernet>",
        "        <name>1</name>",
        "        <ip>",
        "          <address>",
        "            <primary>",
        "              <address>192.168.1.1</address>",
        "",
        "✓ Interface description updated via NETCONF"
      ],
    }] as CodeStep[],
    validations: [
      { label: "NETCONF session established on port 830", pass: true },
      { label: "Running config retrieved with XML filter", pass: true },
      { label: "Config edited via edit_config()", pass: true },
    ],
    explanation: "NETCONF is the modern API for network device management, using XML-encoded YANG data models. ncclient provides a Pythonic interface. Unlike CLI scraping, NETCONF offers transactional, structured, vendor-standard configuration management.",
    hints: ["NETCONF runs on TCP port 830", "YANG models define the data schema"],
    logs: ["[NETCONF] Session 42 established", "[RPC] get-config with filter", "[RPC] edit-config applied"],
  },
  {
    id: "py-restconf-api", name: "RESTCONF: REST API for IOS-XE", category: "Python Networking", mode: "Python Lab",
    objective: "Use Python requests to interact with a Cisco IOS-XE device via RESTCONF API (YANG over HTTP).",
    steps: [{
      code: `import requests
import json

requests.packages.urllib3.disable_warnings()

BASE_URL = "https://192.168.1.1/restconf"
HEADERS = {
    "Accept": "application/yang-data+json",
    "Content-Type": "application/yang-data+json",
}
AUTH = ("admin", "cisco123")

# GET interfaces
print("=== GET Interfaces ===")
resp = requests.get(
    f"{BASE_URL}/data/ietf-interfaces:interfaces",
    headers=HEADERS, auth=AUTH, verify=False
)
interfaces = resp.json()["ietf-interfaces:interfaces"]["interface"]

for intf in interfaces:
    print(f"  {intf['name']}: {intf.get('description', 'No description')}")

# PATCH — update interface description
print("\\n=== PATCH Interface ===")
payload = {
    "ietf-interfaces:interface": {
        "name": "GigabitEthernet1",
        "description": "Updated-via-RESTCONF",
    }
}

resp = requests.patch(
    f"{BASE_URL}/data/ietf-interfaces:interfaces/interface=GigabitEthernet1",
    headers=HEADERS, auth=AUTH, verify=False,
    data=json.dumps(payload)
)

print(f"  Status: {resp.status_code} ({'OK' if resp.ok else 'FAILED'})")
print("  ✓ Description updated via RESTCONF")`,
      output: [
        "=== GET Interfaces ===",
        "  GigabitEthernet1: LAN-Uplink",
        "  GigabitEthernet2: WAN-Link",
        "  Loopback0: Management",
        "",
        "=== PATCH Interface ===",
        "  Status: 204 (OK)",
        "  ✓ Description updated via RESTCONF"
      ],
    }] as CodeStep[],
    validations: [
      { label: "RESTCONF GET retrieves interface list", pass: true },
      { label: "JSON response parsed correctly", pass: true },
      { label: "PATCH updates config (HTTP 204)", pass: true },
    ],
    explanation: "RESTCONF (RFC 8040) exposes YANG models over HTTPS using standard HTTP verbs (GET, POST, PUT, PATCH, DELETE). It's the most developer-friendly way to automate modern network devices.",
    hints: ["RESTCONF uses port 443 (HTTPS)", "Accept header must be 'application/yang-data+json'"],
    logs: ["[RESTCONF] GET /data/ietf-interfaces:interfaces → 200", "[RESTCONF] PATCH GigabitEthernet1 → 204"],
  },
  {
    id: "py-config-diff", name: "Config Diff & Compliance Check", category: "Python Networking", mode: "Python Lab",
    objective: "Compare a device's running config against a golden template and report non-compliant sections.",
    steps: [{
      code: `from netmiko import ConnectHandler
import difflib

device = {
    "device_type": "cisco_ios",
    "host": "192.168.1.1",
    "username": "admin",
    "password": "cisco123",
}

# Golden template (expected config)
golden_config = \"\"\"
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
no ip http server
no ip http secure-server
!
banner motd ^Unauthorized access prohibited^
!
line con 0
 exec-timeout 5 0
 logging synchronous
line vty 0 4
 transport input ssh
 exec-timeout 5 0
\"\"\".strip().split("\\n")

conn = ConnectHandler(**device)
running = conn.send_command("show running-config")
conn.disconnect()

running_lines = running.strip().split("\\n")

# Generate diff
diff = list(difflib.unified_diff(
    golden_config, running_lines,
    fromfile="golden-template",
    tofile="running-config",
    lineterm=""
))

print("=== Compliance Report ===\\n")

missing = [l[1:] for l in diff if l.startswith("-") and not l.startswith("---")]
extra = [l[1:] for l in diff if l.startswith("+") and not l.startswith("+++")]

if missing:
    print("✗ MISSING from running-config:")
    for line in missing[:5]:
        print(f"    - {line}")

if extra:
    print("\\n⚠ EXTRA in running-config (review needed):")
    for line in extra[:5]:
        print(f"    + {line}")

if not missing and not extra:
    print("✓ Device is COMPLIANT with golden template")
else:
    print(f"\\nCompliance: FAILED ({len(missing)} missing, {len(extra)} extra lines)")`,
      output: [
        "=== Compliance Report ===",
        "",
        "✗ MISSING from running-config:",
        "    - service password-encryption",
        "    - banner motd ^Unauthorized access prohibited^",
        "    - line vty 0 4",
        "",
        "⚠ EXTRA in running-config (review needed):",
        "    + ip http server",
        "    + line vty 0 4",
        "",
        "Compliance: FAILED (3 missing, 2 extra lines)"
      ],
    }] as CodeStep[],
    validations: [
      { label: "Running config fetched from device", pass: true },
      { label: "Unified diff generated against golden template", pass: true },
      { label: "Missing and extra lines identified", pass: true },
    ],
    explanation: "Config compliance checking compares live device configs against approved golden templates. difflib.unified_diff() produces standard diffs. This is foundational for security auditing and change management.",
    hints: ["difflib is in Python's standard library", "Strip and split configs into line lists before comparing"],
    logs: ["[COMPLIANCE] Golden template: 14 lines", "[DIFF] 3 missing, 2 extra lines"],
  },
  {
    id: "py-csv-report", name: "CSV/Excel Inventory Report", category: "Python Networking", mode: "Python Lab",
    objective: "Collect device data from multiple routers and generate a CSV inventory report.",
    steps: [{
      code: `from netmiko import ConnectHandler
import csv
import re
from datetime import datetime

devices = [
    {"device_type": "cisco_ios", "host": "192.168.1.1", "username": "admin", "password": "cisco123"},
    {"device_type": "cisco_ios", "host": "192.168.1.2", "username": "admin", "password": "cisco123"},
    {"device_type": "cisco_ios", "host": "192.168.1.3", "username": "admin", "password": "cisco123"},
]

report = []

for device in devices:
    conn = ConnectHandler(**device)
    hostname = conn.find_prompt().rstrip("#>")
    
    version = conn.send_command("show version", use_textfsm=True)
    if isinstance(version, list) and version:
        ver = version[0]
    else:
        ver = {"hardware": ["Unknown"], "version": "Unknown", "serial": ["Unknown"]}
    
    uptime = conn.send_command("show version | include uptime")
    intf_count = conn.send_command("show ip interface brief | count up")
    
    report.append({
        "hostname": hostname,
        "ip": device["host"],
        "model": ver.get("hardware", ["Unknown"])[0],
        "ios_version": ver.get("version", "Unknown"),
        "serial": ver.get("serial", ["Unknown"])[0],
        "uptime": uptime.split("is")[1].strip() if "is" in uptime else "Unknown",
        "active_interfaces": re.search(r"(\\d+)", intf_count).group(1) if intf_count else "0",
    })
    conn.disconnect()

# Write CSV
filename = f"network_inventory_{datetime.now().strftime('%Y%m%d')}.csv"
with open(filename, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=report[0].keys())
    writer.writeheader()
    writer.writerows(report)

print(f"=== Inventory Report ({filename}) ===\\n")
print(f"{'Hostname':<15} {'IP':<16} {'Model':<12} {'IOS':<12} {'Uptime'}")
print("-" * 70)
for r in report:
    print(f"{r['hostname']:<15} {r['ip']:<16} {r['model']:<12} {r['ios_version']:<12} {r['uptime']}")
print(f"\\n✓ Report saved: {filename}")`,
      output: [
        "=== Inventory Report (network_inventory_20250115.csv) ===",
        "",
        "Hostname        IP               Model        IOS          Uptime",
        "----------------------------------------------------------------------",
        "Router1         192.168.1.1      ISR4331      16.9.5       10 days, 4 hours",
        "Router2         192.168.1.2      ISR4321      16.9.5       45 days, 12 hours",
        "Switch1         192.168.1.3      WS-C3850     16.6.5       90 days, 8 hours",
        "",
        "✓ Report saved: network_inventory_20250115.csv"
      ],
    }] as CodeStep[],
    validations: [
      { label: "Data collected from 3 devices", pass: true },
      { label: "CSV file written with headers", pass: true },
      { label: "Report includes model, IOS, serial, uptime", pass: true },
    ],
    explanation: "Generating inventory reports automates what NOC teams do manually. csv.DictWriter creates structured output. This integrates with CMDB tools, monitoring dashboards, and audit systems.",
    hints: ["csv.DictWriter uses dict keys as column headers", "TextFSM returns structured dicts from show version"],
    logs: ["[INVENTORY] 3 devices scanned", "[CSV] Report written with 7 columns"],
  },
  {
    id: "py-log-analyzer", name: "Syslog Analyzer & Alerter", category: "Python Networking", mode: "Python Lab",
    objective: "Parse syslog messages from a file, categorize severity, and generate an alert summary.",
    steps: [{
      code: `import re
from collections import Counter
from datetime import datetime

# Simulated syslog data (normally read from /var/log/syslog or syslog server)
syslog_data = \"\"\"
Jan 15 08:12:01 Router1 %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down
Jan 15 08:12:02 Router1 %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to down
Jan 15 08:15:30 Switch1 %STP-2-RECV_PVSTPDU: Received PVST+ BPDU on STP PVST+ port
Jan 15 08:20:45 Router2 %SEC-6-IPACCESSLOGP: list OUTSIDE denied tcp 10.0.0.5(49322) -> 192.168.1.1(22)
Jan 15 08:21:10 Router2 %SEC-6-IPACCESSLOGP: list OUTSIDE denied tcp 10.0.0.5(49323) -> 192.168.1.1(22)
Jan 15 08:21:11 Router2 %SEC-6-IPACCESSLOGP: list OUTSIDE denied tcp 10.0.0.5(49324) -> 192.168.1.1(22)
Jan 15 09:00:00 Router1 %OSPF-5-ADJCHG: Process 1, Nbr 2.2.2.2 on Gi0/0 from FULL to DOWN
Jan 15 09:00:01 Router1 %LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to down
Jan 15 09:05:00 Switch1 %PORT_SECURITY-2-PSECURE_VIOLATION: Security violation on Fa0/5
\"\"\".strip()

pattern = r"(\\w+ \\d+ [\\d:]+) (\\S+) %([\\w-]+)-(\\d)-([\\w]+): (.+)"
events = []

for line in syslog_data.split("\\n"):
    match = re.match(pattern, line)
    if match:
        timestamp, host, facility, severity, mnemonic, message = match.groups()
        events.append({
            "time": timestamp, "host": host, "facility": facility,
            "severity": int(severity), "mnemonic": mnemonic, "message": message,
        })

# Categorize
severity_map = {0: "EMERG", 1: "ALERT", 2: "CRIT", 3: "ERROR", 4: "WARN", 5: "NOTICE", 6: "INFO", 7: "DEBUG"}
critical_events = [e for e in events if e["severity"] <= 3]
host_counts = Counter(e["host"] for e in events)

print("=== Syslog Analysis Report ===\\n")
print(f"Total events: {len(events)}")
print(f"Critical/Error events: {len(critical_events)}\\n")

print("Events by host:")
for host, count in host_counts.most_common():
    print(f"  {host}: {count} events")

print("\\n⚠ Critical Alerts:")
for e in critical_events:
    print(f"  [{severity_map[e['severity']]}] {e['time']} {e['host']}: {e['message']}")

# Detect patterns
ssh_denies = [e for e in events if "denied" in e["message"] and "22" in e["message"]]
if len(ssh_denies) >= 3:
    print(f"\\n🚨 ALERT: {len(ssh_denies)} SSH brute-force attempts detected from logs!")`,
      output: [
        "=== Syslog Analysis Report ===",
        "",
        "Total events: 9",
        "Critical/Error events: 4",
        "",
        "Events by host:",
        "  Router1: 4 events",
        "  Router2: 3 events",
        "  Switch1: 2 events",
        "",
        "⚠ Critical Alerts:",
        "  [ERROR] Jan 15 08:12:01 Router1: Interface GigabitEthernet0/1, changed state to down",
        "  [CRIT] Jan 15 08:15:30 Switch1: Received PVST+ BPDU on STP PVST+ port",
        "  [ERROR] Jan 15 09:00:01 Router1: Interface GigabitEthernet0/0, changed state to down",
        "  [CRIT] Jan 15 09:05:00 Switch1: Security violation on Fa0/5",
        "",
        "🚨 ALERT: 3 SSH brute-force attempts detected from logs!"
      ],
    }] as CodeStep[],
    validations: [
      { label: "Syslog messages parsed with regex", pass: true },
      { label: "Events categorized by severity", pass: true },
      { label: "SSH brute-force pattern detected", pass: true },
    ],
    explanation: "Syslog analysis is a core NOC skill. Cisco syslog format is %FACILITY-SEVERITY-MNEMONIC. Severity 0-3 are critical. Pattern detection (e.g., repeated SSH denies) enables automated alerting.",
    hints: ["Cisco severity: 0=emergency through 7=debug", "Use Counter for quick aggregation"],
    logs: ["[SYSLOG] 9 events parsed", "[ALERT] SSH brute-force pattern matched"],
  },
  {
    id: "py-subnet-calc", name: "IP Subnet Calculator", category: "Python Networking", mode: "Python Lab",
    objective: "Build a subnet calculator using Python's ipaddress module — calculate networks, hosts, and VLSM subnets.",
    steps: [{
      code: `import ipaddress

# Basic subnet analysis
network = ipaddress.ip_network("10.0.0.0/22")

print("=== Subnet Analysis: 10.0.0.0/22 ===\\n")
print(f"Network Address:   {network.network_address}")
print(f"Broadcast Address: {network.broadcast_address}")
print(f"Subnet Mask:       {network.netmask}")
print(f"Wildcard Mask:     {network.hostmask}")
print(f"Total Addresses:   {network.num_addresses}")
print(f"Usable Hosts:      {network.num_addresses - 2}")
print(f"First Host:        {list(network.hosts())[0]}")
print(f"Last Host:         {list(network.hosts())[-1]}")

# VLSM Subnetting
print("\\n=== VLSM Subnetting ===")
print("Requirement: Split 192.168.1.0/24 into subnets for:")
print("  Department A: 100 hosts")
print("  Department B: 50 hosts")
print("  Department C: 25 hosts")
print("  Point-to-point links: 2 hosts x3\\n")

parent = ipaddress.ip_network("192.168.1.0/24")
requirements = [
    ("Dept A", 100), ("Dept B", 50), ("Dept C", 25),
    ("P2P Link 1", 2), ("P2P Link 2", 2), ("P2P Link 3", 2),
]

# Sort by size descending for VLSM
requirements.sort(key=lambda x: x[1], reverse=True)

allocated = []
next_network = parent.network_address

for name, hosts_needed in requirements:
    # Calculate prefix length
    import math
    prefix_len = 32 - math.ceil(math.log2(hosts_needed + 2))
    subnet = ipaddress.ip_network(f"{next_network}/{prefix_len}")
    allocated.append((name, subnet, hosts_needed))
    next_network = subnet.broadcast_address + 1

print(f"{'Subnet':<18} {'Name':<14} {'Prefix':<8} {'Usable':<8} {'Needed'}")
print("-" * 60)
for name, subnet, needed in allocated:
    usable = subnet.num_addresses - 2
    print(f"{str(subnet):<18} {name:<14} /{subnet.prefixlen:<6} {usable:<8} {needed}")`,
      output: [
        "=== Subnet Analysis: 10.0.0.0/22 ===",
        "",
        "Network Address:   10.0.0.0",
        "Broadcast Address: 10.0.3.255",
        "Subnet Mask:       255.255.252.0",
        "Wildcard Mask:     0.0.3.255",
        "Total Addresses:   1024",
        "Usable Hosts:      1022",
        "First Host:        10.0.0.1",
        "Last Host:         10.0.3.254",
        "",
        "=== VLSM Subnetting ===",
        "Requirement: Split 192.168.1.0/24 into subnets for:",
        "  Department A: 100 hosts",
        "  Department B: 50 hosts",
        "  Department C: 25 hosts",
        "  Point-to-point links: 2 hosts x3",
        "",
        "Subnet             Name           Prefix   Usable   Needed",
        "------------------------------------------------------------",
        "192.168.1.0/25     Dept A         /25      126      100",
        "192.168.1.128/26   Dept B         /26      62       50",
        "192.168.1.192/27   Dept C         /27      30       25",
        "192.168.1.224/30   P2P Link 1     /30      2        2",
        "192.168.1.228/30   P2P Link 2     /30      2        2",
        "192.168.1.232/30   P2P Link 3     /30      2        2"
      ],
    }] as CodeStep[],
    validations: [
      { label: "Subnet details calculated correctly", pass: true },
      { label: "VLSM allocations fit within /24", pass: true },
      { label: "Point-to-point links use /30 prefix", pass: true },
    ],
    explanation: "Python's ipaddress module handles all subnet math. VLSM (Variable Length Subnet Masking) allocates the largest subnets first, then carves smaller ones from remaining space. This eliminates manual binary calculation.",
    hints: ["ipaddress.ip_network() creates network objects", "Sort requirements largest-first for efficient VLSM"],
    logs: ["[CALC] 10.0.0.0/22: 1022 usable hosts", "[VLSM] 6 subnets allocated from /24"],
  },
  {
    id: "py-ansible-playbook", name: "Ansible Playbook via Python", category: "Python Networking", mode: "Python Lab",
    objective: "Execute an Ansible network playbook programmatically using ansible-runner from Python.",
    steps: [{
      code: `import json

# Simulating ansible-runner execution
# In production: import ansible_runner; r = ansible_runner.run(...)

playbook = {
    "name": "Configure OSPF on All Routers",
    "hosts": "routers",
    "gather_facts": False,
    "tasks": [
        {
            "name": "Enable OSPF process",
            "cisco.ios.ios_ospfv2": {
                "config": {
                    "processes": [{
                        "process_id": 1,
                        "router_id": "{{ router_id }}",
                        "areas": [{"area_id": "0.0.0.0", "ranges": [{"address": "{{ ospf_network }}"}]}],
                    }]
                },
                "state": "merged"
            }
        },
        {
            "name": "Verify OSPF neighbors",
            "cisco.ios.ios_command": {
                "commands": ["show ip ospf neighbor"]
            },
            "register": "ospf_output"
        },
        {
            "name": "Display OSPF neighbors",
            "ansible.builtin.debug": {
                "var": "ospf_output.stdout_lines"
            }
        }
    ]
}

# Simulate inventory
inventory = {
    "routers": {
        "hosts": {
            "router1": {"ansible_host": "192.168.1.1", "router_id": "1.1.1.1", "ospf_network": "192.168.1.0/24"},
            "router2": {"ansible_host": "192.168.1.2", "router_id": "2.2.2.2", "ospf_network": "192.168.2.0/24"},
            "router3": {"ansible_host": "192.168.1.3", "router_id": "3.3.3.3", "ospf_network": "192.168.3.0/24"},
        }
    }
}

print("=== Ansible Playbook: Configure OSPF ===\\n")
print(f"Playbook: {playbook['name']}")
print(f"Hosts: {list(inventory['routers']['hosts'].keys())}\\n")

# Simulate execution
for host, vars in inventory["routers"]["hosts"].items():
    print(f"TASK [{host}] Enable OSPF process .............. ok")
    print(f"TASK [{host}] Verify OSPF neighbors ............ ok")

print(f"\\nPLAY RECAP {'=' * 40}")
for host in inventory["routers"]["hosts"]:
    print(f"  {host:<15} : ok=3    changed=1    failed=0")

print(f"\\n✓ Playbook completed successfully on {len(inventory['routers']['hosts'])} hosts")`,
      output: [
        "=== Ansible Playbook: Configure OSPF ===",
        "",
        "Playbook: Configure OSPF on All Routers",
        "Hosts: ['router1', 'router2', 'router3']",
        "",
        "TASK [router1] Enable OSPF process .............. ok",
        "TASK [router1] Verify OSPF neighbors ............ ok",
        "TASK [router2] Enable OSPF process .............. ok",
        "TASK [router2] Verify OSPF neighbors ............ ok",
        "TASK [router3] Enable OSPF process .............. ok",
        "TASK [router3] Verify OSPF neighbors ............ ok",
        "",
        "PLAY RECAP ========================================",
        "  router1         : ok=3    changed=1    failed=0",
        "  router2         : ok=3    changed=1    failed=0",
        "  router3         : ok=3    changed=1    failed=0",
        "",
        "✓ Playbook completed successfully on 3 hosts"
      ],
    }] as CodeStep[],
    validations: [
      { label: "Playbook YAML structure defined", pass: true },
      { label: "Inventory with per-host variables", pass: true },
      { label: "All 3 hosts configured successfully", pass: true },
    ],
    explanation: "Ansible with cisco.ios collection provides declarative network automation. ios_ospfv2 uses resource modules for idempotent OSPF config. ansible-runner allows programmatic execution from Python scripts.",
    hints: ["cisco.ios collection has resource modules for all major features", "state: merged adds config without removing existing"],
    logs: ["[ANSIBLE] Playbook started: 3 hosts", "[RESULT] ok=9, changed=3, failed=0"],
  },
];
