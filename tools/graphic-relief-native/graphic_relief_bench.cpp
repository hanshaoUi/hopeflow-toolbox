#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

struct Point {
    double x = 0.0;
    double y = 0.0;
};

struct Segment {
    double x1 = 0.0;
    double y1 = 0.0;
    double x2 = 0.0;
    double y2 = 0.0;
    double minX = 0.0;
    double maxX = 0.0;
    double minY = 0.0;
    double maxY = 0.0;
};

struct Line {
    double left = 0.0;
    double right = 0.0;
    double y = 0.0;
};

struct Geometry {
    std::vector<Segment> segments;
    double minX = std::numeric_limits<double>::infinity();
    double maxX = -std::numeric_limits<double>::infinity();
    double minY = std::numeric_limits<double>::infinity();
    double maxY = -std::numeric_limits<double>::infinity();
    int bucketCount = 128;
    std::vector<std::vector<int>> xBuckets;
    std::vector<std::vector<int>> yBuckets;
};

static double clampDouble(double value, double minValue, double maxValue) {
    return std::max(minValue, std::min(maxValue, value));
}

static int clampInt(int value, int minValue, int maxValue) {
    return std::max(minValue, std::min(maxValue, value));
}

static std::vector<Point> makeGlyphLikePolygon(double ox, double oy, double w, double h, int samples) {
    std::vector<Point> poly;
    poly.reserve(static_cast<size_t>(samples) * 2);
    for (int i = 0; i < samples; ++i) {
        double t = static_cast<double>(i) / samples;
        double x = ox + w * t;
        double wave = std::sin(t * 2.0 * 3.14159265358979323846) * h * 0.08;
        poly.push_back({x, oy + h + wave});
    }
    for (int i = samples - 1; i >= 0; --i) {
        double t = static_cast<double>(i) / samples;
        double x = ox + w * t;
        double wave = std::cos(t * 2.0 * 3.14159265358979323846) * h * 0.05;
        poly.push_back({x, oy + wave});
    }
    return poly;
}

static std::vector<std::vector<Point>> makeSyntheticPolygons(int glyphs, int verticesPerGlyph) {
    std::vector<std::vector<Point>> polygons;
    polygons.reserve(static_cast<size_t>(glyphs));
    for (int i = 0; i < glyphs; ++i) {
        double x = 120.0 + i * 54.0;
        double y = 140.0 + (i % 3) * 9.0;
        double w = 42.0 + (i % 4) * 6.0;
        double h = 96.0 + (i % 5) * 7.0;
        polygons.push_back(makeGlyphLikePolygon(x, y, w, h, std::max(12, verticesPerGlyph / 2)));
    }
    return polygons;
}

static Geometry buildGeometry(const std::vector<std::vector<Point>>& polygons, int bucketCount) {
    Geometry g;
    g.bucketCount = bucketCount;
    for (const auto& poly : polygons) {
        if (poly.size() < 2) continue;
        for (size_t i = 0, j = poly.size() - 1; i < poly.size(); j = i++) {
            const Point& a = poly[j];
            const Point& b = poly[i];
            if (std::abs(a.x - b.x) < 0.001 && std::abs(a.y - b.y) < 0.001) continue;
            Segment s;
            s.x1 = a.x;
            s.y1 = a.y;
            s.x2 = b.x;
            s.y2 = b.y;
            s.minX = std::min(a.x, b.x);
            s.maxX = std::max(a.x, b.x);
            s.minY = std::min(a.y, b.y);
            s.maxY = std::max(a.y, b.y);
            g.minX = std::min(g.minX, s.minX);
            g.maxX = std::max(g.maxX, s.maxX);
            g.minY = std::min(g.minY, s.minY);
            g.maxY = std::max(g.maxY, s.maxY);
            g.segments.push_back(s);
        }
    }

    g.xBuckets.assign(static_cast<size_t>(bucketCount), {});
    g.yBuckets.assign(static_cast<size_t>(bucketCount), {});
    double xSpan = std::max(1.0, g.maxX - g.minX);
    double ySpan = std::max(1.0, g.maxY - g.minY);

    for (int i = 0; i < static_cast<int>(g.segments.size()); ++i) {
        const Segment& s = g.segments[static_cast<size_t>(i)];
        int xs = clampInt(static_cast<int>(std::floor((s.minX - g.minX) / xSpan * bucketCount)), 0, bucketCount - 1);
        int xe = clampInt(static_cast<int>(std::floor((s.maxX - g.minX) / xSpan * bucketCount)), 0, bucketCount - 1);
        int ys = clampInt(static_cast<int>(std::floor((s.minY - g.minY) / ySpan * bucketCount)), 0, bucketCount - 1);
        int ye = clampInt(static_cast<int>(std::floor((s.maxY - g.minY) / ySpan * bucketCount)), 0, bucketCount - 1);
        for (int b = xs; b <= xe; ++b) g.xBuckets[static_cast<size_t>(b)].push_back(i);
        for (int b = ys; b <= ye; ++b) g.yBuckets[static_cast<size_t>(b)].push_back(i);
    }

    return g;
}

