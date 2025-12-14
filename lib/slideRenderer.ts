// スライド構造JSONからSVGを生成するレンダラー
// サーバーサイド（Node.js）で動作

import type {
  SlideStructure,
  SlideStructureElement,
  WaterfallChart,
  FlowChart,
  BulletListElement,
  NumberedExplanation,
  TextElement,
  TableElement,
  HierarchyChart,
  HierarchyNode,
  Shape,
  Connector,
  SplitLayout,
  ThreeColumnLayout,
  BarChart,
  PieChart,
  GanttChart,
  PyramidChart,
  CycleChart,
  VennChart,
  MatrixChart,
  FunnelChart,
  LineChart,
  RadarChart,
  ConvergenceChart,
  DivergenceChart,
  IconGridChart,
  StackedBarChart,
  RoadmapChart,
  RenderResult,
} from '@/types/slideStructure';
import type { ColorScheme } from '@/types';

// スライドのサイズ定数
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;
const HEADER_HEIGHT = 80;
const MESSAGE_HEIGHT = 50;
const FOOTER_HEIGHT = 40;
const PADDING = 40;

// ===== メインレンダリング関数 =====
export function renderSlideToSVG(structure: SlideStructure): RenderResult {
  try {
    const svg = generateSVG(structure);
    return {
      success: true,
      svgData: svg,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ===== SVG生成 =====
function generateSVG(structure: SlideStructure): string {
  const { style, header, mainMessage, content, footer } = structure;
  const { colors, fontFamily } = style;

  let svgContent = '';

  // 背景
  svgContent += `<rect width="${SLIDE_WIDTH}" height="${SLIDE_HEIGHT}" fill="${colors.background}"/>`;

  // ヘッダー
  svgContent += renderHeader(header, colors, fontFamily);

  // メッセージライン
  if (mainMessage) {
    svgContent += renderMainMessage(mainMessage, colors, fontFamily);
  }

  // コンテンツ領域
  const contentY = HEADER_HEIGHT + (mainMessage ? MESSAGE_HEIGHT : 0) + PADDING;
  const contentHeight = SLIDE_HEIGHT - contentY - FOOTER_HEIGHT - PADDING;

  if (content.element) {
    svgContent += renderElement(content.element, PADDING, contentY, SLIDE_WIDTH - PADDING * 2, contentHeight, colors, fontFamily);
  } else if (content.elements) {
    content.elements.forEach(element => {
      svgContent += renderElement(element, PADDING, contentY, SLIDE_WIDTH - PADDING * 2, contentHeight, colors, fontFamily);
    });
  }

  // 接続線
  if (structure.connections) {
    structure.connections.forEach(conn => {
      svgContent += renderConnection(conn, colors);
    });
  }

  // フッター
  if (footer) {
    svgContent += renderFooter(footer, colors, fontFamily);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_WIDTH}" height="${SLIDE_HEIGHT}" viewBox="0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}">
    <style>
      text { font-family: '${fontFamily}', 'Noto Sans JP', sans-serif; }
    </style>
    ${svgContent}
  </svg>`;
}

// ===== ヘッダー =====
function renderHeader(
  header: SlideStructure['header'],
  colors: ColorScheme,
  fontFamily: string
): string {
  let svg = '';

  // タイトル
  svg += `<text x="${PADDING}" y="45" font-size="28" font-weight="bold" fill="${colors.text}">${escapeXml(header.title)}</text>`;

  // サブタイトル
  if (header.subtitle) {
    svg += `<text x="${PADDING}" y="70" font-size="14" fill="${colors.text}" opacity="0.7">${escapeXml(header.subtitle)}</text>`;
  }

  // タグ（右上）
  if (header.tag) {
    const tagWidth = header.tag.length * 12 + 20;
    svg += `<rect x="${SLIDE_WIDTH - PADDING - tagWidth}" y="20" width="${tagWidth}" height="28" rx="4" fill="${colors.accent}"/>`;
    svg += `<text x="${SLIDE_WIDTH - PADDING - tagWidth / 2}" y="40" font-size="12" fill="white" text-anchor="middle">${escapeXml(header.tag)}</text>`;
  }

  // 区切り線
  svg += `<line x1="${PADDING}" y1="${HEADER_HEIGHT}" x2="${SLIDE_WIDTH - PADDING}" y2="${HEADER_HEIGHT}" stroke="${colors.text}" stroke-opacity="0.2" stroke-width="1"/>`;

  return svg;
}

// ===== メッセージライン =====
function renderMainMessage(
  message: string,
  colors: ColorScheme,
  fontFamily: string
): string {
  return `<text x="${PADDING}" y="${HEADER_HEIGHT + 35}" font-size="16" fill="${colors.text}" font-weight="500">${escapeXml(message)}</text>`;
}

// ===== フッター =====
function renderFooter(
  footer: NonNullable<SlideStructure['footer']>,
  colors: ColorScheme,
  fontFamily: string
): string {
  let svg = '';
  const footerY = SLIDE_HEIGHT - FOOTER_HEIGHT + 20;

  if (footer.source) {
    svg += `<text x="${PADDING}" y="${footerY}" font-size="10" fill="${colors.text}" opacity="0.5">${escapeXml(footer.source)}</text>`;
  }

  if (footer.pageNumber) {
    svg += `<text x="${SLIDE_WIDTH - PADDING}" y="${footerY}" font-size="12" fill="${colors.text}" opacity="0.5" text-anchor="end">${footer.pageNumber}</text>`;
  }

  return svg;
}

// ===== 要素レンダリング（ディスパッチャー） =====
function renderElement(
  element: SlideStructureElement,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: ColorScheme,
  fontFamily: string
): string {
  switch (element.type) {
    case 'waterfall':
      return renderWaterfall(element as WaterfallChart, x, y, width, height, colors);
    case 'flow':
      return renderFlow(element as FlowChart, x, y, width, height, colors);
    case 'bullet-list':
      return renderBulletList(element as BulletListElement, colors);
    case 'numbered-explanation':
      return renderNumberedExplanation(element as NumberedExplanation, colors);
    case 'text':
      return renderText(element as TextElement, colors);
    case 'table':
      return renderTable(element as TableElement, colors);
    case 'hierarchy':
      return renderHierarchy(element as HierarchyChart, x, y, width, height, colors);
    case 'rect':
    case 'rounded':
    case 'circle':
    case 'diamond':
      return renderShape(element as Shape, colors);
    case 'connector':
      return renderConnector(element as Connector, colors);
    case 'split-layout':
      return renderSplitLayout(element as SplitLayout, x, y, width, height, colors, fontFamily);
    case 'three-column':
      return renderThreeColumnLayout(element as ThreeColumnLayout, x, y, width, height, colors, fontFamily);
    case 'bar-chart':
      return renderBarChart(element as BarChart, x, y, width, height, colors);
    case 'pie-chart':
      return renderPieChart(element as PieChart, x, y, width, height, colors);
    case 'gantt':
      return renderGanttChart(element as GanttChart, x, y, width, height, colors);
    case 'pyramid':
      return renderPyramidChart(element as PyramidChart, x, y, width, height, colors);
    case 'cycle':
      return renderCycleChart(element as CycleChart, x, y, width, height, colors);
    case 'venn':
      return renderVennChart(element as VennChart, x, y, width, height, colors);
    case 'matrix':
      return renderMatrixChart(element as MatrixChart, x, y, width, height, colors);
    case 'funnel':
      return renderFunnelChart(element as FunnelChart, x, y, width, height, colors);
    case 'line-chart':
      return renderLineChart(element as LineChart, x, y, width, height, colors);
    case 'radar':
      return renderRadarChart(element as RadarChart, x, y, width, height, colors);
    case 'convergence':
      return renderConvergenceChart(element as ConvergenceChart, x, y, width, height, colors);
    case 'divergence':
      return renderDivergenceChart(element as DivergenceChart, x, y, width, height, colors);
    case 'icon-grid':
      return renderIconGridChart(element as IconGridChart, x, y, width, height, colors);
    case 'stacked-bar':
      return renderStackedBarChart(element as StackedBarChart, x, y, width, height, colors);
    case 'roadmap':
      return renderRoadmapChart(element as RoadmapChart, x, y, width, height, colors);
    default:
      return '';
  }
}

// ===== ウォーターフォールチャート =====
function renderWaterfall(
  chart: WaterfallChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, startLabel, startValue, steps, endLabel, endValue } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const barCount = steps.length + 2; // start + steps + end
  const barWidth = Math.min(60, (width - 20) / barCount);
  const gap = (width - barWidth * barCount) / (barCount + 1);
  const maxValue = startValue;
  const scale = (height - 60) / maxValue;

  const positiveColor = chart.positiveColor || colors.secondary;
  const negativeColor = chart.negativeColor || '#ef4444';
  const highlightColor = chart.highlightColor || colors.accent;

  // 開始バー
  const startBarHeight = startValue * scale;
  svg += `<rect x="${actualX + gap}" y="${actualY + height - startBarHeight - 30}" width="${barWidth}" height="${startBarHeight}" fill="${colors.primary}" rx="2"/>`;
  svg += `<text x="${actualX + gap + barWidth / 2}" y="${actualY + height - 10}" font-size="10" fill="${colors.text}" text-anchor="middle">${escapeXml(startLabel)}</text>`;
  svg += `<text x="${actualX + gap + barWidth / 2}" y="${actualY + height - startBarHeight - 35}" font-size="11" fill="${colors.text}" text-anchor="middle" font-weight="bold">${startValue}%</text>`;

  // 各ステップ
  let currentValue = startValue;
  steps.forEach((step, i) => {
    const barX = actualX + gap + (i + 1) * (barWidth + gap);
    const newValue = currentValue + step.delta;
    const stepBarHeight = Math.abs(step.delta) * scale;
    const barY = step.delta < 0
      ? actualY + height - currentValue * scale - 30
      : actualY + height - newValue * scale - 30;

    const barColor = step.highlight ? highlightColor : (step.delta < 0 ? negativeColor : positiveColor);

    svg += `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${stepBarHeight}" fill="${barColor}" rx="2"/>`;

    // 番号ラベル（丸付き）
    if (step.number) {
      svg += `<circle cx="${barX + barWidth / 2}" cy="${barY - 15}" r="10" fill="${barColor}"/>`;
      svg += `<text x="${barX + barWidth / 2}" y="${barY - 11}" font-size="10" fill="white" text-anchor="middle" font-weight="bold">${step.number}</text>`;
    }

    // 下部ラベル
    const labelLines = wrapText(step.label, barWidth + 10, 9);
    labelLines.forEach((line, lineIdx) => {
      svg += `<text x="${barX + barWidth / 2}" y="${actualY + height - 10 + lineIdx * 11}" font-size="9" fill="${colors.text}" text-anchor="middle">${escapeXml(line)}</text>`;
    });

    // デルタ値
    svg += `<text x="${barX + barWidth / 2}" y="${barY + stepBarHeight / 2 + 4}" font-size="10" fill="white" text-anchor="middle" font-weight="bold">${step.delta}%</text>`;

    currentValue = newValue;
  });

  // 終了バー
  const endBarX = actualX + gap + (steps.length + 1) * (barWidth + gap);
  const endBarHeight = endValue * scale;
  svg += `<rect x="${endBarX}" y="${actualY + height - endBarHeight - 30}" width="${barWidth}" height="${endBarHeight}" fill="${colors.primary}" rx="2"/>`;
  svg += `<text x="${endBarX + barWidth / 2}" y="${actualY + height - 10}" font-size="10" fill="${colors.text}" text-anchor="middle">${escapeXml(endLabel)}</text>`;
  svg += `<text x="${endBarX + barWidth / 2}" y="${actualY + height - endBarHeight - 35}" font-size="11" fill="${colors.text}" text-anchor="middle" font-weight="bold">${endValue}%</text>`;

  return svg;
}

