#include <algorithm>
#include <cmath>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

struct Point { double x = 0.0, y = 0.0; };
struct Segment {
    double x1 = 0.0, y1 = 0.0, x2 = 0.0, y2 = 0.0;
    double minX = 0.0, maxX = 0.0, minY = 0.0, maxY = 0.0;
};
struct Line { double left = 0.0, right = 0.0, y = 0.0, strokeWidth = 1.0; };
struct Params {
    double sampleStep = 2.55;
    double edgeInset = 1.0;
    double clearance = 2.25;
    double strength = 0.82;
    int smoothing = 1;
    bool split = true;
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

static double clampDouble(double value, double lo, double hi) { return std::max(lo, std::min(hi, value)); }
static int clampInt(int value, int lo, int hi) { return std::max(lo, std::min(hi, value)); }

class Json {
public:
    explicit Json(std::string text) : s_(std::move(text)) {}

    void parseRoot(std::vector<std::vector<Point>>& polygons, std::vector<Line>& lines, Params& params) {
        expect('{');
        while (!consume('}')) {
            std::string key = parseString();
            expect(':');
            if (key == "polygons") parsePolygons(polygons);
            else if (key == "lines") parseLines(lines);
            else if (key == "params") parseParams(params);
            else skipValue();
            consume(',');
        }
    }

private:
    std::string s_;
    size_t i_ = 0;