static const std::vector<int>& xBucketFor(const Geometry& g, double x) {
    static const std::vector<int> empty;
    if (x < g.minX || x > g.maxX) return empty;
    int idx = clampInt(static_cast<int>(std::floor((x - g.minX) / std::max(1.0, g.maxX - g.minX) * g.bucketCount)), 0, g.bucketCount - 1);
    return g.xBuckets[static_cast<size_t>(idx)];
}

static const std::vector<int>& yBucketFor(const Geometry& g, double y) {
    static const std::vector<int> empty;
    if (y < g.minY || y > g.maxY) return empty;
    int idx = clampInt(static_cast<int>(std::floor((y - g.minY) / std::max(1.0, g.maxY - g.minY) * g.bucketCount)), 0, g.bucketCount - 1);
    return g.yBuckets[static_cast<size_t>(idx)];
}

static std::vector<std::pair<double, double>> intervalsAtY(const Geometry& g, double y, double left, double right) {
    std::vector<double> xs;
    const auto& bucket = yBucketFor(g, y);
    xs.reserve(bucket.size());
    for (int idx : bucket) {
        const Segment& s = g.segments[static_cast<size_t>(idx)];
        if (s.maxY <= y || s.minY > y) continue;
        double dy = s.y2 - s.y1;
        if (std::abs(dy) < 0.001) continue;
        double t = (y - s.y1) / dy;
        double x = s.x1 + t * (s.x2 - s.x1);
        if (x >= left && x <= right) xs.push_back(x);
    }
    std::sort(xs.begin(), xs.end());

    std::vector<std::pair<double, double>> intervals;
    for (size_t i = 0; i + 1 < xs.size(); i += 2) {
        double a = std::max(left, xs[i]);
        double b = std::min(right, xs[i + 1]);
        if (b - a > 0.1) intervals.push_back({a, b});
    }
    return intervals;
}

static double surfaceYAt(const Geometry& g, double x, double baseY, double clearance, double strength, bool split) {
    std::vector<double> ys;
    const auto& bucket = xBucketFor(g, x);
    ys.reserve(bucket.size());
    for (int idx : bucket) {
        const Segment& s = g.segments[static_cast<size_t>(idx)];
        if (s.maxX <= x || s.minX > x) continue;
        double dx = s.x2 - s.x1;
        if (std::abs(dx) < 0.001) continue;
        double t = (x - s.x1) / dx;
        ys.push_back(s.y1 + t * (s.y2 - s.y1));
    }
    std::sort(ys.begin(), ys.end());

    for (size_t i = 0; i + 1 < ys.size(); i += 2) {
        double bottom = ys[i];
        double top = ys[i + 1];
        if (baseY >= bottom && baseY <= top) {
            if (split) {
                double mid = (top + bottom) * 0.5;
                if (baseY >= mid) return baseY + (top - baseY) * strength + clearance;
                return baseY - (baseY - bottom) * strength - clearance;
            }
            return baseY + (top - baseY) * strength + clearance;
        }
    }
    return baseY;
}

