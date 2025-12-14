/**
 * ビジュアルパターンの簡易プレビューコンポーネント
 * 各レイアウトパターンがどのような見た目になるかを小さなSVGアイコンで表現
 */

import type { VisualHintType } from '@/types';

type Props = {
  pattern: VisualHintType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
};

// パターンの日本語名
const patternLabels: Record<VisualHintType, string> = {
  'process-flow': 'プロセスフロー',
  'hierarchy': '階層構造',
  'pyramid': 'ピラミッド',
  'tree': 'ツリー構造',
  'cycle': 'サイクル図',
  'convergence': '収束図',
  'divergence': '発散図',
  'funnel': 'ファネル図',
  'swimlane': 'スイムレーン',
  'comparison': '比較表',
  'matrix': '2x2マトリクス',
  'positioning-map': 'ポジショニングマップ',
  'gap-analysis': 'ギャップ分析',
  'swot': 'SWOT分析',
  'timeline': 'タイムライン',
  'gantt': 'ガントチャート',
  'roadmap': 'ロードマップ',
  'milestone': 'マイルストーン',
  'bar-chart': '棒グラフ',
  'stacked-bar': '積み上げ棒グラフ',
  'pie-chart': '円グラフ',
  'line-chart': '折れ線グラフ',
  'waterfall': 'ウォーターフォール',
  'radar': 'レーダーチャート',
  'bridge': 'ブリッジチャート',
  'kpi-dashboard': 'KPIダッシュボード',
  'cause-effect': '因果関係図',
  'value-chain': 'バリューチェーン',
  'venn': 'ベン図',
  'stakeholder-map': 'ステークホルダー',
  'org-chart': '組織図',
  'bullets-with-visual': '箇条書き+ビジュアル',
  'icon-grid': 'アイコングリッド',
  'bullets-only': '箇条書き',
  // 複合レイアウト系
  'before-after-diagram': 'ビフォーアフター図解',
  'concept-explanation': '概念+説明',
  'flow-with-message': 'フロー+メッセージ',
  'chart-with-insight': 'グラフ+示唆',
  'problem-solution': '問題→解決策',
  'framework-application': 'フレームワーク適用',
  'summary-detail': 'サマリー+詳細',
  'multi-column-options': '複数オプション比較',
  'timeline-with-details': 'タイムライン+詳細',
  'action-plan': 'アクションプラン',
  'impact-analysis': 'インパクト分析',
  // 戦略フレームワーク系
  'closed-loop-ecosystem': '循環エコシステム',
  'strategic-temple': '戦略の神殿',
  'hub-spoke-detailed': 'ハブ＆スポーク',
};

// サイズ設定
const sizeConfig = {
  sm: { width: 48, height: 36, strokeWidth: 1.5, fontSize: 8 },
  md: { width: 80, height: 60, strokeWidth: 2, fontSize: 10 },
  lg: { width: 120, height: 90, strokeWidth: 2.5, fontSize: 12 },
};

export function VisualPatternPreview({ pattern, size = 'md', showLabel = true, className = '' }: Props) {
  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg
        width={config.width}
        height={config.height}
        viewBox="0 0 80 60"
        className="bg-gray-50 rounded border border-gray-200"
      >
        {renderPattern(pattern, config.strokeWidth)}
      </svg>
      {showLabel && (
        <span className="text-xs text-gray-600 text-center" style={{ fontSize: config.fontSize }}>
          {patternLabels[pattern]}
        </span>
      )}
    </div>
  );
}