// ===== フローチャート =====
function renderFlow(
  chart: FlowChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, direction, nodes, connections } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const nodeCount = nodes.length;
  const isHorizontal = direction === 'horizontal';

  const nodeWidth = isHorizontal ? Math.min(120, (width - 40) / nodeCount) : width - 40;
  const nodeHeight = isHorizontal ? height - 40 : Math.min(60, (height - 40) / nodeCount);
  const gap = isHorizontal
    ? (width - nodeWidth * nodeCount) / (nodeCount + 1)
    : (height - nodeHeight * nodeCount) / (nodeCount + 1);

  // ノードの位置を計算
  const nodePositions: Record<string, { x: number; y: number; w: number; h: number }> = {};

  nodes.forEach((node, i) => {
    const nx = isHorizontal ? actualX + gap + i * (nodeWidth + gap) : actualX + 20;
    const ny = isHorizontal ? actualY + 20 : actualY + gap + i * (nodeHeight + gap);
    nodePositions[node.id] = { x: nx, y: ny, w: nodeWidth, h: nodeHeight };

    const nodeColor = node.color || colors.primary;
    svg += `<rect x="${nx}" y="${ny}" width="${nodeWidth}" height="${nodeHeight}" fill="${nodeColor}" rx="8"/>`;

    // ラベル
    const labelLines = wrapText(node.label, nodeWidth - 10, 12);
    const labelStartY = ny + nodeHeight / 2 - (labelLines.length - 1) * 7;
    labelLines.forEach((line, lineIdx) => {
      svg += `<text x="${nx + nodeWidth / 2}" y="${labelStartY + lineIdx * 14}" font-size="12" fill="white" text-anchor="middle" font-weight="500">${escapeXml(line)}</text>`;
    });
  });

  // 接続矢印
  connections.forEach(conn => {
    const from = nodePositions[conn.from];
    const to = nodePositions[conn.to];
    if (!from || !to) return;

    const fromX = isHorizontal ? from.x + from.w : from.x + from.w / 2;
    const fromY = isHorizontal ? from.y + from.h / 2 : from.y + from.h;
    const toX = isHorizontal ? to.x : to.x + to.w / 2;
    const toY = isHorizontal ? to.y + to.h / 2 : to.y;

    svg += `<line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="${colors.text}" stroke-width="2" marker-end="url(#arrowhead)"/>`;
  });

  // 矢印マーカー定義
  svg = `<defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="${colors.text}"/>
    </marker>
  </defs>` + svg;

  return svg;
}

// ===== 箇条書きリスト =====
function renderBulletList(
  list: BulletListElement,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, items, fontSize, lineHeight = 1.6, color } = list;
  const textColor = color || colors.text;

  let currentY = y;
  items.forEach(item => {
    const indent = (item.indent || 0) * 20;
    const bullet = item.bullet || '•';

    svg += `<text x="${x + indent}" y="${currentY}" font-size="${fontSize}" fill="${textColor}">${bullet}</text>`;

    const lines = wrapText(item.text, width - indent - 20, fontSize);
    lines.forEach((line, lineIdx) => {
      svg += `<text x="${x + indent + 15}" y="${currentY + lineIdx * fontSize * lineHeight}" font-size="${fontSize}" fill="${textColor}">${escapeXml(line)}</text>`;
    });

    currentY += lines.length * fontSize * lineHeight + 5;
  });

  return svg;
}

