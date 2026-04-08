export interface MultiDeviceStep {
  device: string;
  command: string;
  output: string[];
  explanation?: string;
}

export interface TopologyNode {
  id: string;
  type: "router" | "switch" | "pc" | "server";
  label: string;
  x: number;
  y: number;
  interfaces: { name: string; ip: string; mask: string; connectsTo?: string }[];
}

export interface TopologyLink {
  from: string;
  fromInterface: string;
  to: string;
  toInterface: string;
  label?: string;
  network: string;
}

export interface MultiDeviceLab {
  id: string;
  name: string;
  difficulty: "CCNA" | "CCNP" | "CCIE";
  category: string;
  objective: string;
  topology: {
    nodes: TopologyNode[];
    links: TopologyLink[];
  };
  steps: MultiDeviceStep[];
  verifications: { device: string; command: string; output: string[]; checkLabel: string }[];
  explanation: string;
}

export const multiDeviceLabs: MultiDeviceLab[] = [
  // ===== SCENARIO 1: Multi-Area OSPF with Route Summarization =====
  {
    id: "md-ospf-multi-area",
    name: "Multi-Area OSPF with Summarization",
    difficulty: "CCNP",
    category: "OSPF Advanced",
    objective: "Configure multi-area OSPF across 4 routers and 2 switches. R1 is the ABR between Area 0 and Area 1. R3 is the ABR between Area 0 and Area 2. Configure inter-area route summarization on ABRs. Verify full adjacency and routing.",
    topology: {
      nodes: [
        {
          id: "R1", type: "router", label: "R1 (ABR)", x: 200, y: 60,
          interfaces: [
            { name: "Gi0/0", ip: "10.0.12.1", mask: "255.255.255.252", connectsTo: "R2" },
            { name: "Gi0/1", ip: "10.0.13.1", mask: "255.255.255.252", connectsTo: "R3" },
            { name: "Gi0/2", ip: "10.1.1.1", mask: "255.255.255.0", connectsTo: "SW1" },
            { name: "Loopback0", ip: "1.1.1.1", mask: "255.255.255.255" },
          ],
        },
        {
          id: "R2", type: "router", label: "R2", x: 400, y: 60,
          interfaces: [
            { name: "Gi0/0", ip: "10.0.12.2", mask: "255.255.255.252", connectsTo: "R1" },
            { name: "Gi0/1", ip: "10.0.24.2", mask: "255.255.255.252", connectsTo: "R4" },
            { name: "Loopback0", ip: "2.2.2.2", mask: "255.255.255.255" },
          ],
        },
        {
          id: "R3", type: "router", label: "R3 (ABR)", x: 200, y: 260,
          interfaces: [
            { name: "Gi0/0", ip: "10.0.13.2", mask: "255.255.255.252", connectsTo: "R1" },
            { name: "Gi0/1", ip: "10.2.1.1", mask: "255.255.255.0", connectsTo: "SW2" },
            { name: "Gi0/2", ip: "10.2.2.1", mask: "255.255.255.0" },
            { name: "Gi0/3", ip: "10.2.3.1", mask: "255.255.255.0" },
            { name: "Loopback0", ip: "3.3.3.3", mask: "255.255.255.255" },
          ],
        },
        {
          id: "R4", type: "router", label: "R4", x: 400, y: 260,
          interfaces: [
            { name: "Gi0/0", ip: "10.0.24.4", mask: "255.255.255.252", connectsTo: "R2" },
            { name: "Gi0/1", ip: "10.1.2.1", mask: "255.255.255.0" },
            { name: "Loopback0", ip: "4.4.4.4", mask: "255.255.255.255" },
          ],
        },
        {
          id: "SW1", type: "switch", label: "SW1", x: 80, y: 60,
          interfaces: [
            { name: "Vlan10", ip: "10.1.1.2", mask: "255.255.255.0", connectsTo: "R1" },
          ],
        },
        {
          id: "SW2", type: "switch", label: "SW2", x: 80, y: 260,
          interfaces: [
            { name: "Vlan20", ip: "10.2.1.2", mask: "255.255.255.0", connectsTo: "R3" },
          ],
        },
      ],
      links: [
        { from: "R1", fromInterface: "Gi0/0", to: "R2", toInterface: "Gi0/0", network: "10.0.12.0/30", label: "Area 0" },
        { from: "R1", fromInterface: "Gi0/1", to: "R3", toInterface: "Gi0/0", network: "10.0.13.0/30", label: "Area 0" },
        { from: "R2", fromInterface: "Gi0/1", to: "R4", toInterface: "Gi0/0", network: "10.0.24.0/30", label: "Area 0" },
        { from: "R1", fromInterface: "Gi0/2", to: "SW1", toInterface: "Gi0/1", network: "10.1.1.0/24", label: "Area 1" },
        { from: "R3", fromInterface: "Gi0/1", to: "SW2", toInterface: "Gi0/1", network: "10.2.1.0/24", label: "Area 2" },
      ],
    },
    steps: [
      // --- R1 base config ---
      { device: "R1", command: "enable", output: ["R1#"] },
      { device: "R1", command: "configure terminal", output: ["R1(config)#"] },
      { device: "R1", command: "interface Loopback0", output: ["R1(config-if)#"] },
      { device: "R1", command: "ip address 1.1.1.1 255.255.255.255", output: ["R1(config-if)#"] },
      { device: "R1", command: "interface GigabitEthernet0/0", output: ["R1(config-if)#"] },
      { device: "R1", command: "ip address 10.0.12.1 255.255.255.252", output: ["R1(config-if)#"] },
      { device: "R1", command: "no shutdown", output: ["R1(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up"] },
      { device: "R1", command: "interface GigabitEthernet0/1", output: ["R1(config-if)#"] },
      { device: "R1", command: "ip address 10.0.13.1 255.255.255.252", output: ["R1(config-if)#"] },
      { device: "R1", command: "no shutdown", output: ["R1(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to up"] },
      { device: "R1", command: "interface GigabitEthernet0/2", output: ["R1(config-if)#"] },
      { device: "R1", command: "ip address 10.1.1.1 255.255.255.0", output: ["R1(config-if)#"] },
      { device: "R1", command: "no shutdown", output: ["R1(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/2, changed state to up"] },
      { device: "R1", command: "exit", output: ["R1(config)#"], explanation: "R1 interfaces configured — now configure OSPF" },
      // R1 OSPF
      { device: "R1", command: "router ospf 1", output: ["R1(config-router)#"] },
      { device: "R1", command: "router-id 1.1.1.1", output: ["R1(config-router)#"] },
      { device: "R1", command: "network 10.0.12.0 0.0.0.3 area 0", output: ["R1(config-router)#"], explanation: "Gi0/0 link to R2 in Area 0" },
      { device: "R1", command: "network 10.0.13.0 0.0.0.3 area 0", output: ["R1(config-router)#"], explanation: "Gi0/1 link to R3 in Area 0" },
      { device: "R1", command: "network 10.1.1.0 0.0.0.255 area 1", output: ["R1(config-router)#"], explanation: "Gi0/2 LAN in Area 1 — R1 becomes ABR" },
      { device: "R1", command: "network 1.1.1.1 0.0.0.0 area 0", output: ["R1(config-router)#"] },
      // R1 Summarization for Area 1
      { device: "R1", command: "area 1 range 10.1.0.0 255.255.0.0", output: ["R1(config-router)#"], explanation: "Summarize Area 1 routes as 10.1.0.0/16 into Area 0" },
      { device: "R1", command: "end", output: ["R1#", "%SYS-5-CONFIG_I: Configured from console by console"] },

      // --- R2 config ---
      { device: "R2", command: "enable", output: ["R2#"] },
      { device: "R2", command: "configure terminal", output: ["R2(config)#"] },
      { device: "R2", command: "interface Loopback0", output: ["R2(config-if)#"] },
      { device: "R2", command: "ip address 2.2.2.2 255.255.255.255", output: ["R2(config-if)#"] },
      { device: "R2", command: "interface GigabitEthernet0/0", output: ["R2(config-if)#"] },
      { device: "R2", command: "ip address 10.0.12.2 255.255.255.252", output: ["R2(config-if)#"] },
      { device: "R2", command: "no shutdown", output: ["R2(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up"] },
      { device: "R2", command: "interface GigabitEthernet0/1", output: ["R2(config-if)#"] },
      { device: "R2", command: "ip address 10.0.24.2 255.255.255.252", output: ["R2(config-if)#"] },
      { device: "R2", command: "no shutdown", output: ["R2(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to up"] },
      { device: "R2", command: "exit", output: ["R2(config)#"] },
      { device: "R2", command: "router ospf 1", output: ["R2(config-router)#"] },
      { device: "R2", command: "router-id 2.2.2.2", output: ["R2(config-router)#"] },
      { device: "R2", command: "network 10.0.12.0 0.0.0.3 area 0", output: ["R2(config-router)#"] },
      { device: "R2", command: "network 10.0.24.0 0.0.0.3 area 0", output: ["R2(config-router)#"] },
      { device: "R2", command: "network 2.2.2.2 0.0.0.0 area 0", output: ["R2(config-router)#"] },
      { device: "R2", command: "end", output: ["R2#", "%OSPF-5-ADJCHG: Process 1, Nbr 1.1.1.1 on GigabitEthernet0/0 from LOADING to FULL"] },

      // --- R3 config (ABR Area 0 / Area 2) ---
      { device: "R3", command: "enable", output: ["R3#"] },
      { device: "R3", command: "configure terminal", output: ["R3(config)#"] },
      { device: "R3", command: "interface Loopback0", output: ["R3(config-if)#"] },
      { device: "R3", command: "ip address 3.3.3.3 255.255.255.255", output: ["R3(config-if)#"] },
      { device: "R3", command: "interface GigabitEthernet0/0", output: ["R3(config-if)#"] },
      { device: "R3", command: "ip address 10.0.13.2 255.255.255.252", output: ["R3(config-if)#"] },
      { device: "R3", command: "no shutdown", output: ["R3(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up"] },
      { device: "R3", command: "interface GigabitEthernet0/1", output: ["R3(config-if)#"] },
      { device: "R3", command: "ip address 10.2.1.1 255.255.255.0", output: ["R3(config-if)#"] },
      { device: "R3", command: "no shutdown", output: ["R3(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to up"] },
      { device: "R3", command: "interface GigabitEthernet0/2", output: ["R3(config-if)#"] },
      { device: "R3", command: "ip address 10.2.2.1 255.255.255.0", output: ["R3(config-if)#"] },
      { device: "R3", command: "no shutdown", output: ["R3(config-if)#"] },
      { device: "R3", command: "interface GigabitEthernet0/3", output: ["R3(config-if)#"] },
      { device: "R3", command: "ip address 10.2.3.1 255.255.255.0", output: ["R3(config-if)#"] },
      { device: "R3", command: "no shutdown", output: ["R3(config-if)#"] },
      { device: "R3", command: "exit", output: ["R3(config)#"] },
      { device: "R3", command: "router ospf 1", output: ["R3(config-router)#"] },
      { device: "R3", command: "router-id 3.3.3.3", output: ["R3(config-router)#"] },
      { device: "R3", command: "network 10.0.13.0 0.0.0.3 area 0", output: ["R3(config-router)#"] },
      { device: "R3", command: "network 10.2.0.0 0.0.3.255 area 2", output: ["R3(config-router)#"], explanation: "All 10.2.x.x networks in Area 2" },
      { device: "R3", command: "network 3.3.3.3 0.0.0.0 area 0", output: ["R3(config-router)#"] },
      { device: "R3", command: "area 2 range 10.2.0.0 255.255.0.0", output: ["R3(config-router)#"], explanation: "Summarize Area 2 as 10.2.0.0/16 into Area 0" },
      { device: "R3", command: "end", output: ["R3#", "%OSPF-5-ADJCHG: Process 1, Nbr 1.1.1.1 on GigabitEthernet0/0 from LOADING to FULL"] },

      // --- R4 config ---
      { device: "R4", command: "enable", output: ["R4#"] },
      { device: "R4", command: "configure terminal", output: ["R4(config)#"] },
      { device: "R4", command: "interface Loopback0", output: ["R4(config-if)#"] },
      { device: "R4", command: "ip address 4.4.4.4 255.255.255.255", output: ["R4(config-if)#"] },
      { device: "R4", command: "interface GigabitEthernet0/0", output: ["R4(config-if)#"] },
      { device: "R4", command: "ip address 10.0.24.4 255.255.255.252", output: ["R4(config-if)#"] },
      { device: "R4", command: "no shutdown", output: ["R4(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up"] },
      { device: "R4", command: "interface GigabitEthernet0/1", output: ["R4(config-if)#"] },
      { device: "R4", command: "ip address 10.1.2.1 255.255.255.0", output: ["R4(config-if)#"] },
      { device: "R4", command: "no shutdown", output: ["R4(config-if)#"] },
      { device: "R4", command: "exit", output: ["R4(config)#"] },
      { device: "R4", command: "router ospf 1", output: ["R4(config-router)#"] },
      { device: "R4", command: "router-id 4.4.4.4", output: ["R4(config-router)#"] },
      { device: "R4", command: "network 10.0.24.0 0.0.0.3 area 0", output: ["R4(config-router)#"] },
      { device: "R4", command: "network 10.1.2.0 0.0.0.255 area 0", output: ["R4(config-router)#"] },
      { device: "R4", command: "network 4.4.4.4 0.0.0.0 area 0", output: ["R4(config-router)#"] },
      { device: "R4", command: "end", output: ["R4#", "%OSPF-5-ADJCHG: Process 1, Nbr 2.2.2.2 on GigabitEthernet0/0 from LOADING to FULL"] },

      // --- SW1 L3 config ---
      { device: "SW1", command: "enable", output: ["SW1#"] },
      { device: "SW1", command: "configure terminal", output: ["SW1(config)#"] },
      { device: "SW1", command: "ip routing", output: ["SW1(config)#"], explanation: "Enable L3 routing on the switch" },
      { device: "SW1", command: "interface Vlan10", output: ["SW1(config-if)#"] },
      { device: "SW1", command: "ip address 10.1.1.2 255.255.255.0", output: ["SW1(config-if)#"] },
      { device: "SW1", command: "no shutdown", output: ["SW1(config-if)#"] },
      { device: "SW1", command: "exit", output: ["SW1(config)#"] },
      { device: "SW1", command: "interface GigabitEthernet0/1", output: ["SW1(config-if)#"] },
      { device: "SW1", command: "no switchport", output: ["SW1(config-if)#"], explanation: "Convert to routed port" },
      { device: "SW1", command: "ip address 10.1.1.3 255.255.255.0", output: ["SW1(config-if)#"] },
      { device: "SW1", command: "no shutdown", output: ["SW1(config-if)#"] },
      { device: "SW1", command: "end", output: ["SW1#"] },

      // --- SW2 L3 config ---
      { device: "SW2", command: "enable", output: ["SW2#"] },
      { device: "SW2", command: "configure terminal", output: ["SW2(config)#"] },
      { device: "SW2", command: "ip routing", output: ["SW2(config)#"] },
      { device: "SW2", command: "interface Vlan20", output: ["SW2(config-if)#"] },
      { device: "SW2", command: "ip address 10.2.1.2 255.255.255.0", output: ["SW2(config-if)#"] },
      { device: "SW2", command: "no shutdown", output: ["SW2(config-if)#"] },
      { device: "SW2", command: "exit", output: ["SW2(config)#"] },
      { device: "SW2", command: "interface GigabitEthernet0/1", output: ["SW2(config-if)#"] },
      { device: "SW2", command: "no switchport", output: ["SW2(config-if)#"] },
      { device: "SW2", command: "ip address 10.2.1.3 255.255.255.0", output: ["SW2(config-if)#"] },
      { device: "SW2", command: "no shutdown", output: ["SW2(config-if)#"] },
      { device: "SW2", command: "end", output: ["SW2#"] },
    ],
    verifications: [
      {
        device: "R1", command: "show ip ospf neighbor", checkLabel: "R1 OSPF neighbors: R2 and R3 FULL",
        output: [
          "Neighbor ID  Pri  State      Dead Time  Address       Interface",
          "2.2.2.2        1  FULL/DR    00:00:35   10.0.12.2     GigabitEthernet0/0",
          "3.3.3.3        1  FULL/DR    00:00:31   10.0.13.2     GigabitEthernet0/1",
        ],
      },
      {
        device: "R2", command: "show ip ospf neighbor", checkLabel: "R2 OSPF neighbors: R1 and R4 FULL",
        output: [
          "Neighbor ID  Pri  State      Dead Time  Address       Interface",
          "1.1.1.1        1  FULL/BDR   00:00:33   10.0.12.1     GigabitEthernet0/0",
          "4.4.4.4        1  FULL/DR    00:00:36   10.0.24.4     GigabitEthernet0/1",
        ],
      },
      {
        device: "R1", command: "show ip ospf border-routers", checkLabel: "R1 recognized as ABR",
        output: [
          "OSPF Router with ID (1.1.1.1) (Process ID 1)",
          "  Area Border Router (ABR)",
        ],
      },
      {
        device: "R2", command: "show ip route ospf", checkLabel: "R2 sees summarized routes 10.1.0.0/16 and 10.2.0.0/16",
        output: [
          "O IA  10.1.0.0/16 [110/2] via 10.0.12.1, 00:02:15, GigabitEthernet0/0",
          "O IA  10.2.0.0/16 [110/3] via 10.0.12.1, 00:01:45, GigabitEthernet0/0",
          "O     10.0.13.0/30 [110/2] via 10.0.12.1, 00:02:15, GigabitEthernet0/0",
        ],
      },
      {
        device: "R4", command: "ping 10.2.1.1 source 10.0.24.4", checkLabel: "R4 can reach Area 2 network (10.2.1.1)",
        output: [
          "Type escape sequence to abort.",
          "Sending 5, 100-byte ICMP Echos to 10.2.1.1, timeout is 2 seconds:",
          "!!!!!",
          "Success rate is 100 percent (5/5), round-trip min/avg/max = 2/4/8 ms",
        ],
      },
    ],
    explanation: "This lab demonstrates OSPF multi-area design. R1 is the ABR between Area 0 and Area 1. R3 is the ABR between Area 0 and Area 2. The 'area range' command on each ABR summarizes internal area routes before injecting them into Area 0, reducing the LSDB size and improving convergence. R2 and R4 (internal to Area 0) should see summary routes (O IA) instead of individual /24 prefixes.",
  },

  // ===== SCENARIO 2: HSRP + Inter-VLAN Routing + EtherChannel =====
  {
    id: "md-hsrp-intervlan",
    name: "HSRP + Inter-VLAN Routing + EtherChannel",
    difficulty: "CCNP",
    category: "Switching & HA",
    objective: "Configure a redundant campus network with 2 distribution switches (DSW1/DSW2) running HSRP for gateway redundancy, inter-VLAN routing for VLANs 10/20/30, EtherChannel (LACP) between distribution switches, and 2 access switches (ASW1/ASW2) with proper trunk/access port config.",
    topology: {
      nodes: [
        {
          id: "R1", type: "router", label: "R1 (Core)", x: 350, y: 10,
          interfaces: [
            { name: "Gi0/0", ip: "10.0.0.1", mask: "255.255.255.252", connectsTo: "DSW1" },
            { name: "Gi0/1", ip: "10.0.0.5", mask: "255.255.255.252", connectsTo: "DSW2" },
            { name: "Loopback0", ip: "1.1.1.1", mask: "255.255.255.255" },
          ],
        },
        {
          id: "DSW1", type: "switch", label: "DSW1 (Active)", x: 80, y: 160,
          interfaces: [
            { name: "Gi0/0", ip: "10.0.0.2", mask: "255.255.255.252", connectsTo: "R1" },
            { name: "Vlan10", ip: "192.168.10.2", mask: "255.255.255.0" },
            { name: "Vlan20", ip: "192.168.20.2", mask: "255.255.255.0" },
            { name: "Vlan30", ip: "192.168.30.2", mask: "255.255.255.0" },
            { name: "Po1", ip: "N/A", mask: "N/A", connectsTo: "DSW2" },
          ],
        },
        {
          id: "DSW2", type: "switch", label: "DSW2 (Standby)", x: 620, y: 160,
          interfaces: [
            { name: "Gi0/0", ip: "10.0.0.6", mask: "255.255.255.252", connectsTo: "R1" },
            { name: "Vlan10", ip: "192.168.10.3", mask: "255.255.255.0" },
            { name: "Vlan20", ip: "192.168.20.3", mask: "255.255.255.0" },
            { name: "Vlan30", ip: "192.168.30.3", mask: "255.255.255.0" },
            { name: "Po1", ip: "N/A", mask: "N/A", connectsTo: "DSW1" },
          ],
        },
        {
          id: "ASW1", type: "switch", label: "ASW1", x: 80, y: 360,
          interfaces: [
            { name: "Gi0/1", ip: "N/A", mask: "N/A", connectsTo: "DSW1" },
            { name: "Gi0/2", ip: "N/A", mask: "N/A", connectsTo: "DSW2" },
            { name: "Fa0/1", ip: "N/A", mask: "N/A" },
            { name: "Fa0/2", ip: "N/A", mask: "N/A" },
          ],
        },
        {
          id: "ASW2", type: "switch", label: "ASW2", x: 620, y: 360,
          interfaces: [
            { name: "Gi0/1", ip: "N/A", mask: "N/A", connectsTo: "DSW1" },
            { name: "Gi0/2", ip: "N/A", mask: "N/A", connectsTo: "DSW2" },
            { name: "Fa0/1", ip: "N/A", mask: "N/A" },
            { name: "Fa0/2", ip: "N/A", mask: "N/A" },
          ],
        },
        {
          id: "PC1", type: "pc", label: "PC1 (VLAN10)", x: 30, y: 520,
          interfaces: [{ name: "eth0", ip: "192.168.10.100", mask: "255.255.255.0" }],
        },
        {
          id: "PC2", type: "pc", label: "PC2 (VLAN20)", x: 280, y: 520,
          interfaces: [{ name: "eth0", ip: "192.168.20.100", mask: "255.255.255.0" }],
        },
        {
          id: "PC3", type: "pc", label: "PC3 (VLAN30)", x: 620, y: 520,
          interfaces: [{ name: "eth0", ip: "192.168.30.100", mask: "255.255.255.0" }],
        },
      ],
      links: [
        { from: "R1", fromInterface: "Gi0/0", to: "DSW1", toInterface: "Gi0/0", network: "10.0.0.0/30" },
        { from: "R1", fromInterface: "Gi0/1", to: "DSW2", toInterface: "Gi0/0", network: "10.0.0.4/30" },
        { from: "DSW1", fromInterface: "Po1", to: "DSW2", toInterface: "Po1", network: "EtherChannel (LACP)", label: "Po1" },
        { from: "DSW1", fromInterface: "Gi1/0", to: "ASW1", toInterface: "Gi0/1", network: "Trunk" },
        { from: "DSW2", fromInterface: "Gi1/0", to: "ASW2", toInterface: "Gi0/2", network: "Trunk" },
        { from: "DSW1", fromInterface: "Gi1/1", to: "ASW2", toInterface: "Gi0/1", network: "Trunk" },
        { from: "DSW2", fromInterface: "Gi1/1", to: "ASW1", toInterface: "Gi0/2", network: "Trunk" },
        { from: "ASW1", fromInterface: "Fa0/1", to: "PC1", toInterface: "eth0", network: "VLAN 10" },
        { from: "ASW1", fromInterface: "Fa0/2", to: "PC2", toInterface: "eth0", network: "VLAN 20" },
        { from: "ASW2", fromInterface: "Fa0/1", to: "PC3", toInterface: "eth0", network: "VLAN 30" },
      ],
    },
    steps: [
      // --- DSW1: VLANs, L3, Trunks ---
      { device: "DSW1", command: "enable", output: ["DSW1#"] },
      { device: "DSW1", command: "configure terminal", output: ["DSW1(config)#"] },
      { device: "DSW1", command: "vtp mode transparent", output: ["Setting device to VTP Transparent mode for VLANS.", "DSW1(config)#"], explanation: "Prevent VTP from overwriting VLAN config" },
      { device: "DSW1", command: "vlan 10", output: ["DSW1(config-vlan)#"] },
      { device: "DSW1", command: "name ENGINEERING", output: ["DSW1(config-vlan)#"] },
      { device: "DSW1", command: "vlan 20", output: ["DSW1(config-vlan)#"] },
      { device: "DSW1", command: "name SALES", output: ["DSW1(config-vlan)#"] },
      { device: "DSW1", command: "vlan 30", output: ["DSW1(config-vlan)#"] },
      { device: "DSW1", command: "name MANAGEMENT", output: ["DSW1(config-vlan)#"] },
      { device: "DSW1", command: "exit", output: ["DSW1(config)#"] },
      { device: "DSW1", command: "ip routing", output: ["DSW1(config)#"], explanation: "Enable L3 routing on distribution switch" },
      // DSW1 SVIs
      { device: "DSW1", command: "interface Vlan10", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "ip address 192.168.10.2 255.255.255.0", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "no shutdown", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "standby 10 ip 192.168.10.1", output: ["DSW1(config-if)#"], explanation: "HSRP virtual IP — this is the default gateway for VLAN 10 hosts" },
      { device: "DSW1", command: "standby 10 priority 110", output: ["DSW1(config-if)#"], explanation: "Higher priority makes DSW1 the HSRP Active router" },
      { device: "DSW1", command: "standby 10 preempt", output: ["DSW1(config-if)#"], explanation: "Preempt allows DSW1 to reclaim Active role after recovery" },
      { device: "DSW1", command: "interface Vlan20", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "ip address 192.168.20.2 255.255.255.0", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "no shutdown", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "standby 20 ip 192.168.20.1", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "standby 20 priority 110", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "standby 20 preempt", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "interface Vlan30", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "ip address 192.168.30.2 255.255.255.0", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "no shutdown", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "standby 30 ip 192.168.30.1", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "standby 30 priority 110", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "standby 30 preempt", output: ["DSW1(config-if)#"] },
      // DSW1 EtherChannel
      { device: "DSW1", command: "interface range GigabitEthernet0/1 - 2", output: ["DSW1(config-if-range)#"] },
      { device: "DSW1", command: "channel-group 1 mode active", output: ["DSW1(config-if-range)#", "Creating a port-channel interface Port-channel1"], explanation: "LACP active mode — DSW1 initiates negotiation" },
      { device: "DSW1", command: "exit", output: ["DSW1(config)#"] },
      { device: "DSW1", command: "interface Port-channel1", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport trunk encapsulation dot1q", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport mode trunk", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport trunk allowed vlan 10,20,30", output: ["DSW1(config-if)#"] },
      // DSW1 trunk to access switches
      { device: "DSW1", command: "interface GigabitEthernet1/0", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport trunk encapsulation dot1q", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport mode trunk", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport trunk allowed vlan 10,20,30", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "interface GigabitEthernet1/1", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport trunk encapsulation dot1q", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport mode trunk", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "switchport trunk allowed vlan 10,20,30", output: ["DSW1(config-if)#"] },
      // DSW1 uplink to core
      { device: "DSW1", command: "interface GigabitEthernet0/0", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "no switchport", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "ip address 10.0.0.2 255.255.255.252", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "no shutdown", output: ["DSW1(config-if)#"] },
      { device: "DSW1", command: "exit", output: ["DSW1(config)#"] },
      { device: "DSW1", command: "ip route 0.0.0.0 0.0.0.0 10.0.0.1", output: ["DSW1(config)#"], explanation: "Default route to core router" },
      { device: "DSW1", command: "end", output: ["DSW1#"] },

      // --- DSW2: Mirror config with lower HSRP priority ---
      { device: "DSW2", command: "enable", output: ["DSW2#"] },
      { device: "DSW2", command: "configure terminal", output: ["DSW2(config)#"] },
      { device: "DSW2", command: "vtp mode transparent", output: ["Setting device to VTP Transparent mode for VLANS.", "DSW2(config)#"] },
      { device: "DSW2", command: "vlan 10", output: ["DSW2(config-vlan)#"] },
      { device: "DSW2", command: "name ENGINEERING", output: ["DSW2(config-vlan)#"] },
      { device: "DSW2", command: "vlan 20", output: ["DSW2(config-vlan)#"] },
      { device: "DSW2", command: "name SALES", output: ["DSW2(config-vlan)#"] },
      { device: "DSW2", command: "vlan 30", output: ["DSW2(config-vlan)#"] },
      { device: "DSW2", command: "name MANAGEMENT", output: ["DSW2(config-vlan)#"] },
      { device: "DSW2", command: "exit", output: ["DSW2(config)#"] },
      { device: "DSW2", command: "ip routing", output: ["DSW2(config)#"] },
      { device: "DSW2", command: "interface Vlan10", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "ip address 192.168.10.3 255.255.255.0", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "no shutdown", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "standby 10 ip 192.168.10.1", output: ["DSW2(config-if)#"], explanation: "Same virtual IP — DSW2 is standby (default priority 100)" },
      { device: "DSW2", command: "standby 10 preempt", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "interface Vlan20", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "ip address 192.168.20.3 255.255.255.0", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "no shutdown", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "standby 20 ip 192.168.20.1", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "standby 20 preempt", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "interface Vlan30", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "ip address 192.168.30.3 255.255.255.0", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "no shutdown", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "standby 30 ip 192.168.30.1", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "standby 30 preempt", output: ["DSW2(config-if)#"] },
      // DSW2 EtherChannel
      { device: "DSW2", command: "interface range GigabitEthernet0/1 - 2", output: ["DSW2(config-if-range)#"] },
      { device: "DSW2", command: "channel-group 1 mode passive", output: ["DSW2(config-if-range)#", "Creating a port-channel interface Port-channel1"], explanation: "LACP passive — responds to DSW1's active negotiation" },
      { device: "DSW2", command: "exit", output: ["DSW2(config)#"] },
      { device: "DSW2", command: "interface Port-channel1", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport trunk encapsulation dot1q", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport mode trunk", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport trunk allowed vlan 10,20,30", output: ["DSW2(config-if)#"] },
      // DSW2 trunks to access
      { device: "DSW2", command: "interface GigabitEthernet1/0", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport trunk encapsulation dot1q", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport mode trunk", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport trunk allowed vlan 10,20,30", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "interface GigabitEthernet1/1", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport trunk encapsulation dot1q", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport mode trunk", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "switchport trunk allowed vlan 10,20,30", output: ["DSW2(config-if)#"] },
      // DSW2 uplink
      { device: "DSW2", command: "interface GigabitEthernet0/0", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "no switchport", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "ip address 10.0.0.6 255.255.255.252", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "no shutdown", output: ["DSW2(config-if)#"] },
      { device: "DSW2", command: "exit", output: ["DSW2(config)#"] },
      { device: "DSW2", command: "ip route 0.0.0.0 0.0.0.0 10.0.0.5", output: ["DSW2(config)#"] },
      { device: "DSW2", command: "end", output: ["DSW2#"] },

      // --- ASW1: Access ports ---
      { device: "ASW1", command: "enable", output: ["ASW1#"] },
      { device: "ASW1", command: "configure terminal", output: ["ASW1(config)#"] },
      { device: "ASW1", command: "vtp mode transparent", output: ["Setting device to VTP Transparent mode for VLANS.", "ASW1(config)#"] },
      { device: "ASW1", command: "vlan 10", output: ["ASW1(config-vlan)#"] },
      { device: "ASW1", command: "name ENGINEERING", output: ["ASW1(config-vlan)#"] },
      { device: "ASW1", command: "vlan 20", output: ["ASW1(config-vlan)#"] },
      { device: "ASW1", command: "name SALES", output: ["ASW1(config-vlan)#"] },
      { device: "ASW1", command: "exit", output: ["ASW1(config)#"] },
      // ASW1 trunks to distribution
      { device: "ASW1", command: "interface GigabitEthernet0/1", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport trunk encapsulation dot1q", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport mode trunk", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport trunk allowed vlan 10,20,30", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "interface GigabitEthernet0/2", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport trunk encapsulation dot1q", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport mode trunk", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport trunk allowed vlan 10,20,30", output: ["ASW1(config-if)#"] },
      // ASW1 access ports
      { device: "ASW1", command: "interface FastEthernet0/1", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport mode access", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport access vlan 10", output: ["ASW1(config-if)#"], explanation: "PC1 connects here — VLAN 10 (Engineering)" },
      { device: "ASW1", command: "spanning-tree portfast", output: ["ASW1(config-if)#", "%Warning: portfast should only be enabled on ports connected to a single host."] },
      { device: "ASW1", command: "interface FastEthernet0/2", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport mode access", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "switchport access vlan 20", output: ["ASW1(config-if)#"], explanation: "PC2 connects here — VLAN 20 (Sales)" },
      { device: "ASW1", command: "spanning-tree portfast", output: ["ASW1(config-if)#"] },
      { device: "ASW1", command: "end", output: ["ASW1#"] },

      // --- ASW2: Access ports ---
      { device: "ASW2", command: "enable", output: ["ASW2#"] },
      { device: "ASW2", command: "configure terminal", output: ["ASW2(config)#"] },
      { device: "ASW2", command: "vtp mode transparent", output: ["Setting device to VTP Transparent mode for VLANS.", "ASW2(config)#"] },
      { device: "ASW2", command: "vlan 30", output: ["ASW2(config-vlan)#"] },
      { device: "ASW2", command: "name MANAGEMENT", output: ["ASW2(config-vlan)#"] },
      { device: "ASW2", command: "exit", output: ["ASW2(config)#"] },
      { device: "ASW2", command: "interface GigabitEthernet0/1", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "switchport trunk encapsulation dot1q", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "switchport mode trunk", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "switchport trunk allowed vlan 10,20,30", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "interface GigabitEthernet0/2", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "switchport trunk encapsulation dot1q", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "switchport mode trunk", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "switchport trunk allowed vlan 10,20,30", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "interface FastEthernet0/1", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "switchport mode access", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "switchport access vlan 30", output: ["ASW2(config-if)#"], explanation: "PC3 connects here — VLAN 30 (Management)" },
      { device: "ASW2", command: "spanning-tree portfast", output: ["ASW2(config-if)#"] },
      { device: "ASW2", command: "end", output: ["ASW2#"] },

      // --- R1 Core: Routing back to campus ---
      { device: "R1", command: "enable", output: ["R1#"] },
      { device: "R1", command: "configure terminal", output: ["R1(config)#"] },
      { device: "R1", command: "interface Loopback0", output: ["R1(config-if)#"] },
      { device: "R1", command: "ip address 1.1.1.1 255.255.255.255", output: ["R1(config-if)#"] },
      { device: "R1", command: "interface GigabitEthernet0/0", output: ["R1(config-if)#"] },
      { device: "R1", command: "ip address 10.0.0.1 255.255.255.252", output: ["R1(config-if)#"] },
      { device: "R1", command: "no shutdown", output: ["R1(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up"] },
      { device: "R1", command: "interface GigabitEthernet0/1", output: ["R1(config-if)#"] },
      { device: "R1", command: "ip address 10.0.0.5 255.255.255.252", output: ["R1(config-if)#"] },
      { device: "R1", command: "no shutdown", output: ["R1(config-if)#", "%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to up"] },
      { device: "R1", command: "exit", output: ["R1(config)#"] },
      { device: "R1", command: "ip route 192.168.10.0 255.255.255.0 10.0.0.2", output: ["R1(config)#"], explanation: "Static routes to campus VLANs via DSW1" },
      { device: "R1", command: "ip route 192.168.20.0 255.255.255.0 10.0.0.2", output: ["R1(config)#"] },
      { device: "R1", command: "ip route 192.168.30.0 255.255.255.0 10.0.0.2", output: ["R1(config)#"] },
      { device: "R1", command: "ip route 192.168.10.0 255.255.255.0 10.0.0.6 5", output: ["R1(config)#"], explanation: "Floating static via DSW2 (AD 5 = backup)" },
      { device: "R1", command: "ip route 192.168.20.0 255.255.255.0 10.0.0.6 5", output: ["R1(config)#"] },
      { device: "R1", command: "ip route 192.168.30.0 255.255.255.0 10.0.0.6 5", output: ["R1(config)#"] },
      { device: "R1", command: "end", output: ["R1#"] },
    ],
    verifications: [
      {
        device: "DSW1", command: "show standby brief", checkLabel: "DSW1 is HSRP Active for all VLANs",
        output: [
          "Interface   Grp  Pri P State    Active          Standby         Virtual",
          "Vl10        10   110 P Active   local           192.168.10.3    192.168.10.1",
          "Vl20        20   110 P Active   local           192.168.20.3    192.168.20.1",
          "Vl30        30   110 P Active   local           192.168.30.3    192.168.30.1",
        ],
      },
      {
        device: "DSW2", command: "show standby brief", checkLabel: "DSW2 is HSRP Standby for all VLANs",
        output: [
          "Interface   Grp  Pri P State    Active          Standby         Virtual",
          "Vl10        10   100 P Standby  192.168.10.2    local           192.168.10.1",
          "Vl20        20   100 P Standby  192.168.20.2    local           192.168.20.1",
          "Vl30        30   100 P Standby  192.168.30.2    local           192.168.30.1",
        ],
      },
      {
        device: "DSW1", command: "show etherchannel summary", checkLabel: "EtherChannel Po1 is UP (SU) with LACP",
        output: [
          "Flags:  D - down        P - bundled in port-channel",
          "        I - stand-alone  s - suspended",
          "        U - in use       R - Layer3      S - Layer2",
          "",
          "Group  Port-channel  Protocol    Ports",
          "------+-------------+-----------+------",
          "1      Po1(SU)         LACP      Gi0/1(P)    Gi0/2(P)",
        ],
      },
      {
        device: "ASW1", command: "show vlan brief", checkLabel: "ASW1 has VLANs 10,20 with correct port assignments",
        output: [
          "VLAN Name                 Status    Ports",
          "---- -------------------- --------- ------",
          "1    default              active    ",
          "10   ENGINEERING          active    Fa0/1",
          "20   SALES                active    Fa0/2",
        ],
      },
      {
        device: "PC1", command: "ping 192.168.20.100", checkLabel: "PC1 (VLAN10) can reach PC2 (VLAN20) via inter-VLAN routing",
        output: [
          "PING 192.168.20.100 (192.168.20.100): 56 data bytes",
          "64 bytes from 192.168.20.100: icmp_seq=0 ttl=63 time=2.1 ms",
          "64 bytes from 192.168.20.100: icmp_seq=1 ttl=63 time=1.8 ms",
          "--- 192.168.20.100 ping statistics ---",
          "2 packets transmitted, 2 packets received, 0% packet loss",
        ],
      },
      {
        device: "PC1", command: "ping 192.168.30.100", checkLabel: "PC1 (VLAN10) can reach PC3 (VLAN30) across switches",
        output: [
          "PING 192.168.30.100 (192.168.30.100): 56 data bytes",
          "64 bytes from 192.168.30.100: icmp_seq=0 ttl=62 time=3.4 ms",
          "64 bytes from 192.168.30.100: icmp_seq=1 ttl=62 time=2.9 ms",
          "--- 192.168.30.100 ping statistics ---",
          "2 packets transmitted, 2 packets received, 0% packet loss",
        ],
      },
    ],
    explanation: "This lab builds a production-like campus network. HSRP provides gateway redundancy — if DSW1 fails, DSW2 takes over as Active gateway seamlessly. EtherChannel (LACP) bundles two physical links for redundancy and bandwidth. Inter-VLAN routing on the distribution layer SVIs allows traffic between VLANs without a dedicated router. The core router (R1) uses floating static routes for WAN path redundancy.",
  },
];
