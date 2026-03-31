/**
 * 几何计算工具 - NFP 排料核心
 */

export interface Point {
    x: number;
    y: number;
}

export interface Polygon {
    id: string;
    points: Point[];
    rotation: number;
    source?: number; // 原始对象索引
}

export interface Placement {
    id: string;
    x: number;
    y: number;
    rotation: number;
    source: number;
}

export interface NestConfig {
    sheetWidth: number;
    sheetHeight: number;
    spacing: number;
    rotations: number;      // 旋转步数，如 4 表示 0°, 90°, 180°, 270°
    populationSize: number; // 遗传算法种群大小
    mutationRate: number;   // 变异率 0-1
    iterations: number;     // 迭代次数
}

// ==================== 基础几何函数 ====================

/**
 * 计算多边形面积（Shoelace formula）
 */
export function polygonArea(polygon: Point[]): number {
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += polygon[i].x * polygon[j].y;
        area -= polygon[j].x * polygon[i].y;
    }
    return Math.abs(area / 2);
}

/**
 * 计算多边形边界框
 */
export function getBounds(polygon: Point[]): {
    minX: number; minY: number; maxX: number; maxY: number;
    width: number; height: number
} {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const p of polygon) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * 旋转多边形
 */
export function rotatePolygon(polygon: Point[], angleDeg: number): Point[] {
    const angle = angleDeg * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // 找到中心点
    const bounds = getBounds(polygon);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;

    return polygon.map(p => ({
        x: cos * (p.x - cx) - sin * (p.y - cy) + cx,
        y: sin * (p.x - cx) + cos * (p.y - cy) + cy
    }));
}

/**
 * 平移多边形
 */
export function translatePolygon(polygon: Point[], dx: number, dy: number): Point[] {
    return polygon.map(p => ({ x: p.x + dx, y: p.y + dy }));
}

/**
 * 归一化多边形（移动到原点）
 */
export function normalizePolygon(polygon: Point[]): Point[] {
    const bounds = getBounds(polygon);
    return translatePolygon(polygon, -bounds.minX, -bounds.minY);
}

/**
 * 简化多边形（Douglas-Peucker 算法）
 */
export function simplifyPolygon(polygon: Point[], tolerance: number): Point[] {
    if (polygon.length <= 2) return polygon;

    function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
        return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / d;
    }

    function simplify(points: Point[], epsilon: number): Point[] {
        if (points.length <= 2) return points;

        let maxDist = 0;
        let maxIndex = 0;

        for (let i = 1; i < points.length - 1; i++) {
            const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }

        if (maxDist > epsilon) {
            const left = simplify(points.slice(0, maxIndex + 1), epsilon);
            const right = simplify(points.slice(maxIndex), epsilon);
            return left.slice(0, -1).concat(right);
        } else {
            return [points[0], points[points.length - 1]];
        }
    }

    return simplify(polygon, tolerance);
}

// ==================== NFP 核心算法 ====================

/**
 * 计算两个多边形的 No-Fit Polygon
 * NFP 表示 B 相对于 A 的所有不重叠位置的边界
 */
export function computeNFP(polygonA: Point[], polygonB: Point[]): Point[] {
    // 使用 Minkowski sum 方法计算 NFP
    // NFP = A ⊕ (-B)，其中 -B 是 B 关于原点的反射

    const negB = polygonB.map(p => ({ x: -p.x, y: -p.y }));
    return minkowskiSum(polygonA, negB);
}

/**
 * Minkowski Sum 计算
 */
function minkowskiSum(A: Point[], B: Point[]): Point[] {
    // 确保多边形是逆时针方向
    const aClockwise = isClockwise(A);
    const bClockwise = isClockwise(B);

    const polyA = aClockwise ? A.slice().reverse() : A;
    const polyB = bClockwise ? B.slice().reverse() : B;

    // 找到两个多边形的最低点作为起点
    let aStart = 0, bStart = 0;
    for (let i = 1; i < polyA.length; i++) {
        if (polyA[i].y < polyA[aStart].y ||
            (polyA[i].y === polyA[aStart].y && polyA[i].x < polyA[aStart].x)) {
            aStart = i;
        }
    }
    for (let i = 1; i < polyB.length; i++) {
        if (polyB[i].y < polyB[bStart].y ||
            (polyB[i].y === polyB[bStart].y && polyB[i].x < polyB[bStart].x)) {
            bStart = i;
        }
    }

    const result: Point[] = [];
    let ai = aStart, bi = bStart;
    const aLen = polyA.length, bLen = polyB.length;

    // 合并边
    for (let i = 0; i < aLen + bLen; i++) {
        const aNext = (ai + 1) % aLen;
        const bNext = (bi + 1) % bLen;

        // 当前点
        result.push({
            x: polyA[ai].x + polyB[bi].x,
            y: polyA[ai].y + polyB[bi].y
        });

        // 计算边的角度
        const aEdge = { x: polyA[aNext].x - polyA[ai].x, y: polyA[aNext].y - polyA[ai].y };
        const bEdge = { x: polyB[bNext].x - polyB[bi].x, y: polyB[bNext].y - polyB[bi].y };

        const aAngle = Math.atan2(aEdge.y, aEdge.x);
        const bAngle = Math.atan2(bEdge.y, bEdge.x);

        // 选择角度较小的边前进
        if (normalizeAngle(aAngle) < normalizeAngle(bAngle)) {
            ai = aNext;
        } else if (normalizeAngle(bAngle) < normalizeAngle(aAngle)) {
            bi = bNext;
        } else {
            ai = aNext;
            bi = bNext;
        }
    }

    return result;
}