// ===== 番号付き説明リスト =====
function renderNumberedExplanation(
  list: NumberedExplanation,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, items, fontSize, numberColor } = list;
  const numColor = numberColor || colors.primary;

  let currentY = y;
  items.forEach(item => {
    // 番号バッジ
    const badgeRadius = 14;
    svg += `<circle cx="${x + badgeRadius}" cy="${currentY}" r="${badgeRadius}" fill="${item.highlight ? colors.accent : numColor}"/>`;
    svg += `<text x="${x + badgeRadius}" y="${currentY + 5}" font-size="12" fill="white" text-anchor="middle" font-weight="bold">${item.number}</text>`;

    // タイトル
    svg += `<text x="${x + badgeRadius * 2 + 10}" y="${currentY + 5}" font-size="${fontSize}" fill="${colors.text}" font-weight="bold">${escapeXml(item.title)}</text>`;
    currentY += fontSize + 8;

    // 説明文
    if (item.description) {
      const descLines = wrapText(item.description, width - badgeRadius * 2 - 20, fontSize - 2);
      descLines.forEach(line => {
        svg += `<text x="${x + badgeRadius * 2 + 10}" y="${currentY}" font-size="${fontSize - 2}" fill="${colors.text}" opacity="0.8">${escapeXml(line)}</text>`;
        currentY += (fontSize - 2) * 1.4;
      });
    }

    // 箇条書き
    if (item.bullets) {
      item.bullets.forEach(bullet => {
        svg += `<text x="${x + badgeRadius * 2 + 10}" y="${currentY}" font-size="${fontSize - 2}" fill="${colors.text}">• ${escapeXml(bullet)}</text>`;
        currentY += (fontSize - 2) * 1.4;
      });
    }

    currentY += 15;
  });

  return svg;
}

// ===== テキスト要素 =====
function renderText(element: TextElement, colors: ColorScheme): string {
  const { x, y, text, fontSize, fontWeight = 'normal', color, align = 'left', maxWidth } = element;
  const textColor = color || colors.text;
  const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';

  if (maxWidth) {
    const lines = wrapText(text, maxWidth, fontSize);
    return lines.map((line, i) =>
      `<text x="${x}" y="${y + i * fontSize * 1.4}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="${anchor}">${escapeXml(line)}</text>`
    ).join('');
  }

  return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="${anchor}">${escapeXml(text)}</text>`;
}

// ===== テーブル =====
function renderTable(table: TableElement, colors: ColorScheme): string {
  let svg = '';
  const { x, y, width, headers, rows, headerBgColor, headerTextColor, cellPadding = 10, fontSize = 12 } = table;
  const hBgColor = headerBgColor || colors.primary;
  const hTextColor = headerTextColor || 'white';

  const colCount = headers.length;
  const colWidth = width / colCount;
  const rowHeight = fontSize * 2.5;

  // ヘッダー
  svg += `<rect x="${x}" y="${y}" width="${width}" height="${rowHeight}" fill="${hBgColor}"/>`;
  headers.forEach((header, i) => {
    svg += `<text x="${x + i * colWidth + colWidth / 2}" y="${y + rowHeight / 2 + fontSize / 3}" font-size="${fontSize}" fill="${hTextColor}" text-anchor="middle" font-weight="bold">${escapeXml(header)}</text>`;
  });

  // データ行
  rows.forEach((row, rowIdx) => {
    const rowY = y + rowHeight * (rowIdx + 1);
    const bgColor = rowIdx % 2 === 0 ? colors.background : `${colors.primary}10`;
    svg += `<rect x="${x}" y="${rowY}" width="${width}" height="${rowHeight}" fill="${bgColor}"/>`;

    row.forEach((cell, colIdx) => {
      svg += `<text x="${x + colIdx * colWidth + colWidth / 2}" y="${rowY + rowHeight / 2 + fontSize / 3}" font-size="${fontSize}" fill="${colors.text}" text-anchor="middle">${escapeXml(cell)}</text>`;
    });
  });

  // 枠線
  svg += `<rect x="${x}" y="${y}" width="${width}" height="${rowHeight * (rows.length + 1)}" fill="none" stroke="${colors.text}" stroke-opacity="0.2"/>`;

  return svg;
}

// ===== 階層図 =====
function renderHierarchy(
  chart: HierarchyChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, root } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  // 再帰的にノードを描画
  const drawNode = (node: HierarchyNode, nx: number, ny: number, nw: number, nh: number, level: number): void => {
    const nodeColor = node.color || (level === 0 ? colors.primary : colors.secondary);
    const nodeHeight = 40;

    svg += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nodeHeight}" fill="${nodeColor}" rx="6"/>`;
    svg += `<text x="${nx + nw / 2}" y="${ny + nodeHeight / 2 + 5}" font-size="12" fill="white" text-anchor="middle" font-weight="500">${escapeXml(node.label)}</text>`;

    if (node.children && node.children.length > 0) {
      const childWidth = (nw - 20) / node.children.length;
      const childY = ny + nodeHeight + 30;

      node.children.forEach((child, i) => {
        const childX = nx + 10 + i * childWidth;

        // 接続線
        svg += `<line x1="${nx + nw / 2}" y1="${ny + nodeHeight}" x2="${childX + childWidth / 2}" y2="${childY}" stroke="${colors.text}" stroke-opacity="0.3" stroke-width="1"/>`;

        drawNode(child, childX, childY, childWidth - 10, nh - nodeHeight - 30, level + 1);
      });
    }
  };

  drawNode(root, actualX, actualY, width, height, 0);

  return svg;
}

// ===== 基本図形 =====
function renderShape(shape: Shape, colors: ColorScheme): string {
  const { type, x, y, width, height, fill, stroke, strokeWidth = 1, text, fontSize = 12, textColor } = shape;
  const fillColor = fill || colors.primary;
  const strokeColor = stroke || colors.text;
  const txtColor = textColor || 'white';

  let svg = '';

  switch (type) {
    case 'rect':
      svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
      break;
    case 'rounded':
      svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="8"/>`;
      break;
    case 'circle':
      const r = Math.min(width, height) / 2;
      svg += `<circle cx="${x + width / 2}" cy="${y + height / 2}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
      break;
    case 'diamond':
      const cx = x + width / 2;
      const cy = y + height / 2;
      svg += `<polygon points="${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
      break;
  }

  if (text) {
    svg += `<text x="${x + width / 2}" y="${y + height / 2 + fontSize / 3}" font-size="${fontSize}" fill="${txtColor}" text-anchor="middle">${escapeXml(text)}</text>`;
  }

  return svg;
}

// ===== コネクタ =====
function renderConnector(conn: Connector, colors: ColorScheme): string {
  const { from, to, style, label, color } = conn;
  const strokeColor = color || colors.text;

  let svg = '';

  if (style === 'dashed') {
    svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="5,5"/>`;
  } else if (style === 'arrow') {
    svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${strokeColor}" stroke-width="2" marker-end="url(#arrowhead)"/>`;
  } else {
    svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${strokeColor}" stroke-width="2"/>`;
  }

  if (label) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    svg += `<text x="${midX}" y="${midY - 5}" font-size="10" fill="${strokeColor}" text-anchor="middle">${escapeXml(label)}</text>`;
  }

  return svg;
}

// ===== 分割レイアウト =====
function renderSplitLayout(
  layout: SplitLayout,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: ColorScheme,
  fontFamily: string
): string {
  let svg = '';
  const { direction, ratio, left, right, divider } = layout;
  const totalRatio = ratio[0] + ratio[1];

  if (direction === 'horizontal') {
    const leftWidth = width * ratio[0] / totalRatio;
    const rightWidth = width * ratio[1] / totalRatio;

    svg += renderElement(left, x, y, leftWidth - 10, height, colors, fontFamily);
    svg += renderElement(right, x + leftWidth + 10, y, rightWidth - 10, height, colors, fontFamily);

    if (divider) {
      svg += `<line x1="${x + leftWidth}" y1="${y}" x2="${x + leftWidth}" y2="${y + height}" stroke="${colors.text}" stroke-opacity="0.2" stroke-width="1"/>`;
    }
  } else {
    const topHeight = height * ratio[0] / totalRatio;
    const bottomHeight = height * ratio[1] / totalRatio;

    svg += renderElement(left, x, y, width, topHeight - 10, colors, fontFamily);
    svg += renderElement(right, x, y + topHeight + 10, width, bottomHeight - 10, colors, fontFamily);

    if (divider) {
      svg += `<line x1="${x}" y1="${y + topHeight}" x2="${x + width}" y2="${y + topHeight}" stroke="${colors.text}" stroke-opacity="0.2" stroke-width="1"/>`;
    }
  }

  return svg;
}

// ===== 接続線レンダリング =====
function renderConnection(
  conn: NonNullable<SlideStructure['connections']>[0],
  colors: ColorScheme
): string {
  // 簡易実装：座標ベースの接続
  return '';
}

