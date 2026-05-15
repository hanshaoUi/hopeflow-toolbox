function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeGlyphLikePolygon(ox, oy, w, h, samples) {
  const poly = [];
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    const x = ox + w * t;
    const wave = Math.sin(t * 2 * Math.PI) * h * 0.08;
    poly.push({ x, y: oy + h + wave });
  }
  for (let i = samples - 1; i >= 0; i--) {
    const t = i / samples;
    const x = ox + w * t;
    const wave = Math.cos(t * 2 * Math.PI) * h * 0.05;
    poly.push({ x, y: oy + wave });
  }
  return poly;
}

function makeSyntheticPolygons(glyphs, verticesPerGlyph) {
  const polygons = [];
  for (let i = 0; i < glyphs; i++) {
    const x = 120 + i * 54;
    const y = 140 + (i % 3) * 9;
    const w = 42 + (i % 4) * 6;
    const h = 96 + (i % 5) * 7;
    polygons.push(makeGlyphLikePolygon(x, y, w, h, Math.max(12, Math.floor(verticesPerGlyph / 2))));
  }
  return polygons;
}

function buildGeometry(polygons, bucketCount) {
  const g = {
    segments: [],
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    bucketCount,
    xBuckets: Array.from({ length: bucketCount }, () => []),
    yBuckets: Array.from({ length: bucketCount }, () => []),
  };

  for (const poly of polygons) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[j];
      const b = poly[i];
      if (Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001) continue;
      const s = {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        minX: Math.min(a.x, b.x),
        maxX: Math.max(a.x, b.x),
        minY: Math.min(a.y, b.y),
        maxY: Math.max(a.y, b.y),
      };
      g.minX = Math.min(g.minX, s.minX);
      g.maxX = Math.max(g.maxX, s.maxX);
      g.minY = Math.min(g.minY, s.minY);
      g.maxY = Math.max(g.maxY, s.maxY);
      g.segments.push(s);
    }
  }

  const xSpan = Math.max(1, g.maxX - g.minX);
  const ySpan = Math.max(1, g.maxY - g.minY);
  g.segments.forEach((s, index) => {
    const xs = clamp(Math.floor(((s.minX - g.minX) / xSpan) * bucketCount), 0, bucketCount - 1);
    const xe = clamp(Math.floor(((s.maxX - g.minX) / xSpan) * bucketCount), 0, bucketCount - 1);
    const ys = clamp(Math.floor(((s.minY - g.minY) / ySpan) * bucketCount), 0, bucketCount - 1);
    const ye = clamp(Math.floor(((s.maxY - g.minY) / ySpan) * bucketCount), 0, bucketCount - 1);
    for (let b = xs; b <= xe; b++) g.xBuckets[b].push(index);
    for (let b = ys; b <= ye; b++) g.yBuckets[b].push(index);
  });
  return g;
}

function xBucketFor(g, x) {
  if (x < g.minX || x > g.maxX) return [];
  const idx = clamp(Math.floor(((x - g.minX) / Math.max(1, g.maxX - g.minX)) * g.bucketCount), 0, g.bucketCount - 1);
  return g.xBuckets[idx];
}

function yBucketFor(g, y) {
  if (y < g.minY || y > g.maxY) return [];
  const idx = clamp(Math.floor(((y - g.minY) / Math.max(1, g.maxY - g.minY)) * g.bucketCount), 0, g.bucketCount - 1);
  return g.yBuckets[idx];
}

function intervalsAtY(g, y, left, right) {
  const xs = [];
  const bucket = yBucketFor(g, y);
  for (const idx of bucket) {
    const s = g.segments[idx];
    if (s.maxY <= y || s.minY > y) continue;
    const dy = s.y2 - s.y1;
    if (Math.abs(dy) < 0.001) continue;
    const t = (y - s.y1) / dy;
    const x = s.x1 + t * (s.x2 - s.x1);
    if (x >= left && x <= right) xs.push(x);
  }
  xs.sort((a, b) => a - b);
  const intervals = [];
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const a = Math.max(left, xs[i]);
    const b = Math.min(right, xs[i + 1]);
    if (b - a > 0.1) intervals.push([a, b]);
  }
  return intervals;
}

