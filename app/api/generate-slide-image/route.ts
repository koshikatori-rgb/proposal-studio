import { NextRequest } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

// Google Cloud の設定
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const LOCATION = 'us-central1';

export async function POST(request: NextRequest) {
  try {
    const { slide } = await request.json();

    // モックモードの場合は、モック画像を返す
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_IMAGES === 'true';

    if (useMock) {
      console.log('🎨 モックモード: デモ用の画像を生成します');
      const mockImageUrl = generateMockSlideImage(slide);
      return Response.json({
        imageUrl: mockImageUrl,
        isMock: true,
      });
    }

    // 本番モード: 実際にVertex AI Imagen 3を使用
    if (!PROJECT_ID) {
      return Response.json(
        { error: 'GOOGLE_CLOUD_PROJECT_ID が設定されていません' },
        { status: 500 }
      );
    }

    // スライドの内容からプロンプトを生成
    const prompt = generatePromptFromSlide(slide);

    // Vertex AI を初期化
    const vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });

    // Imagen 3 Fast モデルを使用して画像生成（クォータが利用可能）
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: 'imagen-3.0-fast-generate-001',
    });

    const result = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.4,
      },
    });

    // 生成された画像を取得
    const response = result.response;
    const imageData = response.candidates?.[0]?.content?.parts?.[0];

    if (!imageData || !('inlineData' in imageData) || !imageData.inlineData) {
      throw new Error('画像生成に失敗しました');
    }

    // Base64エンコードされた画像データを返す
    return Response.json({
      imageUrl: `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`,
      isMock: false,
    });
  } catch (error) {
    console.error('Image generation error:', error);

    // 詳細なエラー情報をログ出力
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return Response.json(
      {
        error: '画像生成に失敗しました。もう一度お試しください。',
        details: error instanceof Error ? error.message : String(error),
        projectId: PROJECT_ID ? 'set' : 'not set'
      },
      { status: 500 }
    );
  }
}