// ===== ユーティリティ関数 =====
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const charWidth = fontSize * 0.6; // 概算
  const maxChars = Math.floor(maxWidth / charWidth);

  if (text.length <= maxChars) {
    return [text];
  }

  const lines: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      lines.push(remaining);
      break;
    }

    // 単語の途中で切らないように調整
    let breakPoint = maxChars;
    const spaceIndex = remaining.lastIndexOf(' ', maxChars);
    const jpBreak = remaining.lastIndexOf('、', maxChars);
    const jpBreak2 = remaining.lastIndexOf('。', maxChars);

    if (spaceIndex > maxChars * 0.5) {
      breakPoint = spaceIndex;
    } else if (jpBreak > maxChars * 0.5) {
      breakPoint = jpBreak + 1;
    } else if (jpBreak2 > maxChars * 0.5) {
      breakPoint = jpBreak2 + 1;
    }

    lines.push(remaining.substring(0, breakPoint).trim());
    remaining = remaining.substring(breakPoint).trim();
  }

  return lines;
}

// ===== 3カラムレイアウト =====
function renderThreeColumnLayout(
  layout: ThreeColumnLayout,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: ColorScheme,
  fontFamily: string
): string {
  let svg = '';
  const { columns, ratios = [1, 1, 1], dividers } = layout;
  const totalRatio = ratios[0] + ratios[1] + ratios[2];
  const gap = 20;

  const col1Width = (width - gap * 2) * ratios[0] / totalRatio;
  const col2Width = (width - gap * 2) * ratios[1] / totalRatio;
  const col3Width = (width - gap * 2) * ratios[2] / totalRatio;

  svg += renderElement(columns[0], x, y, col1Width, height, colors, fontFamily);
  svg += renderElement(columns[1], x + col1Width + gap, y, col2Width, height, colors, fontFamily);
  svg += renderElement(columns[2], x + col1Width + col2Width + gap * 2, y, col3Width, height, colors, fontFamily);

  if (dividers) {
    svg += `<line x1="${x + col1Width + gap / 2}" y1="${y}" x2="${x + col1Width + gap / 2}" y2="${y + height}" stroke="${colors.text}" stroke-opacity="0.2" stroke-width="1"/>`;
    svg += `<line x1="${x + col1Width + col2Width + gap * 1.5}" y1="${y}" x2="${x + col1Width + col2Width + gap * 1.5}" y2="${y + height}" stroke="${colors.text}" stroke-opacity="0.2" stroke-width="1"/>`;
  }

  return svg;
}

// ===== 棒グラフ =====
function renderBarChart(
  chart: BarChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, direction, bars, maxValue, showValues = true, showGrid = true, unit = '' } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartPadding = 40;
  const chartX = actualX + chartPadding;
  const chartY = actualY + (title ? 30 : 0);
  const chartWidth = width - chartPadding * 2;
  const chartHeight = height - (title ? 30 : 0) - chartPadding;

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  const max = maxValue || Math.max(...bars.map(b => b.value)) * 1.2;
  const barCount = bars.length;

  if (direction === 'vertical') {
    const barWidth = Math.min(60, (chartWidth - 20) / barCount);
    const gap = (chartWidth - barWidth * barCount) / (barCount + 1);

    // グリッド線
    if (showGrid) {
      for (let i = 0; i <= 4; i++) {
        const gridY = chartY + chartHeight - (chartHeight * i / 4);
        svg += `<line x1="${chartX}" y1="${gridY}" x2="${chartX + chartWidth}" y2="${gridY}" stroke="${colors.text}" stroke-opacity="0.1" stroke-width="1"/>`;
        svg += `<text x="${chartX - 5}" y="${gridY + 4}" font-size="10" fill="${colors.text}" opacity="0.6" text-anchor="end">${Math.round(max * i / 4)}${unit}</text>`;
      }
    }

    // バー
    bars.forEach((bar, i) => {
      const barX = chartX + gap + i * (barWidth + gap);
      const barHeight = (bar.value / max) * chartHeight;
      const barY = chartY + chartHeight - barHeight;
      const barColor = bar.color || (bar.highlight ? colors.accent : colors.primary);

      svg += `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${barColor}" rx="2"/>`;

      // ラベル
      svg += `<text x="${barX + barWidth / 2}" y="${chartY + chartHeight + 15}" font-size="11" fill="${colors.text}" text-anchor="middle">${escapeXml(bar.label)}</text>`;

      // 値
      if (showValues) {
        svg += `<text x="${barX + barWidth / 2}" y="${barY - 5}" font-size="11" fill="${colors.text}" text-anchor="middle" font-weight="bold">${bar.value}${unit}</text>`;
      }
    });
  } else {
    // 横向き棒グラフ
    const barHeight = Math.min(40, (chartHeight - 20) / barCount);
    const gap = (chartHeight - barHeight * barCount) / (barCount + 1);

    bars.forEach((bar, i) => {
      const barY = chartY + gap + i * (barHeight + gap);
      const barWidth = (bar.value / max) * chartWidth;
      const barColor = bar.color || (bar.highlight ? colors.accent : colors.primary);

      // ラベル（左側）
      svg += `<text x="${chartX - 5}" y="${barY + barHeight / 2 + 4}" font-size="11" fill="${colors.text}" text-anchor="end">${escapeXml(bar.label)}</text>`;

      svg += `<rect x="${chartX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${barColor}" rx="2"/>`;

      // 値
      if (showValues) {
        svg += `<text x="${chartX + barWidth + 5}" y="${barY + barHeight / 2 + 4}" font-size="11" fill="${colors.text}" font-weight="bold">${bar.value}${unit}</text>`;
      }
    });
  }

  return svg;
}

// ===== 円グラフ =====
function renderPieChart(
  chart: PieChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, segments, showLabels = true, showPercentage = true, donut = false, donutRatio = 0.5 } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const centerX = actualX + width / 2;
  const centerY = actualY + (title ? 30 : 0) + (height - (title ? 30 : 0)) / 2;
  const radius = Math.min(width, height - (title ? 30 : 0)) / 2 - 40;

  // タイトル
  if (title) {
    svg += `<text x="${centerX}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let currentAngle = -Math.PI / 2; // 12時の位置から開始

  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  segments.forEach((segment, i) => {
    const sliceAngle = (segment.value / total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    const segmentColor = segment.color || defaultColors[i % defaultColors.length];

    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    if (donut) {
      const innerRadius = radius * donutRatio;
      const ix1 = centerX + innerRadius * Math.cos(currentAngle);
      const iy1 = centerY + innerRadius * Math.sin(currentAngle);
      const ix2 = centerX + innerRadius * Math.cos(endAngle);
      const iy2 = centerY + innerRadius * Math.sin(endAngle);

      svg += `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z" fill="${segmentColor}" ${segment.highlight ? 'stroke="white" stroke-width="3"' : ''}/>`;
    } else {
      svg += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${segmentColor}" ${segment.highlight ? 'stroke="white" stroke-width="3"' : ''}/>`;
    }

    // ラベル
    if (showLabels) {
      const midAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius + 25;
      const labelX = centerX + labelRadius * Math.cos(midAngle);
      const labelY = centerY + labelRadius * Math.sin(midAngle);
      const percentage = Math.round((segment.value / total) * 100);

      const anchor = Math.cos(midAngle) > 0 ? 'start' : 'end';
      const labelText = showPercentage ? `${segment.label} (${percentage}%)` : segment.label;

      svg += `<text x="${labelX}" y="${labelY}" font-size="11" fill="${colors.text}" text-anchor="${anchor}">${escapeXml(labelText)}</text>`;
    }

    currentAngle = endAngle;
  });

  return svg;
}

