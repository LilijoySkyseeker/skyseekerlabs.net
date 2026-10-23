+++
title = "Shrinking the vps down to the game ports"
date = 2026-10-06
[taxonomies]
tags = ["fleet"]
[extra]
kind = "log"
placeholder = true
+++
For a while my vps did three jobs. It was the WireGuard end of the tunnel home, it forwarded the game ports to homelab, and it ran Caddy so Jellyfin could be reached from anywhere. Then I noticed I was the only person who ever used Jellyfin from outside, and I always did it over Tailscale anyway.

So the public web server went, and with it everything that only existed to protect it: Anubis, the HTTP rate limits, and CrowdSec. The vps is now a dumb forwarder with a tunnel. It holds no state worth backing up, and I can rebuild it from the flake in a few minutes.

## What's left

Forwarded ports, each with its own per-address rate limit, and the tunnel itself. The nice part about NixOS is that the removal is one commit. If I ever want the web server back, it's a revert, and this site is the reason it's coming back.