// ワイヤーフレームスタイルのモック画像を生成
function generateWireframeMockImage(slide: any): string {
  const { title, mainMessage, content, visualHint, visualIntent } = slide;
  const bullets = content?.bullets || [];
  const slideTitle = title || 'タイトル';
  const message = mainMessage || '';

  // Grid background pattern for wireframe aesthetic
  const gridPattern = `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
      </pattern>
    </defs>`;

  // Base wireframe structure
  let wireframeContent = '';

  // Generate wireframe based on visualHint type
  switch (visualHint) {
    case 'process-flow':
      wireframeContent = generateProcessFlowWireframe(bullets);
      break;
    case 'comparison':
      wireframeContent = generateComparisonWireframe(bullets);
      break;
    case 'hierarchy':
      wireframeContent = generateHierarchyWireframe(bullets);
      break;
    case 'timeline':
      wireframeContent = generateTimelineWireframe(bullets);
      break;
    case 'matrix':
      wireframeContent = generateMatrixWireframe(bullets);
      break;
    case 'pyramid':
      wireframeContent = generatePyramidWireframe(bullets);
      break;
    case 'bar-chart':
      wireframeContent = generateBarChartWireframe(bullets);
      break;
    case 'pie-chart':
      wireframeContent = generatePieChartWireframe(bullets);
      break;
    case 'bullets-with-visual':
      wireframeContent = generateBulletsWithVisualWireframe(bullets);
      break;
    case 'bullets-only':
    default:
      wireframeContent = generateBulletsOnlyWireframe(bullets);
      break;
  }

  const svg = `
    <svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
      ${gridPattern}

      <!-- Background with grid -->
      <rect width="1600" height="900" fill="white"/>
      <rect width="1600" height="900" fill="url(#grid)"/>

      <!-- Border frame -->
      <rect x="40" y="40" width="1520" height="820" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="10,5"/>

      <!-- Title area with sketch style -->
      <rect x="80" y="80" width="1440" height="120" fill="none" stroke="#666" stroke-width="2"/>
      <text x="100" y="130" font-family="'Courier New', monospace" font-size="36" font-weight="bold" fill="#222">
        ${escapeXml(slideTitle)}
      </text>
      <line x1="100" y1="150" x2="${Math.min(100 + slideTitle.length * 20, 1400)}" y2="150" stroke="#7c3aed" stroke-width="3"/>

      ${message ? `
      <text x="100" y="180" font-family="'Courier New', monospace" font-size="20" fill="#555">
        ${escapeXml(message.substring(0, 80))}${message.length > 80 ? '...' : ''}
      </text>` : ''}

      <!-- Visual Intent annotation -->
      <rect x="80" y="220" width="1440" height="60" fill="#fffbeb" stroke="#f59e0b" stroke-width="1" stroke-dasharray="5,3"/>
      <text x="100" y="245" font-family="'Courier New', monospace" font-size="16" fill="#92400e" font-style="italic">
        💡 Visual Intent: ${escapeXml(visualIntent || '')}
      </text>

      <!-- Main wireframe content -->
      <g transform="translate(0, 300)">
        ${wireframeContent}
      </g>

      <!-- Footer annotation -->
      <text x="800" y="870" font-family="'Courier New', monospace" font-size="14" fill="#999" text-anchor="middle">
        [WIREFRAME DRAFT - ${visualHint?.toUpperCase() || 'LAYOUT'}]
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Wireframe generation functions for each visual type
function generateProcessFlowWireframe(bullets: string[]): string {
  const boxWidth = 280;
  const boxHeight = 120;
  const spacing = 80;
  const startX = 100;
  const startY = 50;

  return bullets.slice(0, 4).map((bullet, idx) => {
    const x = startX + idx * (boxWidth + spacing);
    return `
      <!-- Step ${idx + 1} -->
      <rect x="${x}" y="${startY}" width="${boxWidth}" height="${boxHeight}"
            fill="#f0f9ff" stroke="#0284c7" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="${x + boxWidth / 2}" y="${startY + 40}"
            font-family="'Courier New', monospace" font-size="18" font-weight="bold"
            fill="#0c4a6e" text-anchor="middle">
        STEP ${idx + 1}
      </text>
      <text x="${x + boxWidth / 2}" y="${startY + 70}"
            font-family="'Courier New', monospace" font-size="14"
            fill="#333" text-anchor="middle">
        ${escapeXml(bullet.substring(0, 25))}
      </text>
      <text x="${x + boxWidth / 2}" y="${startY + 90}"
            font-family="'Courier New', monospace" font-size="14"
            fill="#333" text-anchor="middle">
        ${escapeXml(bullet.substring(25, 50))}
      </text>
      ${idx < bullets.length - 1 && idx < 3 ? `
      <!-- Arrow -->
      <line x1="${x + boxWidth}" y1="${startY + boxHeight / 2}"
            x2="${x + boxWidth + spacing}" y2="${startY + boxHeight / 2}"
            stroke="#7c3aed" stroke-width="3" marker-end="url(#arrowhead)"/>
      ` : ''}
    `;
  }).join('') + `
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#7c3aed"/>
      </marker>
    </defs>
  `;
}

function generateComparisonWireframe(bullets: string[]): string {
  const leftBullets = bullets.slice(0, Math.ceil(bullets.length / 2));
  const rightBullets = bullets.slice(Math.ceil(bullets.length / 2));

  return `
    <!-- Left column (Before/AsIs) -->
    <rect x="100" y="30" width="600" height="400" fill="#fef2f2" stroke="#dc2626" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="400" y="60" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#991b1b" text-anchor="middle">
      BEFORE / AS-IS
    </text>
    ${leftBullets.map((bullet, idx) => `
      <text x="120" y="${100 + idx * 40}" font-family="'Courier New', monospace" font-size="16" fill="#333">
        ✗ ${escapeXml(bullet.substring(0, 40))}
      </text>
    `).join('')}

    <!-- VS divider -->
    <line x1="800" y1="30" x2="800" y2="430" stroke="#666" stroke-width="3"/>
    <circle cx="800" cy="230" r="40" fill="white" stroke="#666" stroke-width="3"/>
    <text x="800" y="240" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#666" text-anchor="middle">
      VS
    </text>

    <!-- Right column (After/ToBe) -->
    <rect x="900" y="30" width="600" height="400" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="1200" y="60" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#166534" text-anchor="middle">
      AFTER / TO-BE
    </text>
    ${rightBullets.map((bullet, idx) => `
      <text x="920" y="${100 + idx * 40}" font-family="'Courier New', monospace" font-size="16" fill="#333">
        ✓ ${escapeXml(bullet.substring(0, 40))}
      </text>
    `).join('')}
  `;
}

function generateHierarchyWireframe(bullets: string[]): string {
  return `
    <!-- Root node -->
    <rect x="600" y="20" width="400" height="80" fill="#dbeafe" stroke="#0284c7" stroke-width="2"/>
    <text x="800" y="65" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#0c4a6e" text-anchor="middle">
      ${escapeXml(bullets[0]?.substring(0, 35) || 'Root')}
    </text>

    <!-- Child nodes -->
    ${bullets.slice(1, 5).map((bullet, idx) => {
      const x = 150 + idx * 350;
      return `
        <line x1="800" y1="100" x2="${x + 150}" y2="180" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3,3"/>
        <rect x="${x}" y="180" width="300" height="70" fill="#f1f5f9" stroke="#64748b" stroke-width="2"/>
        <text x="${x + 150}" y="220" font-family="'Courier New', monospace" font-size="14" fill="#334155" text-anchor="middle">
          ${escapeXml(bullet.substring(0, 30))}
        </text>
      `;
    }).join('')}
  `;
}

function generateTimelineWireframe(bullets: string[]): string {
  return `
    <!-- Timeline line -->
    <line x1="100" y1="200" x2="1500" y2="200" stroke="#666" stroke-width="4"/>

    <!-- Timeline points -->
    ${bullets.slice(0, 5).map((bullet, idx) => {
      const x = 200 + idx * 300;
      return `
        <circle cx="${x}" cy="200" r="15" fill="white" stroke="#7c3aed" stroke-width="3"/>
        <circle cx="${x}" cy="200" r="8" fill="#7c3aed"/>
        <text x="${x}" y="170" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#5b21b6" text-anchor="middle">
          Week ${idx + 1}
        </text>
        <text x="${x}" y="240" font-family="'Courier New', monospace" font-size="12" fill="#333" text-anchor="middle">
          ${escapeXml(bullet.substring(0, 20))}
        </text>
        <text x="${x}" y="260" font-family="'Courier New', monospace" font-size="12" fill="#333" text-anchor="middle">
          ${escapeXml(bullet.substring(20, 40))}
        </text>
      `;
    }).join('')}
  `;
}

function generateMatrixWireframe(bullets: string[]): string {
  return `
    <!-- Matrix grid -->
    <line x1="800" y1="50" x2="800" y2="450" stroke="#333" stroke-width="3"/>
    <line x1="150" y1="250" x2="1450" y2="250" stroke="#333" stroke-width="3"/>

    <!-- Axis labels -->
    <text x="800" y="30" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#666" text-anchor="middle">HIGH</text>
    <text x="800" y="480" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#666" text-anchor="middle">LOW</text>
    <text x="100" y="255" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#666" text-anchor="end">LOW</text>
    <text x="1500" y="255" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#666" text-anchor="start">HIGH</text>

    <!-- Quadrant items -->
    ${bullets.slice(0, 4).map((bullet, idx) => {
      const positions = [
        { x: 1000, y: 100 },  // Q1: High-High
        { x: 475, y: 100 },   // Q2: Low-High
        { x: 475, y: 320 },   // Q3: Low-Low
        { x: 1000, y: 320 }   // Q4: High-Low
      ];
      const pos = positions[idx] || positions[0];
      return `
        <rect x="${pos.x}" y="${pos.y}" width="280" height="100" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="${pos.x + 140}" y="${pos.y + 35}" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#92400e" text-anchor="middle">
          Q${idx + 1}
        </text>
        <text x="${pos.x + 140}" y="${pos.y + 60}" font-family="'Courier New', monospace" font-size="12" fill="#333" text-anchor="middle">
          ${escapeXml(bullet.substring(0, 25))}
        </text>
      `;
    }).join('')}
  `;
}

function generatePyramidWireframe(bullets: string[]): string {
  return bullets.slice(0, 5).map((bullet, idx) => {
    const width = 300 + idx * 250;
    const x = 800 - width / 2;
    const y = 50 + idx * 90;
    return `
      <polygon points="${x},${y} ${x + width},${y} ${x + width - 30},${y + 80} ${x + 30},${y + 80}"
               fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/>
      <text x="800" y="${y + 50}" font-family="'Courier New', monospace" font-size="16" fill="#312e81" text-anchor="middle">
        ${escapeXml(bullet.substring(0, 30))}
      </text>
    `;
  }).join('');
}

function generateBarChartWireframe(bullets: string[]): string {
  return `
    <!-- Y-axis -->
    <line x1="150" y1="50" x2="150" y2="450" stroke="#333" stroke-width="3"/>
    <!-- X-axis -->
    <line x1="150" y1="450" x2="1450" y2="450" stroke="#333" stroke-width="3"/>

    <!-- Bars -->
    ${bullets.slice(0, 5).map((bullet, idx) => {
      const height = 100 + Math.random() * 300;
      const x = 250 + idx * 240;
      return `
        <rect x="${x}" y="${450 - height}" width="180" height="${height}"
              fill="#a5b4fc" stroke="#6366f1" stroke-width="2"/>
        <text x="${x + 90}" y="${430 - height}" font-family="'Courier New', monospace" font-size="14"
              fill="#312e81" text-anchor="middle">
          ${Math.floor(height)}
        </text>
        <text x="${x + 90}" y="480" font-family="'Courier New', monospace" font-size="12"
              fill="#333" text-anchor="middle">
          ${escapeXml(bullet.substring(0, 12))}
        </text>
      `;
    }).join('')}
  `;
}

function generatePieChartWireframe(bullets: string[]): string {
  const total = bullets.length;
  let currentAngle = 0;

  return `
    <g transform="translate(800, 250)">
      ${bullets.slice(0, 6).map((bullet, idx) => {
        const angle = (360 / total);
        const startAngle = currentAngle * Math.PI / 180;
        const endAngle = (currentAngle + angle) * Math.PI / 180;
        const x1 = Math.cos(startAngle) * 200;
        const y1 = Math.sin(startAngle) * 200;
        const x2 = Math.cos(endAngle) * 200;
        const y2 = Math.sin(endAngle) * 200;
        const largeArcFlag = angle > 180 ? 1 : 0;

        const labelAngle = (currentAngle + angle / 2) * Math.PI / 180;
        const labelX = Math.cos(labelAngle) * 280;
        const labelY = Math.sin(labelAngle) * 280;

        currentAngle += angle;

        const colors = ['#fecaca', '#fed7aa', '#fde68a', '#d9f99d', '#a7f3d0', '#a5f3fc'];
        const strokeColors = ['#dc2626', '#ea580c', '#ca8a04', '#65a30d', '#059669', '#0891b2'];

        return `
          <path d="M 0 0 L ${x1} ${y1} A 200 200 0 ${largeArcFlag} 1 ${x2} ${y2} Z"
                fill="${colors[idx % colors.length]}" stroke="${strokeColors[idx % strokeColors.length]}" stroke-width="2"/>
          <line x1="0" y1="0" x2="${labelX * 0.7}" y2="${labelY * 0.7}" stroke="#666" stroke-width="1" stroke-dasharray="2,2"/>
          <text x="${labelX}" y="${labelY}" font-family="'Courier New', monospace" font-size="12"
                fill="#333" text-anchor="middle">
            ${escapeXml(bullet.substring(0, 15))}
          </text>
          <text x="${labelX}" y="${labelY + 15}" font-family="'Courier New', monospace" font-size="11"
                fill="#666" text-anchor="middle">
            ${Math.round(100 / total)}%
          </text>
        `;
      }).join('')}
      <circle cx="0" cy="0" r="200" fill="none" stroke="#333" stroke-width="2"/>
    </g>
  `;
}

function generateBulletsWithVisualWireframe(bullets: string[]): string {
  return `
    <!-- Left side: Bullets -->
    <g>
      ${bullets.slice(0, 4).map((bullet, idx) => `
        <circle cx="120" cy="${60 + idx * 90}" r="8" fill="none" stroke="#7c3aed" stroke-width="2"/>
        <text x="150" y="${65 + idx * 90}" font-family="'Courier New', monospace" font-size="16" fill="#333">
          ${escapeXml(bullet.substring(0, 40))}
        </text>
      `).join('')}
    </g>

    <!-- Right side: Visual placeholder -->
    <rect x="900" y="50" width="600" height="350" fill="#f0f9ff" stroke="#0284c7" stroke-width="2" stroke-dasharray="10,5"/>
    <line x1="950" y1="100" x2="1450" y2="300" stroke="#cbd5e1" stroke-width="1"/>
    <line x1="1450" y1="100" x2="950" y2="300" stroke="#cbd5e1" stroke-width="1"/>
    <text x="1200" y="230" font-family="'Courier New', monospace" font-size="18" fill="#64748b" text-anchor="middle">
      [VISUAL ELEMENT]
    </text>
    <text x="1200" y="260" font-family="'Courier New', monospace" font-size="14" fill="#94a3b8" text-anchor="middle">
      Icon / Diagram / Chart
    </text>
  `;
}

function generateBulletsOnlyWireframe(bullets: string[]): string {
  return bullets.slice(0, 6).map((bullet, idx) => `
    <rect x="100" y="${50 + idx * 80}" width="1400" height="70" fill="${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}" stroke="#e2e8f0" stroke-width="1"/>
    <circle cx="140" cy="${85 + idx * 80}" r="6" fill="#7c3aed"/>
    <text x="170" y="${90 + idx * 80}" font-family="'Courier New', monospace" font-size="16" fill="#333">
      ${escapeXml(bullet.substring(0, 90))}
    </text>
  `).join('');
}

// モック画像を生成する関数（SVGをBase64に変換）
function generateMockSlideImage(slide: any): string {
  const { title, mainMessage, content, layout, order, visualHint, visualIntent } = slide;

  // If visualIntent exists, generate wireframe-style mock
  if (visualIntent) {
    return generateWireframeMockImage(slide);
  }

  // スライドタイトルを取得
  const slideTitle = title || content.title || 'タイトル';
  const message = mainMessage || '';
  const bullets = content.bullets || [];
  const bodyText = content.body || '';

  // レイアウトに応じてデザインを変更
  let contentSVG = '';

  if (bullets.length > 0) {
    // 箇条書きレイアウト：プロフェッショナルなデザイン
    contentSVG = `
      <!-- 箇条書きセクション -->
      ${bullets.slice(0, 5).map((bullet: string, idx: number) => {
        const yPos = 320 + idx * 95;
        return `
        <!-- 箇条書き項目 ${idx + 1} -->
        <rect x="80" y="${yPos - 25}" width="1440" height="80" fill="${idx % 2 === 0 ? '#f8f9fa' : '#ffffff'}" stroke="#e9ecef" stroke-width="1"/>
        <circle cx="120" cy="${yPos + 10}" r="6" fill="#7c3aed"/>
        <text x="150" y="${yPos + 5}" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#1f2937">
          ${escapeXml(bullet.substring(0, 100))}
        </text>
        ${bullet.length > 100 ? `
        <text x="150" y="${yPos + 30}" font-family="Arial, sans-serif" font-size="20" fill="#6b7280">
          ${escapeXml(bullet.substring(100, 180))}${bullet.length > 180 ? '...' : ''}
        </text>
        ` : ''}
      `}).join('')}
    `;
  } else if (bodyText) {
    // 本文レイアウト：カード風デザイン
    const lines = wrapText(bodyText, 90);
    contentSVG = `
      <!-- 本文カード -->
      <rect x="80" y="300" width="1440" height="${Math.min(500, lines.length * 40 + 60)}" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2" rx="8"/>
      ${lines.slice(0, 10).map((line: string, idx: number) => `
        <text x="120" y="${350 + idx * 40}" font-family="Arial, sans-serif" font-size="24" fill="#374151">
          ${escapeXml(line)}
        </text>
      `).join('')}
    `;
  } else {
    // デフォルト：ビジュアル要素のラフスケッチ
    contentSVG = `
      <!-- 左側：プロセスフロー図のラフ -->
      <rect x="80" y="320" width="680" height="480" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="8"/>

      <!-- プロセスステップ1 -->
      <rect x="120" y="360" width="180" height="100" fill="#e0e7ff" stroke="#7c3aed" stroke-width="2" rx="4"/>
      <text x="210" y="405" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#5b21b6" text-anchor="middle">
        STEP 1
      </text>
      <text x="210" y="430" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        現状分析
      </text>

      <!-- 矢印1 -->
      <path d="M 310 410 L 350 410" stroke="#7c3aed" stroke-width="3" fill="none"/>
      <path d="M 345 405 L 355 410 L 345 415" fill="#7c3aed"/>

      <!-- プロセスステップ2 -->
      <rect x="360" y="360" width="180" height="100" fill="#ddd6fe" stroke="#7c3aed" stroke-width="2" rx="4"/>
      <text x="450" y="405" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#5b21b6" text-anchor="middle">
        STEP 2
      </text>
      <text x="450" y="430" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        課題設定
      </text>

      <!-- 矢印2 -->
      <path d="M 550 410 L 590 410" stroke="#7c3aed" stroke-width="3" fill="none"/>
      <path d="M 585 405 L 595 410 L 585 415" fill="#7c3aed"/>

      <!-- プロセスステップ3 -->
      <rect x="600" y="360" width="140" height="100" fill="#c4b5fd" stroke="#7c3aed" stroke-width="2" rx="4"/>
      <text x="670" y="405" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#5b21b6" text-anchor="middle">
        STEP 3
      </text>
      <text x="670" y="430" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        実行
      </text>

      <!-- サブテキスト -->
      <text x="120" y="500" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • データ収集
      </text>
      <text x="120" y="530" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 要因分析
      </text>
      <text x="120" y="560" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 仮説構築
      </text>

      <text x="360" y="500" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 課題の特定
      </text>
      <text x="360" y="530" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 優先順位付け
      </text>

      <text x="600" y="500" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 施策立案
      </text>
      <text x="600" y="530" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 実行計画
      </text>

      <!-- 右側：データチャートのラフ -->
      <rect x="840" y="320" width="680" height="480" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="8"/>

      <!-- チャートタイトル -->
      <text x="1180" y="360" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#1f2937" text-anchor="middle">
        実績推移（イメージ）
      </text>

      <!-- 棒グラフ風 -->
      <rect x="900" y="550" width="80" height="120" fill="#93c5fd" stroke="#3b82f6" stroke-width="2"/>
      <text x="940" y="590" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1e40af" text-anchor="middle">
        85%
      </text>
      <text x="940" y="690" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        2022
      </text>

      <rect x="1020" y="500" width="80" height="170" fill="#86efac" stroke="#22c55e" stroke-width="2"/>
      <text x="1060" y="545" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#166534" text-anchor="middle">
        95%
      </text>
      <text x="1060" y="690" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        2023
      </text>

      <rect x="1140" y="420" width="80" height="250" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
      <text x="1180" y="460" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#92400e" text-anchor="middle">
        120%
      </text>
      <text x="1180" y="690" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        2024
      </text>

      <rect x="1260" y="380" width="80" height="290" fill="#c084fc" stroke="#a855f7" stroke-width="2"/>
      <text x="1300" y="420" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#6b21a8" text-anchor="middle">
        145%
      </text>
      <text x="1300" y="690" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        目標
      </text>

      <!-- 軸線 -->
      <line x1="880" y1="680" x2="1360" y2="680" stroke="#9ca3af" stroke-width="2"/>
      <line x1="880" y1="380" x2="880" y2="680" stroke="#9ca3af" stroke-width="2"/>

      <!-- 成長トレンド矢印 -->
      <path d="M 920 520 Q 1060 450, 1320 390" stroke="#7c3aed" stroke-width="3" fill="none" stroke-dasharray="5,5"/>
      <text x="1180" y="440" font-family="Arial, sans-serif" font-size="16" fill="#7c3aed" font-style="italic">
        ↗ 成長トレンド
      </text>
    `;
  }

  // SVGでプロフェッショナルなスライドモックアップを作成
  const svg = `
    <svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
      <!-- グラデーション背景 -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- 背景 -->
      <rect width="1600" height="900" fill="url(#bgGradient)"/>

      <!-- ヘッダーバー -->
      <rect width="1600" height="8" fill="url(#headerGradient)"/>

      <!-- スライド番号バッジ -->
      <circle cx="1500" cy="60" r="32" fill="#7c3aed" opacity="0.1"/>
      <text x="1500" y="70" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#7c3aed" text-anchor="middle">
        ${(order || 0) + 1}
      </text>

      <!-- タイトルエリア -->
      <rect x="60" y="100" width="1480" height="140" fill="#ffffff" stroke="#e5e7eb" stroke-width="1" rx="4"/>

      <!-- アクセントライン -->
      <rect x="60" y="100" width="8" height="140" fill="#7c3aed" rx="4"/>

      <!-- タイトルテキスト -->
      <text x="90" y="155" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#1f2937">
        ${escapeXml(slideTitle)}
      </text>

      <!-- メインメッセージ -->
      ${message ? `
      <text x="90" y="205" font-family="Arial, sans-serif" font-size="26" fill="#6b7280" font-style="italic">
        ${escapeXml(message.substring(0, 120))}${message.length > 120 ? '...' : ''}
      </text>
      ` : ''}

      <!-- コンテンツエリア -->
      ${contentSVG}

      <!-- フッター -->
      <rect y="880" width="1600" height="20" fill="#f1f5f9"/>

      <!-- モックラベル（小さく控えめに） -->
      <rect x="1380" y="840" width="180" height="32" fill="#fef3c7" stroke="#fbbf24" stroke-width="1" rx="4"/>
      <text x="1470" y="862" font-family="Arial, sans-serif" font-size="16" fill="#92400e" text-anchor="middle">
        🎨 DEMO SLIDE
      </text>

      <!-- レイアウト情報 -->
      <text x="60" y="865" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
        Layout: ${layout}
      </text>
    </svg>
  `;

  // SVGをBase64に変換
  const base64 = Buffer.from(svg.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// テキストを指定文字数で折り返す補助関数
function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

// XMLエスケープ関数
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ワイヤーフレームスタイルのプロンプト生成（visualIntentを活用）
function generateWireframePrompt(slide: any): string {
  const { title, mainMessage, content, visualHint, visualIntent, visualReason } = slide;
  const bullets = content?.bullets || [];
  const body = content?.body || content?.text || '';

  // ベースとなるワイヤーフレームスタイル指定
  let prompt = `Create a detailed wireframe-style sketch for a business presentation slide.
This should look like a hand-drawn draft or design mockup with the following characteristics:

**VISUAL STYLE:**
- Hand-drawn sketch aesthetic with clean lines
- Grid layout visible (subtle background grid lines)
- Boxes, arrows, and placeholder elements clearly drawn
- Annotations and labels in a neat handwriting style
- Black lines on white background
- Professional wireframe/mockup quality
- Clear hierarchy and spacing

**SLIDE INFORMATION:**
Title: "${title || 'Untitled'}"
Main Message: "${mainMessage || ''}"

**VISUAL INTENT:**
${visualIntent}

**REASONING:**
${visualReason}

**CONTENT:**
`;

  if (body) {
    prompt += `Body Text: ${body}\n`;
  }

  if (bullets.length > 0) {
    prompt += `\nKey Points (${bullets.length} items):\n`;
    bullets.forEach((bullet: string, i: number) => {
      prompt += `${i + 1}. ${bullet}\n`;
    });
  }

  // visualHintタイプに応じた詳細な視覚化指示
  prompt += `\n**LAYOUT INSTRUCTIONS FOR ${visualHint?.toUpperCase() || 'STANDARD'}:**\n`;

  switch (visualHint) {
    case 'process-flow':
      prompt += `- Draw ${bullets.length} boxes arranged horizontally from left to right
- Connect boxes with arrows showing flow direction (→)
- Each box should contain: step number, title, and brief description
- Add labels like "STEP 1", "STEP 2", etc.
- Show clear progression with directional arrows
- Include annotations explaining the flow logic`;
      break;

    case 'comparison':
      prompt += `- Create a two-column layout with clear divider in the middle
- Left column: "Before" or "AsIs" state with box outline
- Right column: "After" or "ToBe" state with box outline
- Use contrasting visual indicators (e.g., X marks vs checkmarks)
- Draw comparison arrows or vs symbol between columns
- List key differences in bullet points under each column`;
      break;

    case 'hierarchy':
      prompt += `- Draw a tree structure with the main topic at the top
- Branch out into ${bullets.length} sub-categories with connecting lines
- Use indentation and nested boxes to show hierarchy levels
- Add parent-child relationship arrows
- Label each level (e.g., "Root", "Branch 1", "Branch 2")
- Show clear structural relationships with connecting lines`;
      break;

    case 'timeline':
      prompt += `- Draw a horizontal or vertical timeline with milestone markers
- Mark key events as circles or diamonds along the timeline
- Add date/time labels at each milestone point
- Use dotted lines to connect timeline points
- Include brief descriptions next to each milestone
- Show progression with directional arrow along timeline`;
      break;

    case 'bar-chart':
      prompt += `- Sketch vertical or horizontal bars representing data
- Draw ${bullets.length} bars with different heights/lengths
- Add axis labels (X-axis and Y-axis)
- Include value labels on or above each bar
- Draw grid lines in the background for reference
- Add legend explaining what each bar represents`;
      break;

    case 'pie-chart':
      prompt += `- Draw a circular pie chart divided into ${bullets.length} segments
- Label each segment with percentage and category name
- Use different patterns or shading for each slice
- Draw lines pointing from slices to their labels
- Include a legend box listing all categories
- Add title "Distribution" or similar above the chart`;
      break;

    case 'matrix':
      prompt += `- Draw a 2x2 matrix with clear quadrant divisions
- Label axes (e.g., "High/Low" on vertical, "Easy/Hard" on horizontal)
- Place 4 items in appropriate quadrants based on content
- Draw boxes or circles for each item in the matrix
- Add quadrant labels (Q1, Q2, Q3, Q4)
- Include brief descriptions in each quadrant`;
      break;

    case 'pyramid':
      prompt += `- Draw a pyramid structure with ${bullets.length} horizontal layers
- Widest layer at bottom, narrowest at top
- Label each layer with corresponding content
- Show hierarchy from most important (top) to foundational (bottom)
- Add annotations explaining each level's significance
- Use clear horizontal dividing lines between layers`;
      break;

    case 'bullets-with-visual':
      prompt += `- Left side: bullet points listed vertically with checkboxes or bullet symbols
- Right side: supporting visual element (icon, simple diagram, or illustration)
- Draw boxes around the visual area as placeholder
- Connect related bullets to visual elements with light arrows
- Add annotations explaining the visual representation
- Maintain clear visual balance between text and graphics`;
      break;

    case 'bullets-only':
    default:
      prompt += `- Simple, clean list layout with bullet points
- Each bullet point in its own row with adequate spacing
- Use bullet symbols (•, -, or numbers)
- Optional: draw small icon placeholders next to key points
- Maintain clear hierarchy if there are sub-bullets
- Add brief annotations or notes where helpful`;
      break;
  }

  prompt += `\n\n**FINAL REQUIREMENTS:**
- Sketch should look like a professional design wireframe
- Clear enough to understand the intended layout and flow
- Include grid lines, boxes, arrows, and labels as appropriate
- Hand-drawn aesthetic but neat and readable
- Focus on structure and layout rather than final polish
- This is a draft/mockup showing how the final slide will be structured`;

  return prompt;
}

function generatePromptFromSlide(slide: any): string {
  const { title, mainMessage, content, layout, visualHint, visualIntent, visualReason } = slide;

  // If visualIntent exists, generate wireframe-style prompt
  if (visualIntent && visualReason) {
    return generateWireframePrompt(slide);
  }

  // スライドタイプに応じてプロンプトを生成
  let prompt = `Create a professional business presentation slide mockup with the following characteristics:

Title: ${title || 'Untitled Slide'}
Main Message: ${mainMessage || ''}
Layout Type: ${layout}

`;

  // コンテンツタイプに応じて詳細を追加
  if (content.text) {
    prompt += `Main Content: ${content.text}\n`;
  }

  if (content.body) {
    prompt += `Body Text: ${content.body}\n`;
  }

  if (content.bullets && content.bullets.length > 0) {
    prompt += `Bullet Points:\n`;
    content.bullets.forEach((bullet: string) => {
      prompt += `- ${bullet}\n`;
    });
  }

  // スライドタイプに応じたスタイル指定
  prompt += `\nStyle Requirements:
- Clean, minimalist design suitable for strategy consulting
- White background with black text
- Professional typography
- Use simple geometric shapes for visual hierarchy
- No photos or complex graphics
- Focus on clarity and readability
- Business presentation aesthetic
- Modern and professional look

The slide should look like a wireframe or mockup sketch for a PowerPoint presentation.`;

  return prompt;
}