// ===== ガントチャート =====
function renderGanttChart(
  chart: GanttChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, timeUnit, tasks, showGrid = true } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const labelWidth = 120;
  const chartX = actualX + labelWidth;
  const chartY = actualY + (title ? 40 : 20);
  const chartWidth = width - labelWidth - 20;
  const chartHeight = height - (title ? 40 : 20) - 20;

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 25}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  // 時間軸ヘッダー
  const timeLabels = timeUnit === 'month' ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] :
                     timeUnit === 'quarter' ? ['Q1', 'Q2', 'Q3', 'Q4'] :
                     timeUnit === 'week' ? ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'] :
                     ['Day1', 'Day2', 'Day3', 'Day4', 'Day5', 'Day6', 'Day7'];

  const colWidth = chartWidth / timeLabels.length;

  // グリッドとヘッダー
  if (showGrid) {
    timeLabels.forEach((label, i) => {
      const colX = chartX + i * colWidth;
      svg += `<rect x="${colX}" y="${chartY}" width="${colWidth}" height="20" fill="${i % 2 === 0 ? colors.primary + '10' : 'transparent'}"/>`;
      svg += `<text x="${colX + colWidth / 2}" y="${chartY + 14}" font-size="10" fill="${colors.text}" text-anchor="middle">${label}</text>`;
      svg += `<line x1="${colX}" y1="${chartY + 20}" x2="${colX}" y2="${chartY + chartHeight}" stroke="${colors.text}" stroke-opacity="0.1"/>`;
    });
  }

  // タスクバー
  const taskHeight = Math.min(30, (chartHeight - 30) / tasks.length);
  const taskGap = 5;

  tasks.forEach((task, i) => {
    const taskY = chartY + 25 + i * (taskHeight + taskGap);
    const barX = chartX + (task.startOffset / 100) * chartWidth;
    const barWidth = (task.duration / 100) * chartWidth;
    const taskColor = task.color || colors.primary;

    // ラベル
    svg += `<text x="${actualX + 5}" y="${taskY + taskHeight / 2 + 4}" font-size="11" fill="${colors.text}">${escapeXml(task.label)}</text>`;

    if (task.milestone) {
      // マイルストーン（ダイヤモンド）
      const mx = barX;
      const my = taskY + taskHeight / 2;
      const size = taskHeight / 2;
      svg += `<polygon points="${mx},${my - size} ${mx + size},${my} ${mx},${my + size} ${mx - size},${my}" fill="${colors.accent}"/>`;
    } else {
      // 通常のバー
      svg += `<rect x="${barX}" y="${taskY}" width="${barWidth}" height="${taskHeight}" fill="${taskColor}" rx="4"/>`;

      // 進捗
      if (task.progress !== undefined && task.progress > 0) {
        const progressWidth = barWidth * (task.progress / 100);
        svg += `<rect x="${barX}" y="${taskY}" width="${progressWidth}" height="${taskHeight}" fill="${taskColor}" rx="4" opacity="0.5"/>`;
        svg += `<rect x="${barX}" y="${taskY + taskHeight - 4}" width="${progressWidth}" height="4" fill="${colors.accent}" rx="2"/>`;
      }
    }
  });

  return svg;
}

// ===== ピラミッド図 =====
function renderPyramidChart(
  chart: PyramidChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, direction = 'up', levels, showLabels = true } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartY = actualY + (title ? 30 : 0);
  const chartHeight = height - (title ? 30 : 0) - 10;
  const centerX = actualX + width / 2;

  // タイトル
  if (title) {
    svg += `<text x="${centerX}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  const levelCount = levels.length;
  const levelHeight = chartHeight / levelCount;
  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981', '#8b5cf6'];

  levels.forEach((level, i) => {
    const levelIndex = direction === 'up' ? i : levelCount - 1 - i;
    const levelY = chartY + levelIndex * levelHeight;

    // ピラミッドの幅を計算（上が狭く、下が広い）
    const topRatio = direction === 'up' ? (levelCount - i) / levelCount : (i + 1) / levelCount;
    const bottomRatio = direction === 'up' ? (levelCount - i - 1) / levelCount : i / levelCount;

    const topWidth = width * 0.8 * topRatio;
    const bottomWidth = width * 0.8 * bottomRatio;

    const topLeft = centerX - topWidth / 2;
    const topRight = centerX + topWidth / 2;
    const bottomLeft = centerX - bottomWidth / 2;
    const bottomRight = centerX + bottomWidth / 2;

    const levelColor = level.color || defaultColors[i % defaultColors.length];

    svg += `<polygon points="${topLeft},${levelY} ${topRight},${levelY} ${bottomRight},${levelY + levelHeight} ${bottomLeft},${levelY + levelHeight}" fill="${levelColor}" stroke="white" stroke-width="2"/>`;

    // ラベル
    if (showLabels) {
      svg += `<text x="${centerX}" y="${levelY + levelHeight / 2 + 5}" font-size="12" fill="white" text-anchor="middle" font-weight="500">${escapeXml(level.label)}</text>`;

      if (level.description) {
        svg += `<text x="${centerX}" y="${levelY + levelHeight / 2 + 20}" font-size="10" fill="white" text-anchor="middle" opacity="0.8">${escapeXml(level.description)}</text>`;
      }
    }
  });

  return svg;
}

// ===== サイクル図 =====
function renderCycleChart(
  chart: CycleChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, centerLabel, nodes, showArrows = true, clockwise = true } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const centerX = actualX + width / 2;
  const centerY = actualY + (title ? 30 : 0) + (height - (title ? 30 : 0)) / 2;
  const radius = Math.min(width, height - (title ? 30 : 0)) / 2 - 60;
  const nodeRadius = 40;

  // タイトル
  if (title) {
    svg += `<text x="${centerX}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  // 中心ラベル
  if (centerLabel) {
    svg += `<circle cx="${centerX}" cy="${centerY}" r="50" fill="${colors.primary}"/>`;
    svg += `<text x="${centerX}" y="${centerY + 5}" font-size="12" fill="white" text-anchor="middle" font-weight="bold">${escapeXml(centerLabel)}</text>`;
  }

  const nodeCount = nodes.length;
  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981', '#8b5cf6', '#f59e0b'];

  // 矢印マーカー定義
  svg = `<defs>
    <marker id="cycle-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="${colors.text}"/>
    </marker>
  </defs>` + svg;

  nodes.forEach((node, i) => {
    const angle = (clockwise ? 1 : -1) * (2 * Math.PI * i / nodeCount) - Math.PI / 2;
    const nodeX = centerX + radius * Math.cos(angle);
    const nodeY = centerY + radius * Math.sin(angle);
    const nodeColor = node.color || defaultColors[i % defaultColors.length];

    // ノード
    svg += `<circle cx="${nodeX}" cy="${nodeY}" r="${nodeRadius}" fill="${nodeColor}"/>`;

    // ラベル
    const labelLines = wrapText(node.label, nodeRadius * 1.6, 11);
    labelLines.forEach((line, lineIdx) => {
      svg += `<text x="${nodeX}" y="${nodeY - (labelLines.length - 1) * 6 + lineIdx * 12 + 4}" font-size="11" fill="white" text-anchor="middle" font-weight="500">${escapeXml(line)}</text>`;
    });

    // 矢印（次のノードへ）
    if (showArrows) {
      const nextAngle = (clockwise ? 1 : -1) * (2 * Math.PI * ((i + 1) % nodeCount) / nodeCount) - Math.PI / 2;

      // 矢印の開始点と終了点を計算（ノードの円周上）
      const arrowStartAngle = angle + (clockwise ? 0.3 : -0.3);
      const arrowEndAngle = nextAngle - (clockwise ? 0.3 : -0.3);

      const startX = centerX + (radius + nodeRadius / 2) * Math.cos(arrowStartAngle);
      const startY = centerY + (radius + nodeRadius / 2) * Math.sin(arrowStartAngle);
      const endX = centerX + (radius + nodeRadius / 2) * Math.cos(arrowEndAngle);
      const endY = centerY + (radius + nodeRadius / 2) * Math.sin(arrowEndAngle);

      // 曲線矢印
      const midAngle = (arrowStartAngle + arrowEndAngle) / 2;
      const ctrlRadius = radius + nodeRadius + 20;
      const ctrlX = centerX + ctrlRadius * Math.cos(midAngle);
      const ctrlY = centerY + ctrlRadius * Math.sin(midAngle);

      svg += `<path d="M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}" fill="none" stroke="${colors.text}" stroke-width="2" stroke-opacity="0.5" marker-end="url(#cycle-arrow)"/>`;
    }
  });

  return svg;
}