function surfaceYAt(g, x, baseY, clearance, strength, split) {
  const ys = [];
  const bucket = xBucketFor(g, x);
  for (const idx of bucket) {
    const s = g.segments[idx];
    if (s.maxX <= x || s.minX > x) continue;
    const dx = s.x2 - s.x1;
    if (Math.abs(dx) < 0.001) continue;
    const t = (x - s.x1) / dx;
    ys.push(s.y1 + t * (s.y2 - s.y1));
  }
  ys.sort((a, b) => a - b);
  for (let i = 0; i + 1 < ys.length; i += 2) {
    const bottom = ys[i];
    const top = ys[i + 1];
    if (baseY >= bottom && baseY <= top) {
      if (split) {
        const mid = (top + bottom) * 0.5;
        if (baseY >= mid) return baseY + (top - baseY) * strength + clearance;
        return baseY - (baseY - bottom) * strength - clearance;
      }
      return baseY + (top - baseY) * strength + clearance;
    }
  }
  return baseY;
}

function uniqueSorted(xs) {
  xs.sort((a, b) => a - b);
  const out = [];
  for (const x of xs) {
    if (!out.length || Math.abs(x - out[out.length - 1]) >= 0.05) out.push(x);
  }
  return out;
}

function buildReliefPointCount(line, g, sampleStep, edgeInset, clearance, strength, split) {
  if (line.y < g.minY || line.y > g.maxY || line.right < g.minX || line.left > g.maxX) return 2;
  const intervals = intervalsAtY(g, line.y, line.left, line.right);
  if (!intervals.length) return 2;

  const xs = [line.left, line.right];
  for (const [a, b] of intervals) {
    xs.push(clamp(a - edgeInset, line.left, line.right), a, clamp(a + edgeInset, line.left, line.right));
    const count = Math.max(1, Math.ceil((b - a) / sampleStep));
    for (let i = 1; i < count; i++) xs.push(a + (b - a) * (i / count));
    xs.push(clamp(b - edgeInset, line.left, line.right), b, clamp(b + edgeInset, line.left, line.right));
  }

  const unique = uniqueSorted(xs);
  let affected = 0;
  for (const x of unique) {
    const y = surfaceYAt(g, x, line.y, clearance, strength, split);
    if (Math.abs(y - line.y) > 0.1) affected++;
  }
  return affected > 0 ? unique.length : 2;
}

function makeLines(rows, left, right, centerY, spacing) {
  const lines = [];
  const topY = centerY + ((rows - 1) * spacing) / 2;
  for (let i = 0; i < rows; i++) lines.push({ left, right, y: topY - i * spacing });
  return lines;
}

const glyphs = Math.max(1, Number(process.argv[2] || 12));
const vertices = Math.max(24, Number(process.argv[3] || 160));
const rows = Math.max(2, Number(process.argv[4] || 96));
const iterations = Math.max(1, Number(process.argv[5] || 200));

const polygons = makeSyntheticPolygons(glyphs, vertices);
const lines = makeLines(rows, 60, 900, 210, 3.8);

const t0 = performance.now();
const geometry = buildGeometry(polygons, 128);
const t1 = performance.now();

let pointCount = 0;
for (let it = 0; it < iterations; it++) {
  for (const line of lines) {
    pointCount += buildReliefPointCount(line, geometry, 2.55, 1.0, 2.25, 0.82, true);
  }
}
const t2 = performance.now();

console.log(
  `glyphs=${glyphs} verticesPerGlyph=${vertices} rows=${rows} iterations=${iterations}\n` +
    `segments=${geometry.segments.length} geometryBuildMs=${(t1 - t0).toFixed(3)} ` +
    `totalSampleMs=${(t2 - t1).toFixed(3)} perRunMs=${((t2 - t1) / iterations).toFixed(3)} ` +
    `generatedPointVisits=${pointCount}`
);
