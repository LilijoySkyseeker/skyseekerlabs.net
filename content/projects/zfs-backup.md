+++
title = "Snapshots every 5 minutes, offsite every week"
description = "Built an automated ZFS backup system across three machines: zrepl takes snapshots every 5 minutes, the home server pulls replicas from two desktops and its own data pool every 15 minutes into a mirrored backup pool (4x 12 TB drives in two ZFS mirrors), and snapshots are kept for about 13 months. A weekly Restic job backs up about 2.9 TiB to Backblaze B2 from mounted ZFS snapshots, so every offsite backup is atomic and incremental. Migrated the system from Sanoid/Syncoid to zrepl."
weight = 2
[taxonomies]
tags = ["backups", "zfs", "linux"]
[extra]
vibe = "serious"
link = "https://github.com/LilijoySkyseeker/nixOS"
+++
<p class="placeholder">The full write-up comes out of the interview: why, how, what broke, what it taught me, with pictures and links to the config.</p>