// ===== ベン図 =====
function renderVennChart(
  chart: VennChart,
  offsetX: number,
  offsetY: number,
  maxWidth: number,
  maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, circles, intersectionLabel, showLabels = true } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const centerX = actualX + width / 2;
  const centerY = actualY + (title ? 30 : 0) + (height - (title ? 30 : 0)) / 2;
  const baseRadius = Math.min(width, height - (title ? 30 : 0)) / 4;

  // タイトル
  if (title) {
    svg += `<text x="${centerX}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  const defaultColors = [colors.primary, colors.secondary, colors.accent];
  const circleCount = Math.min(circles.length, 3); // 最大3つの円

  // 円の位置を計算
  const positions: { x: number; y: number }[] = [];
  if (circleCount === 2) {
    positions.push({ x: centerX - baseRadius * 0.5, y: centerY });
    positions.push({ x: centerX + baseRadius * 0.5, y: centerY });
  } else if (circleCount === 3) {
    const offset = baseRadius * 0.6;
    positions.push({ x: centerX, y: centerY - offset * 0.7 });
    positions.push({ x: centerX - offset, y: centerY + offset * 0.5 });
    positions.push({ x: centerX + offset, y: centerY + offset * 0.5 });
  } else {
    positions.push({ x: centerX, y: centerY });
  }

  // 円を描画（半透明）
  circles.slice(0, circleCount).forEach((circle, i) => {
    const circleColor = circle.color || defaultColors[i % defaultColors.length];
    const pos = positions[i];

    svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${baseRadius}" fill="${circleColor}" fill-opacity="0.5" stroke="${circleColor}" stroke-width="2"/>`;

    // ラベル
    if (showLabels) {
      // ラベル位置を円の外側に配置
      const labelOffset = baseRadius * 1.2;
      let labelX = pos.x;
      let labelY = pos.y;

      if (circleCount === 2) {
        labelX = i === 0 ? pos.x - labelOffset * 0.5 : pos.x + labelOffset * 0.5;
      } else if (circleCount === 3) {
        if (i === 0) labelY = pos.y - labelOffset * 0.7;
        else if (i === 1) { labelX = pos.x - labelOffset * 0.5; labelY = pos.y + labelOffset * 0.3; }
        else { labelX = pos.x + labelOffset * 0.5; labelY = pos.y + labelOffset * 0.3; }
      }

      svg += `<text x="${labelX}" y="${labelY}" font-size="12" fill="${colors.text}" text-anchor="middle" font-weight="500">${escapeXml(circle.label)}</text>`;

      if (circle.description) {
        svg += `<text x="${labelX}" y="${labelY + 15}" font-size="10" fill="${colors.text}" text-anchor="middle" opacity="0.7">${escapeXml(circle.description)}</text>`;
      }
    }
  });

  // 交差部分のラベル
  if (intersectionLabel) {
    svg += `<text x="${centerX}" y="${centerY + 5}" font-size="11" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(intersectionLabel)}</text>`;
  }

  return svg;
}

// ===== 2x2マトリクス =====
function renderMatrixChart(
  chart: MatrixChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, xAxisLabel, yAxisLabel, quadrants } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartY = actualY + (title ? 35 : 0);
  const chartHeight = height - (title ? 35 : 0);
  const halfW = width / 2;
  const halfH = chartHeight / 2;

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  // 4象限の背景
  const quadrantData = [
    { q: quadrants.topLeft, x: actualX, y: chartY, defaultColor: colors.secondary + '30' },
    { q: quadrants.topRight, x: actualX + halfW, y: chartY, defaultColor: colors.accent + '30' },
    { q: quadrants.bottomLeft, x: actualX, y: chartY + halfH, defaultColor: colors.text + '15' },
    { q: quadrants.bottomRight, x: actualX + halfW, y: chartY + halfH, defaultColor: colors.primary + '30' },
  ];

  quadrantData.forEach(({ q, x: qx, y: qy, defaultColor }) => {
    svg += `<rect x="${qx}" y="${qy}" width="${halfW}" height="${halfH}" fill="${q.color || defaultColor}" stroke="${colors.text}" stroke-opacity="0.1"/>`;
    svg += `<text x="${qx + halfW / 2}" y="${qy + 25}" font-size="11" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(q.label)}</text>`;

    if (q.items) {
      q.items.slice(0, 3).forEach((item, i) => {
        svg += `<text x="${qx + halfW / 2}" y="${qy + 45 + i * 16}" font-size="10" fill="${colors.text}" text-anchor="middle" opacity="0.8">• ${escapeXml(item)}</text>`;
      });
    }
  });

  // 軸ラベル
  if (xAxisLabel) {
    svg += `<text x="${actualX + width / 2}" y="${chartY + chartHeight + 20}" font-size="10" fill="${colors.text}" text-anchor="middle">${escapeXml(xAxisLabel)} →</text>`;
  }
  if (yAxisLabel) {
    svg += `<text x="${actualX - 15}" y="${chartY + chartHeight / 2}" font-size="10" fill="${colors.text}" text-anchor="middle" transform="rotate(-90 ${actualX - 15} ${chartY + chartHeight / 2})">← ${escapeXml(yAxisLabel)}</text>`;
  }

  return svg;
}

