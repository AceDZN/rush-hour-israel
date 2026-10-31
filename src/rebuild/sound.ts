/** Original, quiet four-chord morning groove. No external audio or service. */
export class MorningSound {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private next = 0;
  private beat = 0;
  muted = false;
  private active = false;
  unlock() {
    try {
      this.context ??= new AudioContext();
      if (!this.gain) {
        this.gain = this.context.createGain();
        this.gain.gain.value = 0.45;
        this.gain.connect(this.context.destination);
      }
      if (this.context.state === "suspended") void this.context.resume();
      this.active = true;
    } catch {}
  }
  private note(
    hz: number,
    when: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
  ) {
    if (!this.context || !this.gain || this.muted) return;
    const o = this.context.createOscillator(),
      g = this.context.createGain();
    o.type = type;
    o.frequency.value = hz;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(volume, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    o.connect(g).connect(this.gain);
    o.start(when);
    o.stop(when + duration + 0.02);
  }
  update(playing: boolean) {
    if (!this.context || !this.active) return;
    this.gain!.gain.setTargetAtTime(
      this.muted ? 0 : 0.45,
      this.context.currentTime,
      0.08,
    );
    if (!playing || this.muted) {
      this.next = this.context.currentTime + 0.08;
      return;
    }
    const c = this.context.currentTime;
    if (this.next < c) this.next = c + 0.03;
    while (this.next < c + 0.16) {
      const chord = Math.floor(this.beat / 16) % 4,
        roots = [130.81, 110, 87.31, 98],
        melodies = [
          [523.25, 659.25, 783.99, 587.33],
          [440, 523.25, 659.25, 783.99],
          [440, 523.25, 659.25, 523.25],
          [392, 493.88, 587.33, 659.25],
        ];
      if (this.beat % 4 === 0)
        this.note(roots[chord], this.next, 0.42, 0.033, "triangle");
      if (this.beat % 4 === 2)
        this.note(roots[chord] * 1.5, this.next, 0.22, 0.018, "triangle");
      if (this.beat % 2 === 0)
        this.note(
          melodies[chord][Math.floor(this.beat / 2) % 4],
          this.next,
          0.28,
          0.018,
        );
      if (this.beat % 4 === 1)
        this.note(
          1600 + (this.beat % 3) * 110,
          this.next,
          0.035,
          0.006,
          "triangle",
        );
      this.beat++;
      this.next += 0.235;
    }
  }
  play(kind: "draw" | "arrival" | "depart" | "win" | "undo") {
    this.unlock();
    if (!this.context) return;
    const t = this.context.currentTime;
    if (kind === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        this.note(f, t + i * 0.075, 0.5, 0.09),
      );
    } else if (kind === "arrival") {
      this.note(783.99, t, 0.19, 0.055);
      this.note(1046.5, t + 0.055, 0.22, 0.03);
    } else if (kind === "draw") {
      this.note(392, t, 0.13, 0.05, "triangle");
      this.note(523.25, t + 0.045, 0.17, 0.05);
    } else if (kind === "undo") {
      this.note(440, t, 0.13, 0.03);
      this.note(330, t + 0.055, 0.13, 0.03);
    } else this.note(196, t, 0.08, 0.028, "triangle");
  }
}
