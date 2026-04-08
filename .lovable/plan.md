
# Network AI Simulation Workspace

## Overview
A single-screen, multi-pane NOC + coding lab simulator with 4 workspace modes (Network, Python, Terraform, AI Coding), all 8 labs fully mocked with pre-scripted sequences, and a dark professional engineering-tool aesthetic.

## Layout Structure
Full-screen dark layout with 5 panels:
- **Top bar (56px)**: Logo "SIMULATOR", breadcrumb trail, Lab Mode dropdown (Network/Python/Terraform/AI Coding), student session indicator
- **Left sidebar (280px)**: Search bar + collapsible category tree (Fundamentals, Routing, Switching, Troubleshooting, Automation) with all 8 labs
- **Center panel (flex)**: Dynamic workspace that switches based on lab mode — terminal view, code editor + terminal split, code editor + plan output, or editor + AI assistant panel
- **Right panel (320px)**: Static SVG context visualization — topology graph, execution flow, infra graph, or file structure tree depending on mode
- **Bottom panel (220px)**: Tabbed area with Logs, Explanation, Validation (pass/fail indicators), and Hints (progressive reveal)

## Workspace Modes

### Network Lab (Terminal)
- Dark terminal with "Router1#" prompt style
- Pre-scripted command sequences with typing animation
- Command syntax highlighting and error rendering in red
- Controls: Start, Pause, Step, Reset

### Python Lab (Editor + Terminal Split)
- Code editor panel with line numbers and syntax highlighting
- Auto-typing simulation of Python/Netmiko scripts
- Terminal output panel below with real-time log streaming
- Controls: Run Script, Step Execution

### Terraform Lab (Editor + Plan Output)
- HCL code editor with syntax highlighting
- Plan output panel showing diff view with resource changes (+ green / - red)
- Controls: Init, Plan, Apply (simulated)

### AI Coding Lab (Editor + AI Panel)
- Multi-file tab editor with AI live-typing simulation
- Side AI assistant panel with suggestions, explanations, and diff preview
- Controls: Generate Code, Explain, Refactor

## Right Panel Visualizations (Static SVG)
- **Network**: Topology with routers/switches, colored link status, highlighted active device
- **Python**: Execution flow diagram showing step nodes and function call trace
- **Terraform**: Infrastructure graph (VPC → Subnets → Instances) with dependency lines
- **AI Coding**: File structure tree view with active file highlighted

## Lab Content (All 8 Labs)
Each lab includes: objective text, pre-scripted command/code sequence, expected output, validation checks, explanation text, and hints.

1. **Hostname Config** — `hostname Router1` sequence
2. **Interface Basics** — Configure IP on GigabitEthernet
3. **Static Routing** — Add static routes between routers
4. **OSPF Setup** — Enable OSPF with area configuration
5. **VLAN Setup** — Create VLANs and assign ports
6. **Trunk Config** — Configure trunk links between switches
7. **Fix Down Interface** — Troubleshoot and bring up a down interface
8. **Python Netmiko Task** — Python script connecting to device via Netmiko

## Visual Effects
- Blinking cursor in terminal
- Typing animation for pre-scripted sequences
- Glowing active node in topology SVG
- Smooth panel transitions on mode/lab switch
- Green/red validation indicators

## Design
- Dark professional theme throughout (dark backgrounds, subtle borders)
- Monospace font for terminal/code areas
- High-information density with clean spacing
- Color accents: green for success/active, red for errors/fail, blue for highlights, amber for warnings