// ===== ファネル図 =====
function renderFunnelChart(
  chart: FunnelChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, stages, showValues = true, showPercentage = false } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartY = actualY + (title ? 35 : 0);
  const chartHeight = height - (title ? 35 : 0) - 10;
  const stageCount = stages.length;
  const stageHeight = chartHeight / stageCount;
  const centerX = actualX + width / 2;

  // タイトル
  if (title) {
    svg += `<text x="${centerX}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981', '#8b5cf6'];
  const maxValue = stages[0]?.value || 100;

  stages.forEach((stage, i) => {
    const topWidth = width * 0.9 * (1 - i * 0.15);
    const bottomWidth = width * 0.9 * (1 - (i + 1) * 0.15);
    const stageY = chartY + i * stageHeight;
    const stageColor = stage.color || defaultColors[i % defaultColors.length];

    const topLeft = centerX - topWidth / 2;
    const topRight = centerX + topWidth / 2;
    const bottomLeft = centerX - bottomWidth / 2;
    const bottomRight = centerX + bottomWidth / 2;

    svg += `<polygon points="${topLeft},${stageY} ${topRight},${stageY} ${bottomRight},${stageY + stageHeight} ${bottomLeft},${stageY + stageHeight}" fill="${stageColor}" stroke="white" stroke-width="2"/>`;

    // ラベル
    svg += `<text x="${centerX}" y="${stageY + stageHeight / 2 + 5}" font-size="12" fill="white" text-anchor="middle" font-weight="500">${escapeXml(stage.label)}</text>`;

    // 値/パーセント
    if (showValues && stage.value !== undefined) {
      const displayText = showPercentage ? `${Math.round((stage.value / maxValue) * 100)}%` : `${stage.value}`;
      svg += `<text x="${centerX + topWidth / 2 + 15}" y="${stageY + stageHeight / 2 + 5}" font-size="11" fill="${colors.text}" font-weight="bold">${displayText}</text>`;
    }
  });

  return svg;
}

// ===== 折れ線グラフ =====
function renderLineChart(
  chart: LineChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, xLabels, lines, showGrid = true, showLegend = true, unit = '' } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartPadding = 50;
  const chartX = actualX + chartPadding;
  const chartY = actualY + (title ? 35 : 0);
  const chartWidth = width - chartPadding * 2;
  const chartHeight = height - (title ? 35 : 0) - chartPadding - (showLegend ? 30 : 0);

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  // 最大値を計算
  const allValues = lines.flatMap(line => line.values);
  const maxValue = Math.max(...allValues) * 1.2;

  // グリッド線
  if (showGrid) {
    for (let i = 0; i <= 4; i++) {
      const gridY = chartY + chartHeight - (chartHeight * i / 4);
      svg += `<line x1="${chartX}" y1="${gridY}" x2="${chartX + chartWidth}" y2="${gridY}" stroke="${colors.text}" stroke-opacity="0.1"/>`;
      svg += `<text x="${chartX - 5}" y="${gridY + 4}" font-size="10" fill="${colors.text}" opacity="0.6" text-anchor="end">${Math.round(maxValue * i / 4)}${unit}</text>`;
    }
  }

  // X軸ラベル
  const xStep = chartWidth / (xLabels.length - 1 || 1);
  xLabels.forEach((label, i) => {
    const labelX = chartX + i * xStep;
    svg += `<text x="${labelX}" y="${chartY + chartHeight + 15}" font-size="10" fill="${colors.text}" text-anchor="middle">${escapeXml(label)}</text>`;
  });

  // 線を描画
  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981'];
  lines.forEach((line, lineIdx) => {
    const lineColor = line.color || defaultColors[lineIdx % defaultColors.length];
    const points = line.values.map((val, i) => {
      const px = chartX + i * xStep;
      const py = chartY + chartHeight - (val / maxValue) * chartHeight;
      return `${px},${py}`;
    }).join(' ');

    svg += `<polyline points="${points}" fill="none" stroke="${lineColor}" stroke-width="2" ${line.dashed ? 'stroke-dasharray="5,5"' : ''}/>`;

    // ポイント
    line.values.forEach((val, i) => {
      const px = chartX + i * xStep;
      const py = chartY + chartHeight - (val / maxValue) * chartHeight;
      svg += `<circle cx="${px}" cy="${py}" r="4" fill="${lineColor}"/>`;
    });
  });

  // 凡例
  if (showLegend && lines.length > 1) {
    const legendY = chartY + chartHeight + 35;
    lines.forEach((line, i) => {
      const legendX = actualX + 50 + i * 100;
      const lineColor = line.color || defaultColors[i % defaultColors.length];
      svg += `<line x1="${legendX}" y1="${legendY}" x2="${legendX + 20}" y2="${legendY}" stroke="${lineColor}" stroke-width="2"/>`;
      svg += `<text x="${legendX + 25}" y="${legendY + 4}" font-size="10" fill="${colors.text}">${escapeXml(line.label)}</text>`;
    });
  }

  return svg;
}

// ===== レーダーチャート =====
function renderRadarChart(
  chart: RadarChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, axes, series, showLegend = true, maxValue = 100 } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const centerX = actualX + width / 2;
  const centerY = actualY + (title ? 35 : 0) + (height - (title ? 35 : 0) - (showLegend ? 30 : 0)) / 2;
  const radius = Math.min(width, height - (title ? 35 : 0) - (showLegend ? 30 : 0)) / 2 - 40;
  const axisCount = axes.length;
  const angleStep = (2 * Math.PI) / axisCount;

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  // グリッド（同心円）
  for (let level = 1; level <= 4; level++) {
    const levelRadius = radius * level / 4;
    const points = axes.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${centerX + levelRadius * Math.cos(angle)},${centerY + levelRadius * Math.sin(angle)}`;
    }).join(' ');
    svg += `<polygon points="${points}" fill="none" stroke="${colors.text}" stroke-opacity="0.1"/>`;
  }

  // 軸線とラベル
  axes.forEach((axis, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const endX = centerX + radius * Math.cos(angle);
    const endY = centerY + radius * Math.sin(angle);
    svg += `<line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="${colors.text}" stroke-opacity="0.2"/>`;

    const labelX = centerX + (radius + 15) * Math.cos(angle);
    const labelY = centerY + (radius + 15) * Math.sin(angle);
    svg += `<text x="${labelX}" y="${labelY + 4}" font-size="10" fill="${colors.text}" text-anchor="middle">${escapeXml(axis)}</text>`;
  });

  // シリーズを描画
  const defaultColors = [colors.primary, colors.secondary, colors.accent];
  series.forEach((s, sIdx) => {
    const seriesColor = s.color || defaultColors[sIdx % defaultColors.length];
    const points = s.values.map((val, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (val / maxValue) * radius;
      return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    }).join(' ');

    svg += `<polygon points="${points}" fill="${seriesColor}" fill-opacity="0.3" stroke="${seriesColor}" stroke-width="2"/>`;
  });

  // 凡例
  if (showLegend && series.length > 1) {
    const legendY = actualY + height - 15;
    series.forEach((s, i) => {
      const legendX = actualX + 50 + i * 100;
      const seriesColor = s.color || defaultColors[i % defaultColors.length];
      svg += `<rect x="${legendX}" y="${legendY - 8}" width="16" height="8" fill="${seriesColor}" fill-opacity="0.5"/>`;
      svg += `<text x="${legendX + 20}" y="${legendY}" font-size="10" fill="${colors.text}">${escapeXml(s.label)}</text>`;
    });
  }

  return svg;
}

// ===== 収束図 =====
function renderConvergenceChart(
  chart: ConvergenceChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, inputs, output } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartY = actualY + (title ? 35 : 0);
  const chartHeight = height - (title ? 35 : 0);
  const inputWidth = width * 0.3;
  const outputWidth = width * 0.35;
  const outputX = actualX + width - outputWidth;

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  // 入力ノード
  const inputCount = inputs.length;
  const inputHeight = Math.min(50, (chartHeight - 20) / inputCount);
  const inputGap = (chartHeight - inputHeight * inputCount) / (inputCount + 1);
  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981'];

  inputs.forEach((input, i) => {
    const inputY = chartY + inputGap + i * (inputHeight + inputGap);
    const inputColor = input.color || defaultColors[i % defaultColors.length];

    svg += `<rect x="${actualX}" y="${inputY}" width="${inputWidth}" height="${inputHeight}" fill="${inputColor}" rx="6"/>`;
    svg += `<text x="${actualX + inputWidth / 2}" y="${inputY + inputHeight / 2 + 5}" font-size="11" fill="white" text-anchor="middle" font-weight="500">${escapeXml(input.label)}</text>`;

    // 矢印線
    const arrowStartX = actualX + inputWidth;
    const arrowEndX = outputX;
    const outputCenterY = chartY + chartHeight / 2;
    svg += `<path d="M ${arrowStartX} ${inputY + inputHeight / 2} Q ${actualX + width / 2} ${inputY + inputHeight / 2} ${arrowEndX} ${outputCenterY}" fill="none" stroke="${colors.text}" stroke-opacity="0.3" stroke-width="2" marker-end="url(#arrow-conv)"/>`;
  });

  // 出力ノード
  const outputColor = output.color || colors.accent;
  svg += `<rect x="${outputX}" y="${chartY + chartHeight / 2 - 40}" width="${outputWidth}" height="80" fill="${outputColor}" rx="8"/>`;
  svg += `<text x="${outputX + outputWidth / 2}" y="${chartY + chartHeight / 2 + 5}" font-size="13" fill="white" text-anchor="middle" font-weight="bold">${escapeXml(output.label)}</text>`;

  // 矢印マーカー
  svg = `<defs><marker id="arrow-conv" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${colors.text}" opacity="0.3"/></marker></defs>` + svg;

  return svg;
}

