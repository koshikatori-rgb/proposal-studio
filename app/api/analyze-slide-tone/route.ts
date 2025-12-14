import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      );
    }

    // ファイルをBase64に変換
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/png';

    // Claude Vision APIでスライドを分析
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `このスライド画像を分析し、以下のトンマナ（トーン＆マナー）要素を抽出してください。
JSONフォーマットで出力してください。

{
  "name": "抽出したスタイルの名前（例: ビジネスフォーマル）",
  "description": "このスタイルの特徴を簡潔に説明",
  "colors": {
    "primary": "#XXXXXX（メインカラー）",
    "secondary": "#XXXXXX（サブカラー）",
    "accent": "#XXXXXX（アクセントカラー）",
    "text": "#XXXXXX（テキストカラー）",
    "background": "#XXXXXX（背景色）"
  },
  "font": {
    "recommendation": "推奨フォントファミリー（ゴシック系/明朝系/サンセリフ系）",
    "style": "フォントスタイル（太め/標準/細め）"
  },
  "toneManner": {
    "writingStyle": "polite/casual/noun-ending のいずれか",
    "formality": "formal/semi-formal/casual のいずれか",
    "bulletStyle": "dash/circle/number のいずれか"
  },
  "characteristics": ["このスタイルの特徴を3-5個リストアップ"]
}

JSONのみを出力してください。説明文は不要です。`,
            },
          ],
        },
      ],
    });

    // レスポンスからJSONを抽出
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    // JSON部分を抽出（コードブロックで囲まれている場合も対応）
    let jsonText = content.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // JSONをパース
    const extractedStyle = JSON.parse(jsonText.trim());

    return Response.json({
      success: true,
      extractedStyle,
    });
  } catch (error) {
    console.error('Slide tone analysis error:', error);
    return Response.json(
      { error: 'スライド分析に失敗しました' },
      { status: 500 }
    );
  }
}