// パターン別のSVG描画
function renderPattern(pattern: VisualHintType, strokeWidth: number) {
  const stroke = '#1e3a8a';
  const fill = '#3b82f6';
  const lightFill = '#dbeafe';
  const accent = '#f59e0b';

  switch (pattern) {
    case 'process-flow':
      return (
        <g>
          <rect x="5" y="22" width="16" height="16" rx="2" fill={fill} />
          <rect x="32" y="22" width="16" height="16" rx="2" fill={fill} />
          <rect x="59" y="22" width="16" height="16" rx="2" fill={fill} />
          <path d="M21 30 L32 30" stroke={stroke} strokeWidth={strokeWidth} markerEnd="url(#arrow)" />
          <path d="M48 30 L59 30" stroke={stroke} strokeWidth={strokeWidth} markerEnd="url(#arrow)" />
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
            </marker>
          </defs>
        </g>
      );

    case 'hierarchy':
      return (
        <g>
          <rect x="30" y="5" width="20" height="12" rx="2" fill={fill} />
          <rect x="10" y="25" width="18" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="31" y="25" width="18" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="52" y="25" width="18" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="17" x2="40" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="19" y1="22" x2="61" y2="22" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="19" y1="22" x2="19" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="22" x2="40" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="61" y1="22" x2="61" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'pyramid':
      return (
        <g>
          <polygon points="40,5 70,55 10,55" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="20" y1="35" x2="60" y2="35" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="28" y1="45" x2="52" y2="45" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="40" cy="18" r="3" fill={fill} />
          <circle cx="40" cy="40" r="3" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="30" cy="50" r="3" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="50" cy="50" r="3" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'tree':
      return (
        <g>
          <rect x="32" y="5" width="16" height="10" rx="2" fill={fill} />
          <rect x="10" y="25" width="14" height="8" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="33" y="25" width="14" height="8" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="56" y="25" width="14" height="8" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="5" y="43" width="10" height="6" rx="1" fill="#e5e7eb" />
          <rect x="18" y="43" width="10" height="6" rx="1" fill="#e5e7eb" />
          <rect x="52" y="43" width="10" height="6" rx="1" fill="#e5e7eb" />
          <rect x="65" y="43" width="10" height="6" rx="1" fill="#e5e7eb" />
          <line x1="40" y1="15" x2="40" y2="20" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="17" y1="20" x2="63" y2="20" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="17" y1="20" x2="17" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="20" x2="40" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="63" y1="20" x2="63" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="17" y1="33" x2="17" y2="38" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="10" y1="38" x2="23" y2="38" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="10" y1="38" x2="10" y2="43" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="23" y1="38" x2="23" y2="43" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="63" y1="33" x2="63" y2="38" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="57" y1="38" x2="70" y2="38" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="57" y1="38" x2="57" y2="43" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="70" y1="38" x2="70" y2="43" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'cycle':
      return (
        <g>
          <circle cx="40" cy="30" r="22" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="4 2" />
          <circle cx="40" cy="8" r="6" fill={fill} />
          <circle cx="60" cy="25" r="6" fill={fill} />
          <circle cx="52" cy="48" r="6" fill={fill} />
          <circle cx="28" cy="48" r="6" fill={fill} />
          <circle cx="20" cy="25" r="6" fill={fill} />
          <path d="M45 10 L52 20" stroke={accent} strokeWidth={strokeWidth} markerEnd="url(#arrow-accent)" />
          <defs>
            <marker id="arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
            </marker>
          </defs>
        </g>
      );

    case 'convergence':
      return (
        <g>
          <rect x="5" y="8" width="14" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="5" y="25" width="14" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="5" y="42" width="14" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="55" y="22" width="20" height="16" rx="2" fill={fill} />
          <path d="M19 13 L55 28" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <path d="M19 30 L55 30" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <path d="M19 47 L55 32" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'divergence':
      return (
        <g>
          <rect x="5" y="22" width="20" height="16" rx="2" fill={fill} />
          <rect x="61" y="8" width="14" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="61" y="25" width="14" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="61" y="42" width="14" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <path d="M25 28 L61 13" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <path d="M25 30 L61 30" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <path d="M25 32 L61 47" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'funnel':
      return (
        <g>
          <path d="M10 10 L70 10 L58 22 L22 22 Z" fill={fill} />
          <path d="M22 24 L58 24 L50 36 L30 36 Z" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <path d="M30 38 L50 38 L45 50 L35 50 Z" fill="#e5e7eb" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'swimlane':
      return (
        <g>
          <rect x="5" y="5" width="70" height="50" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="5" y1="22" x2="75" y2="22" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="5" y1="38" x2="75" y2="38" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="20" y="9" width="12" height="8" rx="1" fill={fill} />
          <rect x="38" y="9" width="12" height="8" rx="1" fill={fill} />
          <rect x="28" y="26" width="12" height="8" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="48" y="26" width="12" height="8" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="35" y="42" width="12" height="8" rx="1" fill="#e5e7eb" />
        </g>
      );

    case 'comparison':
      return (
        <g>
          <rect x="5" y="5" width="70" height="50" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="40" y1="5" x2="40" y2="55" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="5" y1="18" x2="75" y2="18" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="22" y="14" fontSize="8" fill={stroke} textAnchor="middle">Before</text>
          <text x="57" y="14" fontSize="8" fill={stroke} textAnchor="middle">After</text>
          <rect x="10" y="24" width="24" height="6" rx="1" fill={lightFill} />
          <rect x="10" y="34" width="24" height="6" rx="1" fill={lightFill} />
          <rect x="10" y="44" width="24" height="6" rx="1" fill={lightFill} />
          <rect x="46" y="24" width="24" height="6" rx="1" fill={fill} />
          <rect x="46" y="34" width="24" height="6" rx="1" fill={fill} />
          <rect x="46" y="44" width="24" height="6" rx="1" fill={fill} />
        </g>
      );

    case 'matrix':
      return (
        <g>
          <rect x="5" y="5" width="70" height="50" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="40" y1="5" x2="40" y2="55" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="5" y1="30" x2="75" y2="30" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="22" cy="17" r="8" fill={fill} />
          <circle cx="57" cy="17" r="8" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="22" cy="42" r="8" fill="#e5e7eb" />
          <circle cx="57" cy="42" r="8" fill={accent} />
        </g>
      );

    case 'positioning-map':
      return (
        <g>
          <line x1="5" y1="30" x2="75" y2="30" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="40" y1="5" x2="40" y2="55" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="25" cy="15" r="5" fill={fill} />
          <circle cx="55" cy="20" r="7" fill={accent} />
          <circle cx="30" cy="42" r="4" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="60" cy="45" r="6" fill="#e5e7eb" />
          <polygon points="73 30, 75 27, 75 33" fill={stroke} />
          <polygon points="40 5, 37 7, 43 7" fill={stroke} />
        </g>
      );

    case 'gap-analysis':
      return (
        <g>
          <rect x="10" y="10" width="25" height="40" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="45" y="10" width="25" height="40" rx="2" fill={fill} />
          <path d="M35 30 L45 30" stroke={accent} strokeWidth={strokeWidth} strokeDasharray="3 2" />
          <text x="22" y="52" fontSize="7" fill={stroke} textAnchor="middle">現状</text>
          <text x="57" y="52" fontSize="7" fill="white" textAnchor="middle">目標</text>
          <rect x="12" y="35" width="21" height="12" fill={accent} opacity="0.7" />
          <text x="22" y="43" fontSize="6" fill="white" textAnchor="middle">GAP</text>
        </g>
      );

    case 'swot':
      return (
        <g>
          <rect x="5" y="5" width="35" height="24" rx="2" fill={fill} />
          <rect x="40" y="5" width="35" height="24" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="5" y="31" width="35" height="24" rx="2" fill={accent} />
          <rect x="40" y="31" width="35" height="24" rx="2" fill="#e5e7eb" />
          <text x="22" y="19" fontSize="7" fill="white" textAnchor="middle">S</text>
          <text x="57" y="19" fontSize="7" fill={stroke} textAnchor="middle">W</text>
          <text x="22" y="45" fontSize="7" fill="white" textAnchor="middle">O</text>
          <text x="57" y="45" fontSize="7" fill={stroke} textAnchor="middle">T</text>
        </g>
      );

    case 'timeline':
      return (
        <g>
          <line x1="10" y1="30" x2="70" y2="30" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="20" cy="30" r="4" fill={fill} />
          <circle cx="40" cy="30" r="4" fill={fill} />
          <circle cx="60" cy="30" r="4" fill={fill} />
          <rect x="13" y="38" width="14" height="12" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="33" y="10" width="14" height="12" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="53" y="38" width="14" height="12" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'gantt':
      return (
        <g>
          <rect x="5" y="5" width="70" height="50" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="25" y1="5" x2="25" y2="55" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="27" y="10" width="20" height="8" rx="1" fill={fill} />
          <rect x="35" y="22" width="25" height="8" rx="1" fill={fill} />
          <rect x="45" y="34" width="18" height="8" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="55" y="46" width="15" height="6" rx="1" fill="#e5e7eb" />
        </g>
      );

    case 'roadmap':
      return (
        <g>
          <rect x="5" y="5" width="22" height="50" rx="2" fill={fill} />
          <rect x="29" y="5" width="22" height="50" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="53" y="5" width="22" height="50" rx="2" fill="#e5e7eb" />
          <text x="16" y="30" fontSize="7" fill="white" textAnchor="middle">Phase1</text>
          <text x="40" y="30" fontSize="7" fill={stroke} textAnchor="middle">Phase2</text>
          <text x="64" y="30" fontSize="7" fill={stroke} textAnchor="middle">Phase3</text>
          <path d="M27 30 L29 30" stroke={accent} strokeWidth={strokeWidth} />
          <path d="M51 30 L53 30" stroke={accent} strokeWidth={strokeWidth} />
        </g>
      );

    case 'milestone':
      return (
        <g>
          <line x1="10" y1="30" x2="70" y2="30" stroke={stroke} strokeWidth={strokeWidth} />
          <polygon points="20,22 26,30 20,38 14,30" fill={fill} />
          <polygon points="45,22 51,30 45,38 39,30" fill={accent} />
          <polygon points="65,22 71,30 65,38 59,30" fill={fill} />
          <text x="20" y="48" fontSize="6" fill={stroke} textAnchor="middle">MS1</text>
          <text x="45" y="48" fontSize="6" fill={stroke} textAnchor="middle">MS2</text>
          <text x="65" y="48" fontSize="6" fill={stroke} textAnchor="middle">MS3</text>
        </g>
      );

    case 'bar-chart':
      return (
        <g>
          <line x1="15" y1="5" x2="15" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="15" y1="50" x2="75" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="20" y="20" width="12" height="30" fill={fill} />
          <rect x="38" y="30" width="12" height="20" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="56" y="15" width="12" height="35" fill={accent} />
        </g>
      );

    case 'stacked-bar':
      return (
        <g>
          <line x1="15" y1="5" x2="15" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="15" y1="50" x2="75" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="20" y="35" width="12" height="15" fill={fill} />
          <rect x="20" y="20" width="12" height="15" fill={lightFill} />
          <rect x="20" y="10" width="12" height="10" fill="#e5e7eb" />
          <rect x="38" y="30" width="12" height="20" fill={fill} />
          <rect x="38" y="18" width="12" height="12" fill={lightFill} />
          <rect x="56" y="25" width="12" height="25" fill={fill} />
          <rect x="56" y="12" width="12" height="13" fill={lightFill} />
          <rect x="56" y="5" width="12" height="7" fill="#e5e7eb" />
        </g>
      );

    case 'pie-chart':
      return (
        <g>
          <circle cx="40" cy="30" r="22" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M40 30 L40 8 A22 22 0 0 1 62 30 Z" fill={fill} />
          <path d="M40 30 L62 30 A22 22 0 0 1 40 52 Z" fill={accent} />
        </g>
      );

    case 'line-chart':
      return (
        <g>
          <line x1="10" y1="5" x2="10" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="10" y1="50" x2="75" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
          <polyline points="15,40 30,25 45,35 60,15 70,20" fill="none" stroke={fill} strokeWidth={strokeWidth} />
          <polyline points="15,45 30,38 45,42 60,30 70,32" fill="none" stroke={accent} strokeWidth={strokeWidth} strokeDasharray="3 2" />
          <circle cx="15" cy="40" r="3" fill={fill} />
          <circle cx="30" cy="25" r="3" fill={fill} />
          <circle cx="45" cy="35" r="3" fill={fill} />
          <circle cx="60" cy="15" r="3" fill={fill} />
          <circle cx="70" cy="20" r="3" fill={fill} />
        </g>
      );

    case 'waterfall':
      return (
        <g>
          <line x1="10" y1="50" x2="75" y2="50" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="12" y="25" width="10" height="25" fill={fill} />
          <rect x="24" y="20" width="10" height="5" fill={accent} />
          <line x1="22" y1="25" x2="36" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} strokeDasharray="2 1" />
          <rect x="36" y="15" width="10" height="5" fill={accent} />
          <line x1="34" y1="20" x2="48" y2="20" stroke={stroke} strokeWidth={strokeWidth * 0.5} strokeDasharray="2 1" />
          <rect x="48" y="20" width="10" height="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="46" y1="15" x2="60" y2="15" stroke={stroke} strokeWidth={strokeWidth * 0.5} strokeDasharray="2 1" />
          <rect x="60" y="15" width="10" height="35" fill={fill} />
        </g>
      );

    case 'radar':
      return (
        <g>
          <polygon points="40,8 62,22 55,48 25,48 18,22" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <polygon points="40,18 52,26 48,42 32,42 28,26" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <polygon points="40,28 45,32 43,38 37,38 35,32" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <polygon points="40,12 58,24 50,46 30,46 22,24" fill={fill} opacity="0.5" />
          <polygon points="40,18 50,28 45,40 35,40 30,28" fill={accent} opacity="0.5" />
          <line x1="40" y1="30" x2="40" y2="8" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="30" x2="62" y2="22" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="30" x2="55" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="30" x2="25" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="30" x2="18" y2="22" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'bridge':
      return (
        <g>
          <rect x="8" y="25" width="12" height="25" fill={fill} />
          <rect x="22" y="20" width="8" height="5" fill={accent} />
          <rect x="32" y="15" width="8" height="5" fill={accent} />
          <rect x="42" y="20" width="8" height="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="52" y="25" width="8" height="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="62" y="25" width="12" height="25" fill={fill} />
          <line x1="20" y1="25" x2="62" y2="25" stroke={stroke} strokeWidth={strokeWidth * 0.5} strokeDasharray="2 1" />
        </g>
      );

    case 'kpi-dashboard':
      return (
        <g>
          <rect x="5" y="5" width="22" height="22" rx="2" fill={fill} />
          <rect x="29" y="5" width="22" height="22" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="53" y="5" width="22" height="22" rx="2" fill={accent} />
          <rect x="5" y="33" width="70" height="22" rx="2" fill="#e5e7eb" />
          <text x="16" y="18" fontSize="8" fill="white" textAnchor="middle">85%</text>
          <text x="40" y="18" fontSize="8" fill={stroke} textAnchor="middle">120</text>
          <text x="64" y="18" fontSize="8" fill="white" textAnchor="middle">+15</text>
          <rect x="10" y="40" width="50" height="8" rx="1" fill={fill} />
        </g>
      );

    case 'cause-effect':
      return (
        <g>
          <rect x="5" y="20" width="18" height="20" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="57" y="20" width="18" height="20" rx="2" fill={fill} />
          <path d="M23 30 L57 30" stroke={stroke} strokeWidth={strokeWidth} markerEnd="url(#arrow)" />
          <text x="14" y="32" fontSize="6" fill={stroke} textAnchor="middle">原因</text>
          <text x="66" y="32" fontSize="6" fill="white" textAnchor="middle">結果</text>
        </g>
      );

    case 'value-chain':
      return (
        <g>
          <polygon points="5,20 25,20 30,30 25,40 5,40" fill={fill} />
          <polygon points="30,20 50,20 55,30 50,40 30,40" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <polygon points="55,20 75,20 75,40 55,40" fill={accent} />
        </g>
      );

    case 'venn':
      return (
        <g>
          <circle cx="30" cy="30" r="20" fill={fill} opacity="0.6" />
          <circle cx="50" cy="30" r="20" fill={accent} opacity="0.6" />
          <ellipse cx="40" cy="30" rx="10" ry="18" fill={stroke} opacity="0.3" />
        </g>
      );

    case 'stakeholder-map':
      return (
        <g>
          <circle cx="40" cy="30" r="8" fill={fill} />
          <circle cx="20" cy="15" r="6" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="60" cy="15" r="6" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="15" cy="40" r="5" fill="#e5e7eb" />
          <circle cx="65" cy="40" r="5" fill="#e5e7eb" />
          <circle cx="40" cy="52" r="5" fill={accent} />
          <line x1="35" y1="24" x2="24" y2="18" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="45" y1="24" x2="56" y2="18" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="33" y1="34" x2="19" y2="38" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="47" y1="34" x2="61" y2="38" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="38" x2="40" y2="47" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'org-chart':
      return (
        <g>
          <rect x="30" y="5" width="20" height="12" rx="2" fill={fill} />
          <rect x="10" y="28" width="16" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="32" y="28" width="16" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="54" y="28" width="16" height="10" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="5" y="48" width="12" height="8" rx="1" fill="#e5e7eb" />
          <rect x="20" y="48" width="12" height="8" rx="1" fill="#e5e7eb" />
          <rect x="48" y="48" width="12" height="8" rx="1" fill="#e5e7eb" />
          <rect x="63" y="48" width="12" height="8" rx="1" fill="#e5e7eb" />
          <line x1="40" y1="17" x2="40" y2="23" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="18" y1="23" x2="62" y2="23" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="18" y1="23" x2="18" y2="28" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="40" y1="23" x2="40" y2="28" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="62" y1="23" x2="62" y2="28" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="18" y1="38" x2="18" y2="43" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="11" y1="43" x2="26" y2="43" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="11" y1="43" x2="11" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="26" y1="43" x2="26" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="62" y1="38" x2="62" y2="43" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="54" y1="43" x2="69" y2="43" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="54" y1="43" x2="54" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="69" y1="43" x2="69" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'bullets-with-visual':
      return (
        <g>
          <rect x="5" y="10" width="35" height="40" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="12" cy="20" r="3" fill={fill} />
          <rect x="18" y="18" width="18" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="12" cy="32" r="3" fill={fill} />
          <rect x="18" y="30" width="18" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="12" cy="44" r="3" fill={fill} />
          <rect x="18" y="42" width="18" height="4" rx="1" fill="#e5e7eb" />
          <rect x="45" y="10" width="30" height="40" rx="2" fill={fill} opacity="0.2" />
          <circle cx="60" cy="30" r="12" fill={fill} />
        </g>
      );

    case 'icon-grid':
      return (
        <g>
          <rect x="8" y="8" width="20" height="20" rx="4" fill={fill} />
          <rect x="32" y="8" width="20" height="20" rx="4" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="56" y="8" width="16" height="20" rx="4" fill={accent} />
          <rect x="8" y="32" width="20" height="20" rx="4" fill={accent} />
          <rect x="32" y="32" width="20" height="20" rx="4" fill={fill} />
          <rect x="56" y="32" width="16" height="20" rx="4" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
        </g>
      );

    case 'bullets-only':
      return (
        <g>
          <circle cx="12" cy="15" r="3" fill={fill} />
          <rect x="20" y="13" width="50" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="12" cy="28" r="3" fill={fill} />
          <rect x="20" y="26" width="45" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="12" cy="41" r="3" fill={fill} />
          <rect x="20" y="39" width="55" height="4" rx="1" fill="#e5e7eb" />
        </g>
      );

    // ===== 複合レイアウト系 =====
    case 'before-after-diagram':
      // Before/Afterを図解で示す（左側にBefore図、右側にAfter図）
      return (
        <g>
          {/* 左側: Before */}
          <rect x="3" y="5" width="34" height="50" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="20" y="12" fontSize="6" fill={stroke} textAnchor="middle">Before</text>
          {/* Before図（問題のある構造） */}
          <rect x="8" y="18" width="10" height="8" rx="1" fill="#e5e7eb" />
          <rect x="22" y="18" width="10" height="8" rx="1" fill="#e5e7eb" />
          <rect x="8" y="30" width="10" height="8" rx="1" fill="#e5e7eb" />
          <rect x="22" y="30" width="10" height="8" rx="1" fill="#e5e7eb" />
          <line x1="18" y1="22" x2="22" y2="22" stroke="#9ca3af" strokeWidth={strokeWidth * 0.5} strokeDasharray="2 1" />
          <line x1="18" y1="34" x2="22" y2="34" stroke="#9ca3af" strokeWidth={strokeWidth * 0.5} strokeDasharray="2 1" />
          <text x="20" y="47" fontSize="5" fill="#9ca3af" textAnchor="middle">分断</text>

          {/* 矢印 */}
          <path d="M38 30 L42 30" stroke={accent} strokeWidth={strokeWidth} markerEnd="url(#arrow-ba)" />
          <defs>
            <marker id="arrow-ba" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
            </marker>
          </defs>

          {/* 右側: After */}
          <rect x="43" y="5" width="34" height="50" rx="2" fill={fill} opacity="0.2" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="60" y="12" fontSize="6" fill={stroke} textAnchor="middle">After</text>
          {/* After図（統合された構造） */}
          <rect x="48" y="18" width="24" height="8" rx="1" fill={fill} />
          <rect x="48" y="30" width="24" height="8" rx="1" fill={fill} />
          <line x1="60" y1="26" x2="60" y2="30" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="60" y="47" fontSize="5" fill={fill} textAnchor="middle">統合</text>
        </g>
      );

    case 'concept-explanation':
      // 抽象概念（左）+ 説明（右）
      return (
        <g>
          {/* 左側: 抽象概念（図解） */}
          <rect x="3" y="5" width="32" height="50" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          {/* 概念を表す円と矢印 */}
          <circle cx="19" cy="22" r="10" fill={fill} />
          <text x="19" y="25" fontSize="7" fill="white" textAnchor="middle">核心</text>
          <circle cx="10" cy="42" r="6" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="28" cy="42" r="6" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="14" y1="30" x2="12" y2="36" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="24" y1="30" x2="26" y2="36" stroke={stroke} strokeWidth={strokeWidth * 0.5} />

          {/* 右側: 説明テキスト */}
          <rect x="38" y="5" width="39" height="50" rx="2" fill="white" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="57" y="14" fontSize="6" fill={stroke} textAnchor="middle" fontWeight="bold">説明</text>
          <rect x="42" y="20" width="30" height="3" rx="1" fill="#e5e7eb" />
          <rect x="42" y="26" width="28" height="3" rx="1" fill="#e5e7eb" />
          <rect x="42" y="32" width="32" height="3" rx="1" fill="#e5e7eb" />
          <rect x="42" y="40" width="26" height="3" rx="1" fill="#e5e7eb" />
          <rect x="42" y="46" width="30" height="3" rx="1" fill="#e5e7eb" />
        </g>
      );

    case 'flow-with-message':
      // フロー図 + メッセージテキスト
      return (
        <g>
          {/* 上部: メッセージ */}
          <rect x="5" y="3" width="70" height="14" rx="2" fill={fill} />
          <text x="40" y="12" fontSize="6" fill="white" textAnchor="middle">Key Message</text>

          {/* 下部: フロー図 */}
          <rect x="5" y="20" width="70" height="36" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="10" y="28" width="14" height="12" rx="2" fill={fill} />
          <rect x="33" y="28" width="14" height="12" rx="2" fill={fill} />
          <rect x="56" y="28" width="14" height="12" rx="2" fill={fill} />
          <path d="M24 34 L33 34" stroke={stroke} strokeWidth={strokeWidth} markerEnd="url(#arrow-fm)" />
          <path d="M47 34 L56 34" stroke={stroke} strokeWidth={strokeWidth} markerEnd="url(#arrow-fm)" />
          <defs>
            <marker id="arrow-fm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
            </marker>
          </defs>
          <text x="17" y="47" fontSize="5" fill={stroke} textAnchor="middle">Step1</text>
          <text x="40" y="47" fontSize="5" fill={stroke} textAnchor="middle">Step2</text>
          <text x="63" y="47" fontSize="5" fill={stroke} textAnchor="middle">Step3</text>
        </g>
      );

    case 'chart-with-insight':
      // グラフ（左）+ インサイト・示唆（右）
      return (
        <g>
          {/* 左側: グラフエリア */}
          <rect x="3" y="5" width="36" height="50" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          {/* 棒グラフ */}
          <line x1="8" y1="12" x2="8" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="8" y1="48" x2="36" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="12" y="28" width="6" height="20" fill={fill} />
          <rect x="20" y="22" width="6" height="26" fill={fill} />
          <rect x="28" y="16" width="6" height="32" fill={accent} />
          {/* トレンド線 */}
          <polyline points="15,26 23,20 31,14" fill="none" stroke={accent} strokeWidth={strokeWidth} strokeDasharray="2 1" />

          {/* 右側: インサイト・示唆 */}
          <rect x="42" y="5" width="35" height="50" rx="2" fill="white" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="59" y="13" fontSize="5" fill={stroke} textAnchor="middle" fontWeight="bold">Insight</text>
          {/* コールアウトボックス */}
          <rect x="45" y="17" width="29" height="14" rx="2" fill={accent} opacity="0.2" stroke={accent} strokeWidth={strokeWidth * 0.5} />
          <text x="59" y="26" fontSize="5" fill={accent} textAnchor="middle">+30% 成長</text>
          {/* 示唆テキスト */}
          <rect x="45" y="35" width="28" height="3" rx="1" fill="#e5e7eb" />
          <rect x="45" y="41" width="24" height="3" rx="1" fill="#e5e7eb" />
          <rect x="45" y="47" width="26" height="3" rx="1" fill="#e5e7eb" />
        </g>
      );

    case 'problem-solution':
      // 問題（左）→ 解決策（右）
      return (
        <g>
          {/* 左側: 問題 */}
          <rect x="3" y="5" width="32" height="50" rx="2" fill="#fef2f2" stroke="#dc2626" strokeWidth={strokeWidth * 0.5} />
          <text x="19" y="13" fontSize="5" fill="#dc2626" textAnchor="middle" fontWeight="bold">Problem</text>
          {/* 問題アイコン */}
          <circle cx="19" cy="28" r="8" fill="#dc2626" opacity="0.2" />
          <text x="19" y="31" fontSize="10" fill="#dc2626" textAnchor="middle">!</text>
          {/* 問題の箇条書き */}
          <rect x="8" y="40" width="22" height="3" rx="1" fill="#fecaca" />
          <rect x="8" y="46" width="18" height="3" rx="1" fill="#fecaca" />

          {/* 矢印 */}
          <path d="M36 30 L42 30" stroke={accent} strokeWidth={strokeWidth * 1.5} markerEnd="url(#arrow-ps)" />
          <defs>
            <marker id="arrow-ps" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
            </marker>
          </defs>

          {/* 右側: 解決策 */}
          <rect x="45" y="5" width="32" height="50" rx="2" fill="#f0fdf4" stroke="#16a34a" strokeWidth={strokeWidth * 0.5} />
          <text x="61" y="13" fontSize="5" fill="#16a34a" textAnchor="middle" fontWeight="bold">Solution</text>
          {/* 解決アイコン */}
          <circle cx="61" cy="28" r="8" fill="#16a34a" opacity="0.2" />
          <text x="61" y="31" fontSize="8" fill="#16a34a" textAnchor="middle">✓</text>
          {/* 解決策の箇条書き */}
          <rect x="50" y="40" width="22" height="3" rx="1" fill="#bbf7d0" />
          <rect x="50" y="46" width="18" height="3" rx="1" fill="#bbf7d0" />
        </g>
      );

    case 'framework-application':
      // フレームワーク + クライアント適用
      return (
        <g>
          {/* 左側: フレームワーク（2x2マトリクス例） */}
          <rect x="3" y="5" width="34" height="50" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="20" y="12" fontSize="5" fill={stroke} textAnchor="middle" fontWeight="bold">Framework</text>
          {/* 2x2マトリクス */}
          <rect x="6" y="16" width="13" height="17" rx="1" fill={fill} opacity="0.8" />
          <rect x="21" y="16" width="13" height="17" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.3} />
          <rect x="6" y="35" width="13" height="17" rx="1" fill="#e5e7eb" />
          <rect x="21" y="35" width="13" height="17" rx="1" fill={accent} opacity="0.6" />

          {/* 矢印 */}
          <path d="M38 30 L42 30" stroke={stroke} strokeWidth={strokeWidth} markerEnd="url(#arrow-fa)" />
          <defs>
            <marker id="arrow-fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
            </marker>
          </defs>

          {/* 右側: 適用結果 */}
          <rect x="44" y="5" width="33" height="50" rx="2" fill="white" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="60" y="12" fontSize="5" fill={stroke} textAnchor="middle" fontWeight="bold">適用結果</text>
          {/* ポジション表示 */}
          <circle cx="52" cy="26" r="5" fill={accent} />
          <text x="52" y="28" fontSize="4" fill="white" textAnchor="middle">御社</text>
          {/* 説明 */}
          <rect x="47" y="36" width="26" height="3" rx="1" fill="#e5e7eb" />
          <rect x="47" y="42" width="22" height="3" rx="1" fill="#e5e7eb" />
          <rect x="47" y="48" width="24" height="3" rx="1" fill="#e5e7eb" />
        </g>
      );

    case 'summary-detail':
      // サマリーボックス + 詳細展開
      return (
        <g>
          {/* 上部: サマリーボックス */}
          <rect x="5" y="3" width="70" height="18" rx="2" fill={fill} />
          <text x="40" y="10" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">Executive Summary</text>
          <rect x="10" y="14" width="60" height="3" rx="1" fill="white" opacity="0.3" />

          {/* 下部: 詳細カード3つ */}
          <rect x="5" y="24" width="21" height="31" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="8" y="28" width="15" height="2" rx="1" fill={fill} />
          <rect x="8" y="33" width="13" height="2" rx="1" fill="#e5e7eb" />
          <rect x="8" y="38" width="15" height="2" rx="1" fill="#e5e7eb" />
          <rect x="8" y="43" width="11" height="2" rx="1" fill="#e5e7eb" />
          <rect x="8" y="48" width="14" height="2" rx="1" fill="#e5e7eb" />

          <rect x="29" y="24" width="21" height="31" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="32" y="28" width="15" height="2" rx="1" fill={fill} />
          <rect x="32" y="33" width="13" height="2" rx="1" fill="#e5e7eb" />
          <rect x="32" y="38" width="15" height="2" rx="1" fill="#e5e7eb" />
          <rect x="32" y="43" width="11" height="2" rx="1" fill="#e5e7eb" />
          <rect x="32" y="48" width="14" height="2" rx="1" fill="#e5e7eb" />

          <rect x="54" y="24" width="21" height="31" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="57" y="28" width="15" height="2" rx="1" fill={fill} />
          <rect x="57" y="33" width="13" height="2" rx="1" fill="#e5e7eb" />
          <rect x="57" y="38" width="15" height="2" rx="1" fill="#e5e7eb" />
          <rect x="57" y="43" width="11" height="2" rx="1" fill="#e5e7eb" />
          <rect x="57" y="48" width="14" height="2" rx="1" fill="#e5e7eb" />
        </g>
      );

    case 'multi-column-options':
      // 3列以上の選択肢比較
      return (
        <g>
          {/* ヘッダー行 */}
          <rect x="20" y="5" width="18" height="8" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="29" y="11" fontSize="5" fill={stroke} textAnchor="middle">Option A</text>
          <rect x="40" y="5" width="18" height="8" rx="1" fill={fill} />
          <text x="49" y="11" fontSize="5" fill="white" textAnchor="middle">Option B</text>
          <rect x="60" y="5" width="18" height="8" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="69" y="11" fontSize="5" fill={stroke} textAnchor="middle">Option C</text>

          {/* 比較項目 */}
          <text x="10" y="22" fontSize="4" fill={stroke}>コスト</text>
          <text x="10" y="32" fontSize="4" fill={stroke}>期間</text>
          <text x="10" y="42" fontSize="4" fill={stroke}>効果</text>
          <text x="10" y="52" fontSize="4" fill={stroke}>リスク</text>

          {/* 評価（○△×形式） */}
          <text x="29" y="22" fontSize="6" fill="#16a34a" textAnchor="middle">○</text>
          <text x="49" y="22" fontSize="6" fill={accent} textAnchor="middle">△</text>
          <text x="69" y="22" fontSize="6" fill="#dc2626" textAnchor="middle">×</text>

          <text x="29" y="32" fontSize="6" fill="#dc2626" textAnchor="middle">×</text>
          <text x="49" y="32" fontSize="6" fill="#16a34a" textAnchor="middle">○</text>
          <text x="69" y="32" fontSize="6" fill="#16a34a" textAnchor="middle">○</text>

          <text x="29" y="42" fontSize="6" fill={accent} textAnchor="middle">△</text>
          <text x="49" y="42" fontSize="6" fill="#16a34a" textAnchor="middle">◎</text>
          <text x="69" y="42" fontSize="6" fill={accent} textAnchor="middle">△</text>

          <text x="29" y="52" fontSize="6" fill="#16a34a" textAnchor="middle">○</text>
          <text x="49" y="52" fontSize="6" fill={accent} textAnchor="middle">△</text>
          <text x="69" y="52" fontSize="6" fill="#dc2626" textAnchor="middle">×</text>

          {/* 推奨マーク */}
          <rect x="40" y="14" width="18" height="42" rx="1" fill="none" stroke={accent} strokeWidth={strokeWidth} strokeDasharray="3 2" />
        </g>
      );

    case 'timeline-with-details':
      // タイムライン + 各フェーズ詳細
      return (
        <g>
          {/* タイムライン */}
          <line x1="10" y1="15" x2="70" y2="15" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="20" cy="15" r="4" fill={fill} />
          <circle cx="40" cy="15" r="4" fill={fill} />
          <circle cx="60" cy="15" r="4" fill={fill} />
          <text x="20" y="10" fontSize="4" fill={stroke} textAnchor="middle">Phase1</text>
          <text x="40" y="10" fontSize="4" fill={stroke} textAnchor="middle">Phase2</text>
          <text x="60" y="10" fontSize="4" fill={stroke} textAnchor="middle">Phase3</text>

          {/* 詳細カード */}
          <rect x="8" y="22" width="22" height="33" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="10" y="26" width="18" height="3" rx="1" fill={fill} />
          <rect x="10" y="32" width="16" height="2" rx="1" fill="#e5e7eb" />
          <rect x="10" y="37" width="18" height="2" rx="1" fill="#e5e7eb" />
          <rect x="10" y="42" width="14" height="2" rx="1" fill="#e5e7eb" />
          <text x="19" y="52" fontSize="4" fill={stroke} textAnchor="middle">2週間</text>

          <rect x="32" y="22" width="22" height="33" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="34" y="26" width="18" height="3" rx="1" fill={fill} />
          <rect x="34" y="32" width="16" height="2" rx="1" fill="#e5e7eb" />
          <rect x="34" y="37" width="18" height="2" rx="1" fill="#e5e7eb" />
          <rect x="34" y="42" width="14" height="2" rx="1" fill="#e5e7eb" />
          <text x="43" y="52" fontSize="4" fill={stroke} textAnchor="middle">4週間</text>

          <rect x="56" y="22" width="22" height="33" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <rect x="58" y="26" width="18" height="3" rx="1" fill={fill} />
          <rect x="58" y="32" width="16" height="2" rx="1" fill="#e5e7eb" />
          <rect x="58" y="37" width="18" height="2" rx="1" fill="#e5e7eb" />
          <rect x="58" y="42" width="14" height="2" rx="1" fill="#e5e7eb" />
          <text x="67" y="52" fontSize="4" fill={stroke} textAnchor="middle">6週間</text>
        </g>
      );

    case 'action-plan':
      // アクションプラン（担当・期限付き）
      return (
        <g>
          {/* ヘッダー */}
          <rect x="5" y="3" width="70" height="10" rx="2" fill={fill} />
          <text x="12" y="10" fontSize="5" fill="white">Action</text>
          <text x="40" y="10" fontSize="5" fill="white">Owner</text>
          <text x="62" y="10" fontSize="5" fill="white">Due</text>

          {/* アクション行 */}
          <rect x="5" y="15" width="70" height="10" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.3} />
          <rect x="8" y="18" width="26" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="42" cy="20" r="3" fill={accent} />
          <text x="58" y="22" fontSize="4" fill={stroke}>1月</text>
          <circle cx="70" cy="20" r="2" fill="#16a34a" />

          <rect x="5" y="27" width="70" height="10" rx="1" fill="white" stroke={stroke} strokeWidth={strokeWidth * 0.3} />
          <rect x="8" y="30" width="22" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="42" cy="32" r="3" fill={fill} />
          <text x="58" y="34" fontSize="4" fill={stroke}>2月</text>
          <circle cx="70" cy="32" r="2" fill={accent} />

          <rect x="5" y="39" width="70" height="10" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.3} />
          <rect x="8" y="42" width="28" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="42" cy="44" r="3" fill={accent} />
          <text x="58" y="46" fontSize="4" fill={stroke}>3月</text>
          <circle cx="70" cy="44" r="2" fill="#e5e7eb" stroke={stroke} strokeWidth={strokeWidth * 0.3} />

          {/* ステータス凡例 */}
          <circle cx="10" y="54" r="2" fill="#16a34a" />
          <text x="14" y="55" fontSize="3" fill={stroke}>完了</text>
          <circle cx="28" y="54" r="2" fill={accent} />
          <text x="32" y="55" fontSize="3" fill={stroke}>進行中</text>
          <circle cx="50" y="54" r="2" fill="#e5e7eb" stroke={stroke} strokeWidth={strokeWidth * 0.3} />
          <text x="54" y="55" fontSize="3" fill={stroke}>未着手</text>
        </g>
      );

    case 'impact-analysis':
      // 現状→将来 + 定量インパクト
      return (
        <g>
          {/* 左側: 現状 */}
          <rect x="3" y="5" width="28" height="40" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="17" y="13" fontSize="5" fill={stroke} textAnchor="middle">As-Is</text>
          {/* KPI表示 */}
          <rect x="6" y="18" width="22" height="10" rx="1" fill="white" stroke={stroke} strokeWidth={strokeWidth * 0.3} />
          <text x="17" y="25" fontSize="6" fill={stroke} textAnchor="middle">100</text>
          <rect x="6" y="32" width="22" height="10" rx="1" fill="white" stroke={stroke} strokeWidth={strokeWidth * 0.3} />
          <text x="17" y="39" fontSize="6" fill={stroke} textAnchor="middle">50%</text>

          {/* 中央: インパクト */}
          <path d="M32 25 L42 25" stroke={accent} strokeWidth={strokeWidth * 1.5} markerEnd="url(#arrow-ia)" />
          <defs>
            <marker id="arrow-ia" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
            </marker>
          </defs>
          {/* インパクト数値 */}
          <rect x="31" y="32" width="16" height="13" rx="2" fill={accent} />
          <text x="39" y="40" fontSize="5" fill="white" textAnchor="middle">+30%</text>

          {/* 右側: 将来 */}
          <rect x="49" y="5" width="28" height="40" rx="2" fill="#f0fdf4" stroke="#16a34a" strokeWidth={strokeWidth * 0.5} />
          <text x="63" y="13" fontSize="5" fill="#16a34a" textAnchor="middle">To-Be</text>
          {/* KPI表示（改善後） */}
          <rect x="52" y="18" width="22" height="10" rx="1" fill="white" stroke="#16a34a" strokeWidth={strokeWidth * 0.3} />
          <text x="63" y="25" fontSize="6" fill="#16a34a" textAnchor="middle" fontWeight="bold">130</text>
          <rect x="52" y="32" width="22" height="10" rx="1" fill="white" stroke="#16a34a" strokeWidth={strokeWidth * 0.3} />
          <text x="63" y="39" fontSize="6" fill="#16a34a" textAnchor="middle" fontWeight="bold">80%</text>

          {/* 下部: 効果サマリー */}
          <rect x="3" y="48" width="74" height="8" rx="1" fill={fill} />
          <text x="40" y="54" fontSize="4" fill="white" textAnchor="middle">年間効果: ¥100M削減 / 生産性30%向上</text>
        </g>
      );

    // ===== 戦略フレームワーク系 =====
    case 'closed-loop-ecosystem':
      // 循環エコシステム（中央ループ＋内部レイヤー＋外部アクター）
      return (
        <g>
          {/* 中央の循環ループ */}
          <ellipse cx="40" cy="30" rx="28" ry="22" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="4 2" />

          {/* 内部レイヤー（縦積み） */}
          <rect x="28" y="14" width="24" height="8" rx="2" fill={fill} />
          <text x="40" y="20" fontSize="5" fill="white" textAnchor="middle">Layer 1</text>
          <rect x="28" y="26" width="24" height="8" rx="2" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="40" y="32" fontSize="5" fill={stroke} textAnchor="middle">Layer 2</text>
          <rect x="28" y="38" width="24" height="8" rx="2" fill="#e5e7eb" />
          <text x="40" y="44" fontSize="5" fill={stroke} textAnchor="middle">Layer 3</text>

          {/* 外部アクター（放射状） */}
          <circle cx="8" cy="20" r="5" fill={accent} />
          <circle cx="8" cy="40" r="5" fill={accent} />
          <circle cx="72" cy="20" r="5" fill={accent} />
          <circle cx="72" cy="40" r="5" fill={accent} />

          {/* コネクタ */}
          <path d="M13 20 L20 24" stroke={stroke} strokeWidth={strokeWidth * 0.5} markerEnd="url(#arrow-eco)" />
          <path d="M13 40 L20 36" stroke={stroke} strokeWidth={strokeWidth * 0.5} markerEnd="url(#arrow-eco)" />
          <path d="M67 20 L60 24" stroke={stroke} strokeWidth={strokeWidth * 0.5} markerEnd="url(#arrow-eco)" />
          <path d="M67 40 L60 36" stroke={stroke} strokeWidth={strokeWidth * 0.5} markerEnd="url(#arrow-eco)" />
          <defs>
            <marker id="arrow-eco" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
            </marker>
          </defs>

          {/* 循環矢印 */}
          <path d="M58 12 Q68 30 58 48" fill="none" stroke={accent} strokeWidth={strokeWidth} markerEnd="url(#arrow-loop)" />
          <defs>
            <marker id="arrow-loop" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
            </marker>
          </defs>
        </g>
      );

    case 'strategic-temple':
      // 戦略の神殿型（Vision/Pillars/Foundation）
      return (
        <g>
          {/* 屋根（Vision） */}
          <polygon points="40,3 75,20 5,20" fill={fill} />
          <text x="40" y="14" fontSize="5" fill="white" textAnchor="middle">Vision</text>

          {/* 柱（Pillars）- 4本 */}
          <rect x="10" y="22" width="12" height="26" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="16" y="36" fontSize="4" fill={stroke} textAnchor="middle" transform="rotate(-90 16 36)">Pillar 1</text>

          <rect x="26" y="22" width="12" height="26" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="32" y="36" fontSize="4" fill={stroke} textAnchor="middle" transform="rotate(-90 32 36)">Pillar 2</text>

          <rect x="42" y="22" width="12" height="26" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="48" y="36" fontSize="4" fill={stroke} textAnchor="middle" transform="rotate(-90 48 36)">Pillar 3</text>

          <rect x="58" y="22" width="12" height="26" rx="1" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <text x="64" y="36" fontSize="4" fill={stroke} textAnchor="middle" transform="rotate(-90 64 36)">Pillar 4</text>

          {/* 基盤（Foundation） */}
          <rect x="5" y="50" width="70" height="8" rx="2" fill={accent} />
          <text x="40" y="56" fontSize="5" fill="white" textAnchor="middle">Foundation</text>
        </g>
      );

    case 'hub-spoke-detailed':
      // ハブ＆スポーク詳細版（中心＋放射状サテライト＋コネクタ）
      return (
        <g>
          {/* 中央ハブ */}
          <circle cx="40" cy="30" r="12" fill={fill} />
          <text x="40" y="32" fontSize="6" fill="white" textAnchor="middle">Core</text>

          {/* サテライト（6つを放射状に配置） */}
          <circle cx="40" cy="6" r="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="62" cy="14" r="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="68" cy="36" r="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="56" cy="52" r="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="24" cy="52" r="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <circle cx="12" cy="36" r="5" fill={lightFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />

          {/* コネクタ（ハブからサテライトへ） */}
          <line x1="40" y1="18" x2="40" y2="11" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="50" y1="22" x2="58" y2="17" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="52" y1="30" x2="63" y2="36" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="48" y1="40" x2="52" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="32" y1="40" x2="28" y2="48" stroke={stroke} strokeWidth={strokeWidth * 0.5} />
          <line x1="28" y1="30" x2="17" y2="36" stroke={stroke} strokeWidth={strokeWidth * 0.5} />

          {/* アクセント（外周コネクタ） */}
          <path d="M45 6 Q55 5 60 12" fill="none" stroke={accent} strokeWidth={strokeWidth * 0.5} strokeDasharray="2 1" />
          <path d="M66 18 Q72 26 68 32" fill="none" stroke={accent} strokeWidth={strokeWidth * 0.5} strokeDasharray="2 1" />
        </g>
      );

    default:
      return (
        <g>
          <circle cx="12" cy="15" r="3" fill={fill} />
          <rect x="20" y="13" width="50" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="12" cy="28" r="3" fill={fill} />
          <rect x="20" y="26" width="45" height="4" rx="1" fill="#e5e7eb" />
          <circle cx="12" cy="41" r="3" fill={fill} />
          <rect x="20" y="39" width="55" height="4" rx="1" fill="#e5e7eb" />
        </g>
      );
  }
}

/**
 * 全パターンのプレビューグリッド
 */
export function VisualPatternGrid({
  size = 'sm',
  columns = 6,
  onSelect,
  selectedPattern,
}: {
  size?: 'sm' | 'md' | 'lg';
  columns?: number;
  onSelect?: (pattern: VisualHintType) => void;
  selectedPattern?: VisualHintType;
}) {
  const patterns = Object.keys(patternLabels) as VisualHintType[];

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {patterns.map((pattern) => (
        <button
          key={pattern}
          onClick={() => onSelect?.(pattern)}
          className={`p-2 rounded border transition-all ${
            selectedPattern === pattern
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <VisualPatternPreview pattern={pattern} size={size} />
        </button>
      ))}
    </div>
  );
}

/**
 * カテゴリ別パターン表示
 */
export function VisualPatternsByCategory({
  size = 'sm',
  onSelect,
  selectedPattern,
}: {
  size?: 'sm' | 'md' | 'lg';
  onSelect?: (pattern: VisualHintType) => void;
  selectedPattern?: VisualHintType;
}) {
  const categories: { name: string; patterns: VisualHintType[] }[] = [
    {
      name: '構造系',
      patterns: ['process-flow', 'hierarchy', 'pyramid', 'tree', 'cycle', 'convergence', 'divergence', 'funnel', 'swimlane'],
    },
    {
      name: '比較系',
      patterns: ['comparison', 'matrix', 'positioning-map', 'gap-analysis', 'swot'],
    },
    {
      name: '時間軸系',
      patterns: ['timeline', 'gantt', 'roadmap', 'milestone'],
    },
    {
      name: 'データ系',
      patterns: ['bar-chart', 'stacked-bar', 'pie-chart', 'line-chart', 'waterfall', 'radar', 'bridge', 'kpi-dashboard'],
    },
    {
      name: '関係性系',
      patterns: ['cause-effect', 'value-chain', 'venn', 'stakeholder-map', 'org-chart'],
    },
    {
      name: 'シンプル系',
      patterns: ['bullets-with-visual', 'icon-grid', 'bullets-only'],
    },
    {
      name: '複合レイアウト系',
      patterns: [
        'before-after-diagram',
        'concept-explanation',
        'flow-with-message',
        'chart-with-insight',
        'problem-solution',
        'framework-application',
        'summary-detail',
        'multi-column-options',
        'timeline-with-details',
        'action-plan',
        'impact-analysis',
      ],
    },
    {
      name: '戦略フレームワーク系',
      patterns: ['closed-loop-ecosystem', 'strategic-temple', 'hub-spoke-detailed'],
    },
  ];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.name}>
          <h4 className="text-sm font-medium text-gray-700 mb-3">{category.name}</h4>
          <div className="flex flex-wrap gap-2">
            {category.patterns.map((pattern) => (
              <button
                key={pattern}
                onClick={() => onSelect?.(pattern)}
                className={`p-2 rounded border transition-all ${
                  selectedPattern === pattern
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <VisualPatternPreview pattern={pattern} size={size} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