static int buildReliefPointCount(
    const Line& line,
    const Geometry& g,
    double sampleStep,
    double edgeInset,
    double clearance,
    double strength,
    bool split
) {
    if (line.y < g.minY || line.y > g.maxY || line.right < g.minX || line.left > g.maxX) return 2;
    auto intervals = intervalsAtY(g, line.y, line.left, line.right);
    if (intervals.empty()) return 2;

    std::vector<double> xs;
    xs.reserve(64);
    xs.push_back(line.left);
    xs.push_back(line.right);
    for (const auto& interval : intervals) {
        double a = interval.first;
        double b = interval.second;
        xs.push_back(clampDouble(a - edgeInset, line.left, line.right));
        xs.push_back(a);
        xs.push_back(clampDouble(a + edgeInset, line.left, line.right));
        int count = std::max(1, static_cast<int>(std::ceil((b - a) / sampleStep)));
        for (int i = 1; i < count; ++i) xs.push_back(a + (b - a) * (static_cast<double>(i) / count));
        xs.push_back(clampDouble(b - edgeInset, line.left, line.right));
        xs.push_back(b);
        xs.push_back(clampDouble(b + edgeInset, line.left, line.right));
    }
    std::sort(xs.begin(), xs.end());
    xs.erase(std::unique(xs.begin(), xs.end(), [](double a, double b) { return std::abs(a - b) < 0.05; }), xs.end());

    int affected = 0;
    for (double x : xs) {
        double y = surfaceYAt(g, x, line.y, clearance, strength, split);
        if (std::abs(y - line.y) > 0.1) ++affected;
    }
    return affected > 0 ? static_cast<int>(xs.size()) : 2;
}

static std::vector<Line> makeLines(int rows, double left, double right, double centerY, double spacing) {
    std::vector<Line> lines;
    lines.reserve(static_cast<size_t>(rows));
    double topY = centerY + (rows - 1) * spacing * 0.5;
    for (int i = 0; i < rows; ++i) lines.push_back({left, right, topY - i * spacing});
    return lines;
}

int main(int argc, char** argv) {
    int glyphs = argc > 1 ? std::max(1, std::stoi(argv[1])) : 12;
    int vertices = argc > 2 ? std::max(24, std::stoi(argv[2])) : 160;
    int rows = argc > 3 ? std::max(2, std::stoi(argv[3])) : 96;
    int iterations = argc > 4 ? std::max(1, std::stoi(argv[4])) : 200;

    auto polygons = makeSyntheticPolygons(glyphs, vertices);
    auto lines = makeLines(rows, 60.0, 900.0, 210.0, 3.8);

    auto t0 = std::chrono::high_resolution_clock::now();
    Geometry geometry = buildGeometry(polygons, 128);
    auto t1 = std::chrono::high_resolution_clock::now();

    std::uint64_t pointCount = 0;
    for (int it = 0; it < iterations; ++it) {
        for (const auto& line : lines) {
            pointCount += static_cast<std::uint64_t>(
                buildReliefPointCount(line, geometry, 2.55, 1.0, 2.25, 0.82, true)
            );
        }
    }
    auto t2 = std::chrono::high_resolution_clock::now();

    double buildMs = std::chrono::duration<double, std::milli>(t1 - t0).count();
    double sampleMs = std::chrono::duration<double, std::milli>(t2 - t1).count();
    double perRunMs = sampleMs / iterations;

    std::cout << std::fixed << std::setprecision(3)
              << "glyphs=" << glyphs
              << " verticesPerGlyph=" << vertices
              << " rows=" << rows
              << " iterations=" << iterations << "\n"
              << "segments=" << geometry.segments.size()
              << " geometryBuildMs=" << buildMs
              << " totalSampleMs=" << sampleMs
              << " perRunMs=" << perRunMs
              << " generatedPointVisits=" << pointCount << "\n";
    return 0;
}
