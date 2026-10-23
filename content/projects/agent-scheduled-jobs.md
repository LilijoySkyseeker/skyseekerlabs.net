+++
title = "Unattended AI jobs on systemd timers"
description = "Run unattended Claude Code jobs on systemd timers: a weekly job updates the fleet's dependencies, builds every host, and opens a pull request for review; a daily job checks new security advisories against the package versions the fleet actually runs. The job prompts live in the Git repo, so a job only changes through a reviewed pull request."
weight = 11
[taxonomies]
tags = ["ai", "automation"]
[extra]
vibe = "serious"
link = "https://github.com/LilijoySkyseeker/nixOS"
+++
<p class="placeholder">The full write-up comes out of the interview: why, how, what broke, what it taught me, with pictures and links to the config.</p>