    void ws() {
        if (i_ == 0 && s_.size() >= 3
            && static_cast<unsigned char>(s_[0]) == 0xEF
            && static_cast<unsigned char>(s_[1]) == 0xBB
            && static_cast<unsigned char>(s_[2]) == 0xBF) {
            i_ = 3;
        }
        while (i_ < s_.size() && (s_[i_] == ' ' || s_[i_] == '\n' || s_[i_] == '\r' || s_[i_] == '\t')) ++i_;
    }
    bool consume(char c) {
        ws();
        if (i_ < s_.size() && s_[i_] == c) { ++i_; return true; }
        return false;
    }
    void expect(char c) {
        if (!consume(c)) throw std::runtime_error(std::string("Expected '") + c + "'");
    }
    std::string parseString() {
        ws();
        expect('"');
        std::string out;
        while (i_ < s_.size()) {
            char c = s_[i_++];
            if (c == '"') break;
            if (c == '\\' && i_ < s_.size()) {
                char e = s_[i_++];
                if (e == '"' || e == '\\' || e == '/') out.push_back(e);
                else if (e == 'n') out.push_back('\n');
                else if (e == 'r') out.push_back('\r');
                else if (e == 't') out.push_back('\t');
                else out.push_back(e);
            } else {
                out.push_back(c);
            }
        }
        return out;
    }
    double parseNumber() {
        ws();
        size_t start = i_;
        if (i_ < s_.size() && (s_[i_] == '-' || s_[i_] == '+')) ++i_;
        while (i_ < s_.size() && std::isdigit(static_cast<unsigned char>(s_[i_]))) ++i_;
        if (i_ < s_.size() && s_[i_] == '.') {
            ++i_;
            while (i_ < s_.size() && std::isdigit(static_cast<unsigned char>(s_[i_]))) ++i_;
        }
        if (i_ < s_.size() && (s_[i_] == 'e' || s_[i_] == 'E')) {
            ++i_;
            if (i_ < s_.size() && (s_[i_] == '-' || s_[i_] == '+')) ++i_;
            while (i_ < s_.size() && std::isdigit(static_cast<unsigned char>(s_[i_]))) ++i_;
        }
        return std::stod(s_.substr(start, i_ - start));
    }
    bool parseBool() {
        ws();
        if (s_.compare(i_, 4, "true") == 0) { i_ += 4; return true; }
        if (s_.compare(i_, 5, "false") == 0) { i_ += 5; return false; }
        throw std::runtime_error("Expected boolean");
    }
    Point parsePoint() {
        expect('[');
        double x = parseNumber();
        expect(',');
        double y = parseNumber();
        expect(']');
        return {x, y};
    }
    void parsePolygons(std::vector<std::vector<Point>>& polygons) {
        expect('[');
        while (!consume(']')) {
            std::vector<Point> poly;
            expect('[');
            while (!consume(']')) {
                poly.push_back(parsePoint());
                consume(',');
            }
            polygons.push_back(std::move(poly));
            consume(',');
        }
    }
    void parseLines(std::vector<Line>& lines) {
        expect('[');
        while (!consume(']')) {
            Line line;
            expect('{');
            while (!consume('}')) {
                std::string key = parseString();
                expect(':');
                double value = parseNumber();
                if (key == "left") line.left = value;
                else if (key == "right") line.right = value;
                else if (key == "y") line.y = value;
                else if (key == "strokeWidth") line.strokeWidth = value;
                consume(',');
            }
            lines.push_back(line);
            consume(',');
        }
    }
    void parseParams(Params& params) {
        expect('{');
        while (!consume('}')) {
            std::string key = parseString();
            expect(':');
            if (key == "split") params.split = parseBool();
            else {
                double value = parseNumber();
                if (key == "sampleStep") params.sampleStep = value;
                else if (key == "edgeInset") params.edgeInset = value;
                else if (key == "clearance") params.clearance = value;
                else if (key == "strength") params.strength = value;
                else if (key == "smoothing") params.smoothing = static_cast<int>(value);
            }
            consume(',');
        }
    }
    void skipValue() {
        ws();
        if (i_ >= s_.size()) return;
        if (s_[i_] == '"') { parseString(); return; }
        if (s_[i_] == '{') {
            int depth = 0;
            do {
                if (s_[i_] == '"') parseString();
                else {
                    if (s_[i_] == '{') ++depth;
                    if (s_[i_] == '}') --depth;
                    ++i_;
                }
            } while (i_ < s_.size() && depth > 0);
            return;
        }
        if (s_[i_] == '[') {
            int depth = 0;
            do {
                if (s_[i_] == '"') parseString();
                else {
                    if (s_[i_] == '[') ++depth;
                    if (s_[i_] == ']') --depth;
                    ++i_;
                }
            } while (i_ < s_.size() && depth > 0);
            return;
        }
        while (i_ < s_.size() && s_[i_] != ',' && s_[i_] != '}' && s_[i_] != ']') ++i_;
    }
};

static Geometry buildGeometry(const std::vector<std::vector<Point>>& polygons) {
    Geometry g;
    for (const auto& poly : polygons) {
        if (poly.size() < 2) continue;
        for (size_t i = 0, j = poly.size() - 1; i < poly.size(); j = i++) {
            const Point& a = poly[j];
            const Point& b = poly[i];
            if (std::abs(a.x - b.x) < 0.001 && std::abs(a.y - b.y) < 0.001) continue;
            Segment seg;
            seg.x1 = a.x; seg.y1 = a.y; seg.x2 = b.x; seg.y2 = b.y;
            seg.minX = std::min(a.x, b.x); seg.maxX = std::max(a.x, b.x);
            seg.minY = std::min(a.y, b.y); seg.maxY = std::max(a.y, b.y);
            g.minX = std::min(g.minX, seg.minX); g.maxX = std::max(g.maxX, seg.maxX);
            g.minY = std::min(g.minY, seg.minY); g.maxY = std::max(g.maxY, seg.maxY);
            g.segments.push_back(seg);
        }
    }
    g.xBuckets.assign(g.bucketCount, {});
    g.yBuckets.assign(g.bucketCount, {});
    double xSpan = std::max(1.0, g.maxX - g.minX);
    double ySpan = std::max(1.0, g.maxY - g.minY);
    for (int i = 0; i < static_cast<int>(g.segments.size()); ++i) {
        const auto& s = g.segments[static_cast<size_t>(i)];
        int xs = clampInt(static_cast<int>(std::floor((s.minX - g.minX) / xSpan * g.bucketCount)), 0, g.bucketCount - 1);
        int xe = clampInt(static_cast<int>(std::floor((s.maxX - g.minX) / xSpan * g.bucketCount)), 0, g.bucketCount - 1);
        int ys = clampInt(static_cast<int>(std::floor((s.minY - g.minY) / ySpan * g.bucketCount)), 0, g.bucketCount - 1);
        int ye = clampInt(static_cast<int>(std::floor((s.maxY - g.minY) / ySpan * g.bucketCount)), 0, g.bucketCount - 1);
        for (int b = xs; b <= xe; ++b) g.xBuckets[static_cast<size_t>(b)].push_back(i);
        for (int b = ys; b <= ye; ++b) g.yBuckets[static_cast<size_t>(b)].push_back(i);
    }
    return g;
}

static const std::vector<int>& xBucket(const Geometry& g, double x) {
    static const std::vector<int> empty;
    if (x < g.minX || x > g.maxX) return empty;
    int idx = clampInt(static_cast<int>(std::floor((x - g.minX) / std::max(1.0, g.maxX - g.minX) * g.bucketCount)), 0, g.bucketCount - 1);
    return g.xBuckets[static_cast<size_t>(idx)];
}
static const std::vector<int>& yBucket(const Geometry& g, double y) {
    static const std::vector<int> empty;
    if (y < g.minY || y > g.maxY) return empty;
    int idx = clampInt(static_cast<int>(std::floor((y - g.minY) / std::max(1.0, g.maxY - g.minY) * g.bucketCount)), 0, g.bucketCount - 1);
    return g.yBuckets[static_cast<size_t>(idx)];
}

static std::vector<std::pair<double, double>> intervalsAtY(const Geometry& g, double y, double left, double right) {
    std::vector<double> xs;
    for (int idx : yBucket(g, y)) {
        const auto& s = g.segments[static_cast<size_t>(idx)];
        if (s.maxY <= y || s.minY > y) continue;
        double dy = s.y2 - s.y1;
        if (std::abs(dy) < 0.001) continue;
        double x = s.x1 + ((y - s.y1) / dy) * (s.x2 - s.x1);
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

static double surfaceYAt(const Geometry& g, double x, double baseY, const Params& params) {
    std::vector<double> ys;
    for (int idx : xBucket(g, x)) {
        const auto& s = g.segments[static_cast<size_t>(idx)];
        if (s.maxX <= x || s.minX > x) continue;
        double dx = s.x2 - s.x1;
        if (std::abs(dx) < 0.001) continue;
        ys.push_back(s.y1 + ((x - s.x1) / dx) * (s.y2 - s.y1));
    }
    std::sort(ys.begin(), ys.end());
    for (size_t i = 0; i + 1 < ys.size(); i += 2) {
        double bottom = ys[i];
        double top = ys[i + 1];
        if (baseY >= bottom && baseY <= top) {
            if (params.split) {
                double mid = (top + bottom) * 0.5;
                if (baseY >= mid) return baseY + (top - baseY) * params.strength + params.clearance;
                return baseY - (baseY - bottom) * params.strength - params.clearance;
            }
            return baseY + (top - baseY) * params.strength + params.clearance;
        }
    }
    return baseY;
}

static void smooth(std::vector<double>& ys, int passes) {
    for (int p = 0; p < passes; ++p) {
        std::vector<double> next = ys;
        for (size_t i = 1; i + 1 < ys.size(); ++i) next[i] = ys[i - 1] * 0.25 + ys[i] * 0.5 + ys[i + 1] * 0.25;
        ys.swap(next);
    }
}

static std::vector<Point> buildPoints(const Line& line, const Geometry& g, const Params& params, bool& affected) {
    affected = false;
    if (line.y < g.minY || line.y > g.maxY || line.right < g.minX || line.left > g.maxX) return {{line.left, line.y}, {line.right, line.y}};
    auto intervals = intervalsAtY(g, line.y, line.left, line.right);
    if (intervals.empty()) return {{line.left, line.y}, {line.right, line.y}};

    std::vector<double> xs = {line.left, line.right};
    for (const auto& interval : intervals) {
        double a = interval.first, b = interval.second;
        xs.push_back(clampDouble(a - params.edgeInset, line.left, line.right));
        xs.push_back(a);
        xs.push_back(clampDouble(a + params.edgeInset, line.left, line.right));
        int count = std::max(1, static_cast<int>(std::ceil((b - a) / params.sampleStep)));
        for (int i = 1; i < count; ++i) xs.push_back(a + (b - a) * (static_cast<double>(i) / count));
        xs.push_back(clampDouble(b - params.edgeInset, line.left, line.right));
        xs.push_back(b);
        xs.push_back(clampDouble(b + params.edgeInset, line.left, line.right));
    }
    std::sort(xs.begin(), xs.end());
    xs.erase(std::unique(xs.begin(), xs.end(), [](double a, double b) { return std::abs(a - b) < 0.05; }), xs.end());

    std::vector<double> ys;
    ys.reserve(xs.size());
    for (double x : xs) ys.push_back(surfaceYAt(g, x, line.y, params));
    smooth(ys, std::max(0, std::min(8, params.smoothing)));

    std::vector<Point> points;
    for (size_t i = 0; i < xs.size(); ++i) {
        if (std::abs(ys[i] - line.y) > 0.1) affected = true;
        if (!points.empty() && std::abs(ys[i] - points.back().y) < 0.02 && i + 1 < xs.size() && (i % 3 != 0)) continue;
        points.push_back({xs[i], ys[i]});
    }
    return affected ? points : std::vector<Point>{{line.left, line.y}, {line.right, line.y}};
}

static std::string readFile(const std::string& path) {
    std::ifstream in(path, std::ios::binary);
    if (!in) throw std::runtime_error("Cannot open input file");
    std::ostringstream ss;
    ss << in.rdbuf();
    return ss.str();
}

static void writeJsonString(std::ostream& out, const std::string& s) {
    out << '"';
    for (char c : s) {
        if (c == '"' || c == '\\') out << '\\' << c;
        else if (c == '\n') out << "\\n";
        else if (c == '\r') out << "\\r";
        else out << c;
    }
    out << '"';
}

static void writeOutput(const std::string& path, const std::vector<std::vector<Point>>& lines, int affected) {
    std::ofstream out(path, std::ios::binary);
    if (!out) throw std::runtime_error("Cannot open output file");
    out << std::fixed << std::setprecision(3);
    out << "{\"success\":true,\"generated\":" << lines.size() << ",\"affected\":" << affected << ",\"lines\":[";
    for (size_t i = 0; i < lines.size(); ++i) {
        if (i) out << ',';
        out << '[';
        for (size_t j = 0; j < lines[i].size(); ++j) {
            if (j) out << ',';
            out << '[' << lines[i][j].x << ',' << lines[i][j].y << ']';
        }
        out << ']';
    }
    out << "]}";
}

static void requireTest(bool condition, const std::string& message) {
    if (!condition) throw std::runtime_error(message);
}

static int runSelfTest() {
    std::vector<std::vector<Point>> polygons = {
        {{100.0, 100.0}, {200.0, 100.0}, {200.0, 200.0}, {100.0, 200.0}}
    };
    Geometry geometry = buildGeometry(polygons);
    requireTest(geometry.segments.size() == 4, "rectangle should produce four segments");

    Params params;
    params.sampleStep = 5.0;
    params.edgeInset = 1.0;
    params.clearance = 2.0;
    params.strength = 0.8;
    params.smoothing = 0;
    params.split = true;

    bool affected = false;
    auto insideTop = buildPoints({50.0, 250.0, 150.0, 1.0}, geometry, params, affected);
    requireTest(affected, "line crossing polygon should be affected");
    requireTest(insideTop.size() > 2, "affected line should have relief points");
    bool hasRaisedPoint = false;
    for (const auto& p : insideTop) {
        if (p.y > 150.0) hasRaisedPoint = true;
    }
    requireTest(hasRaisedPoint, "upper half should raise in split mode");

    affected = false;
    auto outside = buildPoints({50.0, 250.0, 230.0, 1.0}, geometry, params, affected);
    requireTest(!affected, "line outside polygon should not be affected");
    requireTest(outside.size() == 2, "unaffected line should stay two points");

    affected = false;
    auto insideBottom = buildPoints({50.0, 250.0, 120.0, 1.0}, geometry, params, affected);
    requireTest(affected, "lower crossing line should be affected");
    bool hasLoweredPoint = false;
    for (const auto& p : insideBottom) {
        if (p.y < 120.0) hasLoweredPoint = true;
    }
    requireTest(hasLoweredPoint, "lower half should lower in split mode");

    std::cout << "graphic_relief_native self-test passed\n";
    return 0;
}

int main(int argc, char** argv) {
    if (argc == 2 && std::string(argv[1]) == "--self-test") {
        try {
            return runSelfTest();
        } catch (const std::exception& e) {
            std::cerr << e.what() << "\n";
            return 1;
        }
    }
    if (argc < 3) {
        std::cerr << "Usage: graphic_relief_native <input.json> <output.json>\n";
        return 2;
    }
    try {
        std::vector<std::vector<Point>> polygons;
        std::vector<Line> sourceLines;
        Params params;
        Json(readFile(argv[1])).parseRoot(polygons, sourceLines, params);
        Geometry geometry = buildGeometry(polygons);
        std::vector<std::vector<Point>> outputLines;
        int affectedCount = 0;
        outputLines.reserve(sourceLines.size());
        for (const auto& line : sourceLines) {
            bool affected = false;
            outputLines.push_back(buildPoints(line, geometry, params, affected));
            if (affected) ++affectedCount;
        }
        writeOutput(argv[2], outputLines, affectedCount);
        return 0;
    } catch (const std::exception& e) {
        std::ofstream out(argv[2], std::ios::binary);
        if (out) {
            out << "{\"success\":false,\"error\":";
            writeJsonString(out, e.what());
            out << "}";
        }
        std::cerr << e.what() << "\n";
        return 1;
    }
}
