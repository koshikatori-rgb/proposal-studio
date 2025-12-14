import { NextRequest } from 'next/server';
import { renderSlideToSVG } from '@/lib/slideRenderer';
import type { SlideStructure } from '@/types/slideStructure';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { structure } = body as { structure: SlideStructure };

    if (!structure) {
      return Response.json(
        { error: 'structure が必要です' },
        { status: 400 }
      );
    }

    // SVGをレンダリング
    const result = renderSlideToSVG(structure);

    if (!result.success) {
      return Response.json(
        { error: result.error || 'レンダリングに失敗しました' },
        { status: 500 }
      );
    }

    // SVGをBase64エンコードしたデータURLとして返す
    const svgBase64 = Buffer.from(result.svgData || '').toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return Response.json({
      success: true,
      svgData: result.svgData,
      dataUrl,
    });
  } catch (error) {
    console.error('SVG render error:', error);
    return Response.json(
      { error: 'SVGのレンダリングに失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