function normalizeAngle(angle: number): number {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
}

function isClockwise(polygon: Point[]): boolean {
    let sum = 0;
    for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        sum += (polygon[j].x - polygon[i].x) * (polygon[j].y + polygon[i].y);
    }
    return sum > 0;
}

// ==================== 碰撞检测 ====================

/**
 * 检测点是否在多边形内
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        if (((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * 检测两个多边形是否重叠
 */
export function polygonsOverlap(A: Point[], B: Point[]): boolean {
    // SAT (Separating Axis Theorem) 检测
    function getAxes(polygon: Point[]): Point[] {
        const axes: Point[] = [];
        for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            const edge = { x: polygon[j].x - polygon[i].x, y: polygon[j].y - polygon[i].y };
            // 法向量
            const len = Math.sqrt(edge.x * edge.x + edge.y * edge.y);
            if (len > 0) {
                axes.push({ x: -edge.y / len, y: edge.x / len });
            }
        }
        return axes;
    }

    function project(polygon: Point[], axis: Point): { min: number; max: number } {
        let min = Infinity, max = -Infinity;
        for (const p of polygon) {
            const dot = p.x * axis.x + p.y * axis.y;
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }
        return { min, max };
    }

    const axes = [...getAxes(A), ...getAxes(B)];

    for (const axis of axes) {
        const projA = project(A, axis);
        const projB = project(B, axis);

        if (projA.max < projB.min || projB.max < projA.min) {
            return false; // 找到分离轴，不重叠
        }
    }

    return true; // 没有分离轴，重叠
}

// ==================== 排料引擎 ====================

export interface NestResult {
    placements: Placement[];
    fitness: number;
    sheetCount: number;
}

/**
 * NFP 排料引擎
 */
export class NFPNestingEngine {
    private config: NestConfig;
    private nfpCache: Map<string, Point[]> = new Map();

    constructor(config: NestConfig) {
        this.config = config;
    }

    /**
     * 执行排料
     */
    nest(polygons: Polygon[]): NestResult {
        const { populationSize, iterations, mutationRate } = this.config;

        // 生成初始种群
        let population = this.initPopulation(polygons, populationSize);

        // 评估初始种群
        for (const individual of population) {
            individual.fitness = this.evaluate(individual, polygons);
        }

        // 遗传算法迭代
        for (let gen = 0; gen < iterations; gen++) {
            // 排序（适应度越小越好）
            population.sort((a, b) => a.fitness - b.fitness);

            // 选择 + 交叉 + 变异
            const newPopulation = [population[0]]; // 保留最优

            while (newPopulation.length < populationSize) {
                const parent1 = this.select(population);
                const parent2 = this.select(population);
                let child = this.crossover(parent1, parent2);

                if (Math.random() < mutationRate) {
                    child = this.mutate(child, polygons.length);
                }

                child.fitness = this.evaluate(child, polygons);
                newPopulation.push(child);
            }

            population = newPopulation;
        }

        // 返回最优解
        population.sort((a, b) => a.fitness - b.fitness);
        const best = population[0];

        return this.decode(best, polygons);
    }

    private initPopulation(polygons: Polygon[], size: number): Individual[] {
        const population: Individual[] = [];
        const rotationStep = 360 / this.config.rotations;

        for (let i = 0; i < size; i++) {
            const order = polygons.map((_, idx) => idx);
            // 随机打乱顺序
            for (let j = order.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [order[j], order[k]] = [order[k], order[j]];
            }

            const rotations = polygons.map(() =>
                Math.floor(Math.random() * this.config.rotations) * rotationStep
            );

            population.push({ order, rotations, fitness: Infinity });
        }

        // 第一个使用面积降序排列
        const areaOrder = polygons
            .map((p, i) => ({ i, area: polygonArea(p.points) }))
            .sort((a, b) => b.area - a.area)
            .map(x => x.i);
        population[0].order = areaOrder;
        population[0].rotations = polygons.map(() => 0);

        return population;
    }

    private evaluate(individual: Individual, polygons: Polygon[]): number {
        const result = this.place(individual, polygons);
        // 适应度 = 使用的总高度（越小越好）
        return result.totalHeight;
    }

