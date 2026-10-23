+++
title = "A locked-down home for AI coding agents"
description = "Gave AI coding agents (Claude Code and OpenAI Codex) their own unprivileged Linux user on a NixOS desktop, declared in Nix: systemd sandboxing with a read-only system, only the GPU and KVM devices passed through, a shared cgroup cap of 64 GB of memory, and an iptables egress firewall that blocks the home LAN and VPN. A NixOS virtual machine test checks each boundary from the agent's side."
weight = 10
[taxonomies]
tags = ["ai", "security", "nixos"]
[extra]
vibe = "serious"
link = "https://github.com/LilijoySkyseeker/nixOS"
+++
<p class="placeholder">The full write-up comes out of the interview: why, how, what broke, what it taught me, with pictures and links to the config.</p>
