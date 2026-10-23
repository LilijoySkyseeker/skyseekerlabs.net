+++
title = "Alerts that caught a dying USB enclosure"
description = "Set up fleet-wide log collection with Grafana Alloy, Loki, and Grafana, and periodic ZFS, SMART, and systemd health checks that send a Discord alert when a disk or service fails. The alerts caught silent checksum corruption from a faulty USB drive enclosure, traced to its UAS link and fixed with a kernel quirk and a cable replacement."
weight = 5
[taxonomies]
tags = ["monitoring", "linux"]
[extra]
vibe = "serious"
link = "https://github.com/LilijoySkyseeker/nixOS"
+++
<p class="placeholder">The full write-up comes out of the interview: why, how, what broke, what it taught me, with pictures and links to the config.</p>
