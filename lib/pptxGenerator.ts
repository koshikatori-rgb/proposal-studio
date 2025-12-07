import type { Proposal, SlideElement } from '@/types';

/**
 * PowerPointファイルを生成してダウンロード
 */
export async function generatePowerPoint(proposal: Proposal): Promise<void> {
  // ダイナミックインポート（ブラウザ環境で動作させるため）
  const PptxGenJS = (await import('pptxgenjs')).default as any;
  const pptx = new PptxGenJS() as any;

  // プレゼンテーション設定
  pptx.author = 'Strategic Consultant Proposal Tool';
  pptx.company = proposal.clientName;
  pptx.title = proposal.title;
  pptx.subject = 'Strategic Proposal';

  // レイアウト設定（16:9）
  pptx.layout = 'LAYOUT_16x9';

  // デフォルトのフォント設定
  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: 'FFFFFF' },
    objects: [
      {
        text: {
          text: '',
          options: {
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            fontFace: 'Arial',
            color: proposal.settings.colors.text,
          },
        },
      },
    ],
  });

  // 表紙スライド
  addTitleSlide(pptx, proposal);

  // 各スライドを追加
  proposal.slides
    .sort((a, b) => a.order - b.order)
    .forEach((slide) => {
      addSlide(pptx, slide, proposal);
    });

  // ファイル名を生成
  const fileName = `${proposal.title}_${new Date().toISOString().split('T')[0]}.pptx`;

  // ダウンロード
  await pptx.writeFile({ fileName });
}

/**
 * 表紙スライドを追加
 */
function addTitleSlide(pptx: any, proposal: Proposal): void {
  const slide = pptx.addSlide();

  // 背景色
  slide.background = { color: proposal.settings.colors.primary };

  // タイトル
  slide.addText(proposal.title, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });

  // サブタイトル
  slide.addText(proposal.clientName, {
    x: 0.5,
    y: 4.2,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });

  // 日付
  const dateStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  slide.addText(dateStr, {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });
}

/**
 * 通常のスライドを追加
 */
function addSlide(
  pptx: any,
  slideElement: SlideElement,
  proposal: Proposal
): void {
  const slide = pptx.addSlide();

  switch (slideElement.layout) {
    case 'title-only':
      addTitleOnlyLayout(slide, slideElement, proposal);
      break;
    case 'title-content':
      addTitleContentLayout(slide, slideElement, proposal);
      break;
    case 'title-bullets':
      addTitleBulletsLayout(slide, slideElement, proposal);
      break;
    case 'two-column':
      addTwoColumnLayout(slide, slideElement, proposal);
      break;
    case 'hierarchy':
      addHierarchyLayout(slide, slideElement, proposal);
      break;
    case 'steps':
      addStepsLayout(slide, slideElement, proposal);
      break;
    case 'timeline':
      addTimelineLayout(slide, slideElement, proposal);
      break;
    default:
      addTitleBulletsLayout(slide, slideElement, proposal);
  }
}

/**
 * タイトルのみレイアウト
 */
function addTitleOnlyLayout(
  slide: any,
  slideElement: SlideElement,
  proposal: Proposal
): void {
  slide.addText(slideElement.content.title, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    fontSize: proposal.settings.font.sizes.title,
    bold: true,
    color: proposal.settings.colors.primary,
    align: 'center',
    valign: 'middle',
  });
}

/**
 * タイトル+本文レイアウト
 */
function addTitleContentLayout(
  slide: any,
  slideElement: SlideElement,
  proposal: Proposal
): void {
  // タイトル
  slide.addText(slideElement.content.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: proposal.settings.font.sizes.title,
    bold: true,
    color: proposal.settings.colors.primary,
  });

  // 区切り線
  slide.addShape('rect', {
    x: 0.5,
    y: 1.4,
    w: 9,
    h: 0.02,
    fill: { color: proposal.settings.colors.secondary },
  });

  // 箇条書き
  if (slideElement.content.bullets && slideElement.content.bullets.length > 0) {
    slide.addText(
      slideElement.content.bullets.map((bullet) => ({ text: bullet, options: { bullet: true } })),
      {
        x: 0.8,
        y: 1.8,
        w: 8.4,
        h: 3.5,
        fontSize: proposal.settings.font.sizes.body,
        color: proposal.settings.colors.text,
      }
    );
  }

  // 本文
  if (slideElement.content.body) {
    slide.addText(slideElement.content.body, {
      x: 0.8,
      y: slideElement.content.bullets ? 5.3 : 1.8,
      w: 8.4,
      h: 0.8,
      fontSize: proposal.settings.font.sizes.body,
      color: proposal.settings.colors.text,
    });
  }
}

/**
 * タイトル+箇条書きレイアウト
 */
