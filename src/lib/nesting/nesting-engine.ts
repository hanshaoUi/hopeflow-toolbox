/**
 * 简化版排料引擎
 * 基于 Bottom-Left 算法 + NFP 概念
 * 用于概念验证，后续可升级为完整的遗传算法版本
 */

export interface Point {
    x: number;
    y: number;
}

export interface Polygon {
    id: string;
    points: Point[];
    rotation?: number;
    placement?: Point;
}

export interface NestingConfig {
    sheetWidth: number;      // 板材宽度
    sheetHeight: number;     // 板材高度
    spacing: number;         // 零件间距
    rotations: number;       // 旋转步数 (4 = 0°, 90°, 180°, 270°)
}

export interface NestingResult {
    success: boolean;
    placements: Array<{
        id: string;
        x: number;
        y: number;
        rotation: number;
    }>;
    utilization: number;     // 材料利用率 0-1
    sheetsUsed: number;      // 使用的板材数量
}

/**
 * 获取多边形边界框
 */
function getBounds(polygon: Point[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const p of polygon) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * 计算多边形面积 (Shoelace formula)
 */
function getPolygonArea(polygon: Point[]): number {
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
 * 旋转多边形
 */
function rotatePolygon(polygon: Point[], degrees: number): Point[] {
    const angle = degrees * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return polygon.map(p => ({
        x: p.x * cos - p.y * sin,
        y: p.x * sin + p.y * cos
    }));
}

/**
 * 归一化多边形 (移动到原点)
 */
function normalizePolygon(polygon: Point[]): Point[] {
    const bounds = getBounds(polygon);
    return polygon.map(p => ({
        x: p.x - bounds.minX,
        y: p.y - bounds.minY
    }));
}

/**
 * 检查两个边界框是否重叠
 */
function boundsOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
    spacing: number
): boolean {
    return !(
        a.x + a.width + spacing <= b.x ||
        b.x + b.width + spacing <= a.x ||
        a.y + a.height + spacing <= b.y ||
        b.y + b.height + spacing <= a.y
    );
}

/**
 * Bottom-Left 排料算法
 */
export class NestingEngine {
    private config: NestingConfig;

    constructor(config: NestingConfig) {
        this.config = config;
    }

    /**
     * 执行排料计算
     */
    nest(polygons: Polygon[]): NestingResult {
        const { sheetWidth, sheetHeight, spacing, rotations } = this.config;

        // 计算每个多边形在不同旋转角度下的边界
        const parts = polygons.map(poly => {
            const bestRotation = this.findBestRotation(poly.points, rotations);
            const rotated = rotatePolygon(poly.points, bestRotation);
            const normalized = normalizePolygon(rotated);
            const bounds = getBounds(normalized);

            return {
                id: poly.id,
                points: normalized,
                rotation: bestRotation,
                width: bounds.width,
                height: bounds.height,
                area: getPolygonArea(poly.points),
                placed: false,
                x: 0,
                y: 0
            };
        });

        // 按面积降序排列 (大件优先)
        parts.sort((a, b) => b.area - a.area);

        // 已放置的零件
        const placed: typeof parts = [];
        const placements: NestingResult['placements'] = [];

        // Bottom-Left 放置
        for (const part of parts) {
            const position = this.findPosition(part, placed, sheetWidth, sheetHeight, spacing);

            if (position) {
                part.x = position.x;
                part.y = position.y;
                part.placed = true;
                placed.push(part);

                placements.push({
                    id: part.id,
                    x: position.x,
                    y: position.y,
                    rotation: part.rotation
                });
            }
        }

        // 计算利用率
        const totalPartArea = placed.reduce((sum, p) => sum + p.area, 0);
        const sheetArea = sheetWidth * sheetHeight;
        const utilization = totalPartArea / sheetArea;

        return {
            success: placed.length === parts.length,
            placements,
            utilization,
            sheetsUsed: 1 // 简化版只支持单板材
        };
    }

    /**
     * 找到最佳旋转角度 (使边界框最小)
     */
    private findBestRotation(polygon: Point[], rotationSteps: number): number {
        let bestAngle = 0;
        let minArea = Infinity;

        for (let i = 0; i < rotationSteps; i++) {
            const angle = i * (360 / rotationSteps);
            const rotated = rotatePolygon(polygon, angle);
            const bounds = getBounds(rotated);
            const area = bounds.width * bounds.height;

            if (area < minArea) {
                minArea = area;
                bestAngle = angle;
            }
        }

        return bestAngle;
    }

    /**
     * 使用 Bottom-Left 策略找到放置位置
     */
    private findPosition(
        part: { width: number; height: number },
        placed: Array<{ x: number; y: number; width: number; height: number }>,
        sheetWidth: number,
        sheetHeight: number,
        spacing: number
    ): Point | null {
        // 候选位置: 左下角、已放置零件的右边和上边
        const candidates: Point[] = [{ x: 0, y: 0 }];

        for (const p of placed) {
            candidates.push({ x: p.x + p.width + spacing, y: p.y });
            candidates.push({ x: p.x, y: p.y + p.height + spacing });
        }

        // 按 y, x 排序 (Bottom-Left)
        candidates.sort((a, b) => a.y - b.y || a.x - b.x);

        for (const pos of candidates) {
            // 检查是否超出板材
            if (pos.x + part.width > sheetWidth || pos.y + part.height > sheetHeight) {
                continue;
            }

            // 检查是否与已放置零件重叠
            const newBounds = { x: pos.x, y: pos.y, width: part.width, height: part.height };
            let overlap = false;

            for (const p of placed) {
                if (boundsOverlap(newBounds, p, spacing)) {
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
}

/**
 * 便捷函数: 执行排料
 */
export function nestPolygons(polygons: Polygon[], config: NestingConfig): NestingResult {
    const engine = new NestingEngine(config);
    return engine.nest(polygons);
}
