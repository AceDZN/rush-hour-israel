# Original local morning sound

The rebuilt game uses `src/rebuild/sound.ts` to synthesize an original quiet four-chord groove: a soft triangle bass, sparse sine melody, light high percussion and separate route/departure/arrival/undo/completion cues. No external music, samples, account or model service is used.

Sound starts only after a user gesture. The settings menu pauses play and exposes global mute; muted/paused play stops scheduling new music notes. A native AudioContext instrumentation check through normal route and mute controls observed a running context and 14 scheduled oscillators, then a stable oscillator count while muted. Evidence: `docs/redesign/actual/audio-check.json`. That checks scheduling and mute, not physical speaker balance or a listener's musical preference.
