# Current rebuilt game verification

The human rejected the first implementation. Its previous test report is preserved at [docs/archive/v1/PLAYTEST.md](docs/archive/v1/PLAYTEST.md); it is not evidence that this rebuild is understandable or fun.

The active verification record is [docs/redesign/PLAYTEST.md](docs/redesign/PLAYTEST.md). New model fixtures and actual-input checks are in [tests/rebuild/](tests/rebuild/). The lead's complete normal-control campaign trace is [docs/redesign/actual/campaign/results.json](docs/redesign/actual/campaign/results.json).

The first-minute tests use real elapsed time, no solution imports, no injected progress/plan and no `advanceTime`. The later campaign checks may use the supported deterministic clock after actual UI actions. An experienced-agent inspection is not a novice learner study; human enjoyment and learning gains remain unvalidated.