    private place(individual: Individual, polygons: Polygon[]): { placements: Placement[]; totalHeight: number } {
        const { sheetWidth, sheetHeight, spacing } = this.config;
        const placements: Placement[] = [];

        // 已放置的多边形
        const placed: { polygon: Point[]; x: number; y: number }[] = [];

        for (let i = 0; i < individual.order.length; i++) {
            const idx = individual.order[i];
            const rotation = individual.rotations[idx];
            const poly = polygons[idx];

            // 旋转多边形
            let rotatedPoints = rotatePolygon(poly.points, rotation);
            rotatedPoints = normalizePolygon(rotatedPoints);

            // 找到最佳放置位置
            const position = this.findPosition(rotatedPoints, placed, sheetWidth, sheetHeight, spacing);

            if (position) {
                const translatedPoints = translatePolygon(rotatedPoints, position.x, position.y);
                placed.push({ polygon: translatedPoints, x: position.x, y: position.y });

                placements.push({
                    id: poly.id,
                    x: position.x,
                    y: position.y,
                    rotation: rotation,
                    source: poly.source || idx
                });
            }
        }

        // 计算总高度
        let maxY = 0;
        for (const p of placed) {
            const bounds = getBounds(p.polygon);
            if (bounds.maxY > maxY) maxY = bounds.maxY;
        }

        return { placements, totalHeight: maxY };
    }

    private findPosition(
        polygon: Point[],
        placed: { polygon: Point[]; x: number; y: number }[],
        sheetWidth: number,
        sheetHeight: number,
        spacing: number
    ): { x: number; y: number } | null {
        const bounds = getBounds(polygon);

        if (placed.length === 0) {
            // 第一个放在左上角
            return { x: spacing, y: spacing };
        }

        // 候选位置：沿着已放置多边形的边缘
        const candidates: { x: number; y: number; score: number }[] = [];

        // 底部位置
        candidates.push({ x: spacing, y: spacing, score: 0 });

        for (const p of placed) {
            const pBounds = getBounds(p.polygon);

            // 右侧
            candidates.push({
                x: pBounds.maxX + spacing,
                y: p.y,
                score: p.y * sheetWidth + pBounds.maxX
            });

            // 上方
            candidates.push({
                x: p.x,
                y: pBounds.maxY + spacing,
                score: (pBounds.maxY + spacing) * sheetWidth + p.x
            });
        }

        // 按得分排序（优先靠下靠左）
        candidates.sort((a, b) => a.score - b.score);

        for (const pos of candidates) {
            // 检查是否超出边界
            if (pos.x + bounds.width > sheetWidth - spacing) continue;
            if (pos.y + bounds.height > sheetHeight - spacing) continue;

            // 检查是否与已放置的多边形重叠
            const testPoly = translatePolygon(polygon, pos.x, pos.y);
            let overlap = false;

            for (const p of placed) {
                if (polygonsOverlap(testPoly, p.polygon)) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                return pos;
            }
        }

        return null;
    }

    private select(population: Individual[]): Individual {
        // 锦标赛选择
        const tournamentSize = 3;
        let best = population[Math.floor(Math.random() * population.length)];

        for (let i = 1; i < tournamentSize; i++) {
            const contestant = population[Math.floor(Math.random() * population.length)];
            if (contestant.fitness < best.fitness) {
                best = contestant;
            }
        }

        return best;
    }

    private crossover(parent1: Individual, parent2: Individual): Individual {
        // 顺序交叉 (OX)
        const len = parent1.order.length;
        const start = Math.floor(Math.random() * len);
        const end = start + Math.floor(Math.random() * (len - start));

        const childOrder = new Array(len).fill(-1);
        const childRotations = [...parent1.rotations];

        // 复制 parent1 的一段
        for (let i = start; i <= end; i++) {
            childOrder[i] = parent1.order[i];
        }

        // 从 parent2 填充剩余
        let j = 0;
        for (let i = 0; i < len; i++) {
            if (childOrder[i] === -1) {
                while (childOrder.includes(parent2.order[j])) j++;
                childOrder[i] = parent2.order[j++];
            }
        }

        return { order: childOrder, rotations: childRotations, fitness: Infinity };
    }

    private mutate(individual: Individual, len: number): Individual {
        const order = [...individual.order];
        const rotations = [...individual.rotations];

        // 交换两个位置
        const i = Math.floor(Math.random() * len);
        const j = Math.floor(Math.random() * len);
        [order[i], order[j]] = [order[j], order[i]];

        // 随机改变一个旋转
        const k = Math.floor(Math.random() * len);
        const rotationStep = 360 / this.config.rotations;
        rotations[k] = Math.floor(Math.random() * this.config.rotations) * rotationStep;

        return { order, rotations, fitness: Infinity };
    }

    private decode(individual: Individual, polygons: Polygon[]): NestResult {
        const { placements, totalHeight } = this.place(individual, polygons);
        const sheetCount = Math.ceil(totalHeight / this.config.sheetHeight);

        return {
            placements,
            fitness: individual.fitness,
            sheetCount: Math.max(1, sheetCount)
        };
    }
}

interface Individual {
    order: number[];
    rotations: number[];
    fitness: number;
}
