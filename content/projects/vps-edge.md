+++
title = "A public edge that keeps home off the internet"
description = "Public traffic lands on a small hardened VPS that tunnels home over WireGuard, so the home server is never directly reachable from the internet. The home server builds the VPS's configuration and pushes it over Tailscale, so the small VPS never compiles its own config."
weight = 4
[taxonomies]
tags = ["networking", "security"]
[extra]
vibe = "serious"
link = "https://github.com/LilijoySkyseeker/nixOS"
+++
<p class="placeholder">The full write-up comes out of the interview: why, how, what broke, what it taught me, with pictures and links to the config.</p>
