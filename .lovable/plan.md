
# 10 CCNP-Level Multi-Device Lab Scenarios

Each lab includes 6-10 devices, accurate IOS commands, proper IP addressing, and verification steps.

---

## 1. eBGP Multi-Homed Internet Edge (8 devices)
- **Topology**: 2 ISP routers, 2 edge routers (eBGP), 1 core router (iBGP), 2 switches, 1 server
- **Skills**: eBGP peering, AS-path prepending, local-preference, route filtering with prefix-lists, default route origination
- **Key commands**: `router bgp`, `neighbor remote-as`, `ip prefix-list`, `route-map`, `set local-preference`, `set as-path prepend`
- **Verification**: `show ip bgp summary`, `show ip bgp`, `show ip route bgp`, verify preferred path selection

## 2. DMVPN Phase 3 Hub-and-Spoke (8 devices)
- **Topology**: 1 hub router, 3 spoke routers, 1 NHRP server (hub), 2 LAN switches, 1 PC
- **Skills**: mGRE tunnel, NHRP, IPsec profile, EIGRP over DMVPN, spoke-to-spoke direct tunnels
- **Key commands**: `interface Tunnel0`, `tunnel mode gre multipoint`, `ip nhrp map multicast dynamic`, `ip nhrp redirect`, `ip nhrp shortcut`, `crypto ipsec profile`
- **Verification**: `show dmvpn`, `show ip nhrp`, `show crypto ipsec sa`, verify spoke-to-spoke reachability

## 3. VRF-Lite with Route Leaking (7 devices)
- **Topology**: 1 core router (VRF-aware), 2 distribution routers, 2 switches, 2 PCs in different VRFs
- **Skills**: VRF definition, per-VRF routing (OSPF instances), route leaking via static routes, inter-VRF communication
- **Key commands**: `ip vrf`, `rd`, `interface ... ip vrf forwarding`, `router ospf vrf`, `ip route vrf`
- **Verification**: `show ip vrf`, `show ip route vrf`, ping between VRFs via leaked routes

## 4. Dual-Stack IPv4/IPv6 with OSPFv3 (6 devices)
- **Topology**: 3 routers (triangle), 2 switches, 1 dual-stack server
- **Skills**: IPv6 addressing (GUA + link-local), OSPFv3 for IPv6, OSPFv2 for IPv4, dual-stack verification
- **Key commands**: `ipv6 unicast-routing`, `ipv6 address`, `ipv6 router ospf`, `ipv6 ospf area`, `ospfv3`
- **Verification**: `show ipv6 ospf neighbor`, `show ipv6 route ospf`, `ping ipv6`, verify dual-stack reachability

## 5. EIGRP Named Mode with Redistribution (8 devices)
- **Topology**: 2 EIGRP routers, 2 OSPF routers, 1 redistribution router (ASBR), 2 switches, 1 PC
- **Skills**: EIGRP named mode config, OSPF config, mutual redistribution, route tagging to prevent loops, distribute-list filtering
- **Key commands**: `router eigrp NAMED`, `address-family ipv4 unicast autonomous-system`, `redistribute ospf`, `redistribute eigrp`, `route-map`, `set tag`, `match tag`
- **Verification**: `show ip eigrp topology`, `show ip route`, verify no routing loops, verify external routes (D EX, O E2)

## 6. GRE over IPsec Site-to-Site VPN (7 devices)
- **Topology**: 2 site routers, 1 ISP router (simulated internet), 2 LAN switches, 2 PCs
- **Skills**: GRE tunnel, IPsec IKEv2 config, crypto keyring, tunnel protection, OSPF over tunnel
- **Key commands**: `crypto ikev2 proposal`, `crypto ikev2 policy`, `crypto ikev2 profile`, `crypto ipsec transform-set`, `crypto ipsec profile`, `tunnel protection ipsec profile`
- **Verification**: `show crypto ikev2 sa`, `show crypto ipsec sa`, `show interface tunnel`, ping across sites

## 7. Spanning Tree Optimization (MST + BPDU Guard) (8 devices)
- **Topology**: 2 core switches (MST root), 3 distribution switches, 2 access switches, 1 PC
- **Skills**: MST (802.1s) with multiple instances, root bridge placement, BPDU Guard, Root Guard, PortFast, Loop Guard
- **Key commands**: `spanning-tree mode mst`, `spanning-tree mst configuration`, `instance vlan`, `spanning-tree mst root primary`, `spanning-tree portfast`, `spanning-tree bpduguard enable`
- **Verification**: `show spanning-tree mst`, `show spanning-tree summary`, verify root bridge election per instance

## 8. First Hop Redundancy with VRRP + Policy-Based Routing (7 devices)
- **Topology**: 2 gateway routers (VRRP), 1 WAN router, 2 switches, 2 PCs in different VLANs
- **Skills**: VRRPv3, PBR with route-maps, ACL-based traffic steering, tracking objects for failover
- **Key commands**: `vrrp address-family`, `priority`, `track`, `route-map PBR`, `match ip address`, `set ip next-hop`, `ip policy route-map`
- **Verification**: `show vrrp brief`, `show route-map`, `show ip policy`, traceroute to verify path

## 9. MPLS L3VPN (PE-CE with BGP) (8 devices)
- **Topology**: 2 PE routers, 1 P router, 2 CE routers, 2 switches, 1 server
- **Skills**: MPLS LDP, VRF with RD/RT, MP-BGP VPNv4, PE-CE routing (OSPF or static), label switching
- **Key commands**: `mpls ip`, `mpls ldp router-id`, `ip vrf` with `rd` and `route-target`, `address-family vpnv4`, `neighbor activate`, `redistribute connected`
- **Verification**: `show mpls ldp neighbor`, `show mpls forwarding-table`, `show ip bgp vpnv4 all`, ping CE-to-CE across MPLS core

## 10. QoS - DiffServ with CBWFQ + LLQ (6 devices)
- **Topology**: 2 routers (WAN edge), 1 WAN link (shaped), 2 switches, 1 IP phone + 1 PC
- **Skills**: MQC (class-map, policy-map, service-policy), DSCP marking, CBWFQ, LLQ for voice, shaping on WAN interface, NBAR for application classification
- **Key commands**: `class-map match-any`, `match dscp`, `match protocol`, `policy-map`, `class VOICE priority`, `class DATA bandwidth`, `service-policy output`, `shape average`
- **Verification**: `show policy-map interface`, `show class-map`, verify DSCP markings, verify queue allocation

---

## Implementation Details
- Each lab: full topology data (nodes + links + interfaces + IPs), 15-30 config steps, 4-6 verification checks
- All IOS commands verified against Cisco IOS 15.x / IOS-XE syntax
- Proper subnet masks (no mismatches), correct interface naming (Gi/Fa/Lo/Tunnel/Vlan)
- Explanations on each critical step for learning context
- Node positions spread for clear topology rendering (no overlaps)
