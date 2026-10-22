import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

const TWEEN_MS = 100;
// Assumed frame length when the clock is coarse — LibreWolf/Firefox with
// resistFingerprinting quantizes timestamps, so consecutive frames can share one.
const NOMINAL_FRAME_MS = 1000 / 60;
const MAX_FRAME_MS = 50;

type Point = readonly [number, number];

interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  points?: readonly Point[];
}

interface Tween {
  from: Geometry;
  to: OrderedExcalidrawElement;
  elapsed: number;
}

function geometryOf(el: OrderedExcalidrawElement): Geometry {
  return {
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    angle: el.angle,
    points: "points" in el ? (el.points as readonly Point[]) : undefined,
  };
}

function sameGeometry(a: Geometry, b: Geometry) {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.angle === b.angle &&
    a.points === b.points
  );
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function lerpAngle(a: number, b: number, t: number) {
  const diff = ((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
  return a + diff * t;
}

function interpolate(tween: Tween, t: number): OrderedExcalidrawElement {
  const { from, to } = tween;
  const toPoints = "points" in to ? (to.points as readonly Point[]) : undefined;
  const pointsMatch =
    from.points && toPoints && from.points.length === toPoints.length;

  const tweenSize = to.type !== "text" && (!toPoints || pointsMatch);

  return {
    ...to,
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    width: tweenSize ? lerp(from.width, to.width, t) : to.width,
    height: tweenSize ? lerp(from.height, to.height, t) : to.height,
    angle: lerpAngle(from.angle, to.angle, t),
    ...(pointsMatch && {
      points: toPoints.map(
        (p, i) =>
          [
            lerp(from.points![i][0], p[0], t),
            lerp(from.points![i][1], p[1], t),
          ] as const
      ),
    }),
  } as OrderedExcalidrawElement;
}

const isTweenTarget = (el: OrderedExcalidrawElement, tween: Tween) =>
  el.version === tween.to.version && el.versionNonce === tween.to.versionNonce;

export class ElementTweens {
  private tweens = new Map<string, Tween>();
  private frame: number | null = null;
  private lastTick: number | null = null;

  private getElements: () => readonly OrderedExcalidrawElement[] | null;
  private apply: (elements: OrderedExcalidrawElement[]) => void;

  constructor(
    getElements: () => readonly OrderedExcalidrawElement[] | null,
    apply: (elements: OrderedExcalidrawElement[]) => void
  ) {
    this.getElements = getElements;
    this.apply = apply;
  }

  track(
    previous: readonly OrderedExcalidrawElement[],
    reconciled: readonly OrderedExcalidrawElement[],
    remote: readonly OrderedExcalidrawElement[]
  ): OrderedExcalidrawElement[] {
    const previousById = new Map(previous.map((el) => [el.id, el]));
    const remoteById = new Map(remote.map((el) => [el.id, el]));
    const result = reconciled.map((el) => {
      const incoming = remoteById.get(el.id);
      const prev = previousById.get(el.id);
      if (
        !incoming ||
        !prev ||
        el.isDeleted ||
        prev.isDeleted ||
        el.version !== incoming.version ||
        el.versionNonce !== incoming.versionNonce
      )
        return el;

      const from = geometryOf(prev);
      if (sameGeometry(from, geometryOf(el))) {
        this.tweens.delete(el.id);
        return el;
      }

      const tween = { from, to: el, elapsed: 0 };
      this.tweens.set(el.id, tween);
      return interpolate(tween, 0);
    });

    if (this.tweens.size > 0 && this.frame === null)
      this.frame = requestAnimationFrame(this.tick);
    return result;
  }

  withTargets(
    elements: readonly OrderedExcalidrawElement[]
  ): readonly OrderedExcalidrawElement[] {
    if (this.tweens.size === 0) return elements;
    return elements.map((el) => {
      const tween = this.tweens.get(el.id);
      return tween && isTweenTarget(el, tween) ? tween.to : el;
    });
  }

  dispose() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.lastTick = null;
    this.tweens.clear();
  }

  private tick = (now: number) => {
    this.frame = null;
    const elements = this.getElements();
    if (!elements) {
      this.lastTick = null;
      this.tweens.clear();
      return;
    }

    // Advance by frame delta rather than (now - start): a stalled clock still moves
    // the tween forward and a quantization jump can't skip it straight to the end.
    const delta = this.lastTick === null ? 0 : now - this.lastTick;
    const step = delta > 0 ? Math.min(delta, MAX_FRAME_MS) : NOMINAL_FRAME_MS;
    this.lastTick = now;

    const seen = new Set<string>();
    const next = elements.map((el) => {
      const tween = this.tweens.get(el.id);
      if (!tween) return el;
      seen.add(el.id);
      if (!isTweenTarget(el, tween)) {
        this.tweens.delete(el.id);
        return el;
      }
      tween.elapsed += step;
      const t = Math.min(1, tween.elapsed / TWEEN_MS);
      if (t >= 1) {
        this.tweens.delete(el.id);
        return tween.to;
      }
      return interpolate(tween, t);
    });

    for (const id of this.tweens.keys())
      if (!seen.has(id)) this.tweens.delete(id);

    this.apply(next);
    if (this.tweens.size > 0) this.frame = requestAnimationFrame(this.tick);
    else this.lastTick = null;
  };
}