// ===== 発散図 =====
function renderDivergenceChart(
  chart: DivergenceChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, input, outputs } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartY = actualY + (title ? 35 : 0);
  const chartHeight = height - (title ? 35 : 0);
  const inputWidth = width * 0.35;
  const outputWidth = width * 0.3;
  const outputX = actualX + width - outputWidth;

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  // 入力ノード
  const inputColor = input.color || colors.primary;
  svg += `<rect x="${actualX}" y="${chartY + chartHeight / 2 - 40}" width="${inputWidth}" height="80" fill="${inputColor}" rx="8"/>`;
  svg += `<text x="${actualX + inputWidth / 2}" y="${chartY + chartHeight / 2 + 5}" font-size="13" fill="white" text-anchor="middle" font-weight="bold">${escapeXml(input.label)}</text>`;

  // 出力ノード
  const outputCount = outputs.length;
  const outputHeight = Math.min(50, (chartHeight - 20) / outputCount);
  const outputGap = (chartHeight - outputHeight * outputCount) / (outputCount + 1);
  const defaultColors = [colors.secondary, colors.accent, '#10b981', '#8b5cf6'];

  outputs.forEach((output, i) => {
    const outY = chartY + outputGap + i * (outputHeight + outputGap);
    const outColor = output.color || defaultColors[i % defaultColors.length];

    svg += `<rect x="${outputX}" y="${outY}" width="${outputWidth}" height="${outputHeight}" fill="${outColor}" rx="6"/>`;
    svg += `<text x="${outputX + outputWidth / 2}" y="${outY + outputHeight / 2 + 5}" font-size="11" fill="white" text-anchor="middle" font-weight="500">${escapeXml(output.label)}</text>`;

    // 矢印線
    const arrowStartX = actualX + inputWidth;
    const inputCenterY = chartY + chartHeight / 2;
    svg += `<path d="M ${arrowStartX} ${inputCenterY} Q ${actualX + width / 2} ${outY + outputHeight / 2} ${outputX} ${outY + outputHeight / 2}" fill="none" stroke="${colors.text}" stroke-opacity="0.3" stroke-width="2" marker-end="url(#arrow-div)"/>`;
  });

  // 矢印マーカー
  svg = `<defs><marker id="arrow-div" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${colors.text}" opacity="0.3"/></marker></defs>` + svg;

  return svg;
}

// ===== アイコングリッド =====
function renderIconGridChart(
  chart: IconGridChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, items, columns = 3 } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartY = actualY + (title ? 35 : 0);
  const chartHeight = height - (title ? 35 : 0);
  const rows = Math.ceil(items.length / columns);
  const cellWidth = width / columns;
  const cellHeight = chartHeight / rows;

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981', '#8b5cf6', '#f59e0b'];

  items.forEach((item, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const cellX = actualX + col * cellWidth;
    const cellY = chartY + row * cellHeight;
    const itemColor = item.color || defaultColors[i % defaultColors.length];

    // アイコン背景
    svg += `<circle cx="${cellX + cellWidth / 2}" cy="${cellY + 30}" r="25" fill="${itemColor}" fill-opacity="0.15"/>`;

    // アイコン
    svg += `<text x="${cellX + cellWidth / 2}" y="${cellY + 38}" font-size="24" text-anchor="middle">${item.icon}</text>`;

    // ラベル
    svg += `<text x="${cellX + cellWidth / 2}" y="${cellY + 70}" font-size="12" fill="${colors.text}" text-anchor="middle" font-weight="500">${escapeXml(item.label)}</text>`;

    // 説明
    if (item.description) {
      const descLines = wrapText(item.description, cellWidth - 20, 10);
      descLines.slice(0, 2).forEach((line, lineIdx) => {
        svg += `<text x="${cellX + cellWidth / 2}" y="${cellY + 85 + lineIdx * 12}" font-size="10" fill="${colors.text}" text-anchor="middle" opacity="0.7">${escapeXml(line)}</text>`;
      });
    }
  });

  return svg;
}

// ===== 積み上げ棒グラフ =====
function renderStackedBarChart(
  chart: StackedBarChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, categories, series, showLegend = true, showValues = false, unit = '' } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartPadding = 50;
  const chartX = actualX + chartPadding;
  const chartY = actualY + (title ? 35 : 0);
  const chartWidth = width - chartPadding * 2;
  const chartHeight = height - (title ? 35 : 0) - chartPadding - (showLegend ? 30 : 0);

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  // 最大値を計算
  const maxTotal = Math.max(...categories.map((_, catIdx) =>
    series.reduce((sum, s) => sum + (s.values[catIdx] || 0), 0)
  )) * 1.1;

  const barWidth = Math.min(60, (chartWidth - 20) / categories.length);
  const gap = (chartWidth - barWidth * categories.length) / (categories.length + 1);
  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981', '#8b5cf6'];

  categories.forEach((cat, catIdx) => {
    const barX = chartX + gap + catIdx * (barWidth + gap);
    let currentY = chartY + chartHeight;

    series.forEach((s, sIdx) => {
      const value = s.values[catIdx] || 0;
      const barHeight = (value / maxTotal) * chartHeight;
      currentY -= barHeight;
      const seriesColor = s.color || defaultColors[sIdx % defaultColors.length];

      svg += `<rect x="${barX}" y="${currentY}" width="${barWidth}" height="${barHeight}" fill="${seriesColor}"/>`;

      if (showValues && barHeight > 15) {
        svg += `<text x="${barX + barWidth / 2}" y="${currentY + barHeight / 2 + 4}" font-size="9" fill="white" text-anchor="middle">${value}${unit}</text>`;
      }
    });

    // カテゴリラベル
    svg += `<text x="${barX + barWidth / 2}" y="${chartY + chartHeight + 15}" font-size="10" fill="${colors.text}" text-anchor="middle">${escapeXml(cat)}</text>`;
  });

  // 凡例
  if (showLegend) {
    const legendY = actualY + height - 15;
    series.forEach((s, i) => {
      const legendX = actualX + 50 + i * 80;
      const seriesColor = s.color || defaultColors[i % defaultColors.length];
      svg += `<rect x="${legendX}" y="${legendY - 8}" width="12" height="8" fill="${seriesColor}"/>`;
      svg += `<text x="${legendX + 16}" y="${legendY}" font-size="10" fill="${colors.text}">${escapeXml(s.label)}</text>`;
    });
  }

  return svg;
}

// ===== ロードマップ =====
function renderRoadmapChart(
  chart: RoadmapChart,
  offsetX: number,
  offsetY: number,
  _maxWidth: number,
  _maxHeight: number,
  colors: ColorScheme
): string {
  let svg = '';
  const { x, y, width, height, title, phases, showConnectors = true } = chart;
  const actualX = x + offsetX;
  const actualY = y + offsetY;

  const chartY = actualY + (title ? 35 : 0);
  const chartHeight = height - (title ? 35 : 0) - 10;
  const phaseCount = phases.length;
  const phaseWidth = (width - 40) / phaseCount;

  // タイトル
  if (title) {
    svg += `<text x="${actualX + width / 2}" y="${actualY + 20}" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="bold">${escapeXml(title)}</text>`;
  }

  const defaultColors = [colors.primary, colors.secondary, colors.accent, '#10b981'];

  // 矢印マーカー
  if (showConnectors) {
    svg = `<defs><marker id="arrow-road" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${colors.text}" opacity="0.4"/></marker></defs>` + svg;
  }

  phases.forEach((phase, i) => {
    const phaseX = actualX + 20 + i * phaseWidth;
    const phaseColor = phase.color || defaultColors[i % defaultColors.length];

    // フェーズヘッダー
    svg += `<rect x="${phaseX}" y="${chartY}" width="${phaseWidth - 10}" height="50" fill="${phaseColor}" rx="6"/>`;
    svg += `<text x="${phaseX + (phaseWidth - 10) / 2}" y="${chartY + 22}" font-size="12" fill="white" text-anchor="middle" font-weight="bold">${escapeXml(phase.label)}</text>`;
    svg += `<text x="${phaseX + (phaseWidth - 10) / 2}" y="${chartY + 40}" font-size="10" fill="white" text-anchor="middle" opacity="0.8">${escapeXml(phase.period)}</text>`;

    // アイテム
    phase.items.slice(0, 4).forEach((item, itemIdx) => {
      const itemY = chartY + 60 + itemIdx * 25;
      svg += `<text x="${phaseX + 10}" y="${itemY + 15}" font-size="11" fill="${colors.text}">• ${escapeXml(item)}</text>`;
    });

    // コネクタ矢印
    if (showConnectors && i < phaseCount - 1) {
      svg += `<line x1="${phaseX + phaseWidth - 15}" y1="${chartY + 25}" x2="${phaseX + phaseWidth + 5}" y2="${chartY + 25}" stroke="${colors.text}" stroke-opacity="0.4" stroke-width="2" marker-end="url(#arrow-road)"/>`;
    }
  });

  return svg;
}

// ===== エクスポート =====
export { SLIDE_WIDTH, SLIDE_HEIGHT };