function addTitleBulletsLayout(
  slide: any,
  slideElement: SlideElement,
  proposal: Proposal
): void {
  // タイトル
  slide.addText(slideElement.content.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: proposal.settings.font.sizes.title,
    bold: true,
    color: proposal.settings.colors.primary,
  });

  // 区切り線
  slide.addShape('rect', {
    x: 0.5,
    y: 1.4,
    w: 9,
    h: 0.02,
    fill: { color: proposal.settings.colors.secondary },
  });

  // 箇条書き
  if (slideElement.content.bullets && slideElement.content.bullets.length > 0) {
    slide.addText(
      slideElement.content.bullets.map((bullet) => ({ text: bullet, options: { bullet: true } })),
      {
        x: 0.8,
        y: 1.8,
        w: 8.4,
        h: 4.0,
        fontSize: proposal.settings.font.sizes.body,
        color: proposal.settings.colors.text,
      }
    );
  }
}

/**
 * 2カラムレイアウト
 */
function addTwoColumnLayout(
  slide: any,
  slideElement: SlideElement,
  proposal: Proposal
): void {
  // タイトル
  slide.addText(slideElement.content.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: proposal.settings.font.sizes.title,
    bold: true,
    color: proposal.settings.colors.primary,
  });

  // 区切り線
  slide.addShape('rect', {
    x: 0.5,
    y: 1.4,
    w: 9,
    h: 0.02,
    fill: { color: proposal.settings.colors.secondary },
  });

  const bullets = slideElement.content.bullets || [];
  const midPoint = Math.ceil(bullets.length / 2);
  const leftBullets = bullets.slice(0, midPoint);
  const rightBullets = bullets.slice(midPoint);

  // 左カラム
  if (leftBullets.length > 0) {
    slide.addText(
      leftBullets.map((bullet) => ({ text: bullet, options: { bullet: true } })),
      {
        x: 0.8,
        y: 1.8,
        w: 4.0,
        h: 4.0,
        fontSize: proposal.settings.font.sizes.body,
        color: proposal.settings.colors.text,
      }
    );
  }

  // 右カラム
  if (rightBullets.length > 0) {
    slide.addText(
      rightBullets.map((bullet) => ({ text: bullet, options: { bullet: true } })),
      {
        x: 5.2,
        y: 1.8,
        w: 4.0,
        h: 4.0,
        fontSize: proposal.settings.font.sizes.body,
        color: proposal.settings.colors.text,
      }
    );
  }
}

/**
 * 階層構造レイアウト
 */
function addHierarchyLayout(
  slide: any,
  slideElement: SlideElement,
  proposal: Proposal
): void {
  addTitleBulletsLayout(slide, slideElement, proposal);
}

/**
 * ステップレイアウト
 */
function addStepsLayout(
  slide: any,
  slideElement: SlideElement,
  proposal: Proposal
): void {
  // タイトル
  slide.addText(slideElement.content.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: proposal.settings.font.sizes.title,
    bold: true,
    color: proposal.settings.colors.primary,
  });

  // 区切り線
  slide.addShape('rect', {
    x: 0.5,
    y: 1.4,
    w: 9,
    h: 0.02,
    fill: { color: proposal.settings.colors.secondary },
  });

  // ステップを横並びに配置
  const bullets = slideElement.content.bullets || [];
  const stepWidth = 9 / bullets.length;

  bullets.forEach((bullet, index) => {
    const x = 0.5 + index * stepWidth;

    // ステップ番号（円形の図形を追加）
    slide.addShape('ellipse', {
      x: x + stepWidth / 2 - 0.3,
      y: 2.2,
      w: 0.6,
      h: 0.6,
      fill: { color: proposal.settings.colors.accent },
    });

    slide.addText(`${index + 1}`, {
      x: x + stepWidth / 2 - 0.3,
      y: 2.2,
      w: 0.6,
      h: 0.6,
      fontSize: 20,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });

    // ステップ内容
    slide.addText(bullet, {
      x: x + 0.1,
      y: 3.0,
      w: stepWidth - 0.2,
      h: 2.0,
      fontSize: proposal.settings.font.sizes.body - 2,
      color: proposal.settings.colors.text,
      align: 'center',
      valign: 'top',
    });

    // 矢印（最後のステップ以外）
    if (index < bullets.length - 1) {
      slide.addShape('rightArrow', {
        x: x + stepWidth - 0.3,
        y: 2.4,
        w: 0.4,
        h: 0.2,
        fill: { color: proposal.settings.colors.secondary },
      });
    }
  });
}

/**
 * タイムラインレイアウト
 */
function addTimelineLayout(
  slide: any,
  slideElement: SlideElement,
  proposal: Proposal
): void {
  addStepsLayout(slide, slideElement, proposal);
}
