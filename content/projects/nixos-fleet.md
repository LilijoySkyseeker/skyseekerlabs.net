+++
title = "A five-machine NixOS fleet from one flake"
description = "Run 5 NixOS machines (2 desktops, a home server, a public VPS, and a recovery/install ISO) from one Git-tracked flake, with every host reproducible from the repo and no hand-run setup steps. The home server's root filesystem is wiped on every boot, so only explicitly declared state survives."
weight = 1
[taxonomies]
tags = ["nixos", "linux", "infra"]
[extra]
vibe = "serious"
link = "https://github.com/LilijoySkyseeker/nixOS"
+++
<p class="placeholder">The full write-up comes out of the interview: why, how, what broke, what it taught me, with pictures and links to the config.</p>
