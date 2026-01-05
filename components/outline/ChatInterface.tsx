'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/common/Button';
import type { ChatSession } from '@/types';

// Phase A: 対話開始テンプレート（ストーリーライン構築用）
// ※ 実際のシステムプロンプトは /api/chat/route.ts に定義
// ※ クライアント側では「情報を伝えて対話を開始する」形式
// ※ 「作成して」等の指示は含めず、ヒアリングを促す

// プリセットカテゴリ（MECE分類）
type PresetCategory = {
  name: string;
  presets: {
    title: string;
    data: {
      clientInfo: string;
      consultationContent: string;
      ourStrength: string;
    };
  }[];
};

const presetCategories: PresetCategory[] = [
  {
    name: '戦略系',
    presets: [
      {
        title: '中期経営計画・成長戦略',
        data: {
          clientInfo: `業界: 総合商社
企業規模: 売上高8,000億円、従業員数5,000名
直面している状況:
・既存事業の成熟化により成長が鈍化
・株主からROE改善と事業ポートフォリオ見直しを要求
・次世代成長領域の特定が経営課題`,
          consultationContent: `相談内容:
・次期中期経営計画（3カ年）の策定支援
・事業ポートフォリオの再構築と資源配分の最適化
・成長領域への参入戦略とM&A候補の検討

予算感: 8,000万〜1.5億円
期間: 6ヶ月で中計骨子策定`,
          ourStrength: `強み:
・上場企業の中計策定支援実績100社以上
・事業ポートフォリオ分析の独自フレームワーク
・M&Aアドバイザリーとの連携体制`,
        },
      },
    ],
  },
  {
    name: '事業系',
    presets: [
      {
        title: '新規事業開発',
        data: {
          clientInfo: `業界: 小売業（アパレル）
企業規模: 売上高800億円、店舗数300店舗
直面している状況:
・EC比率が10%と業界平均（25%）を大きく下回る
・20-30代の顧客離れが深刻
・サステナビリティ対応の遅れを株主から指摘`,
          consultationContent: `相談内容:
・D2C（Direct to Consumer）事業の立ち上げ支援
・サステナブルファッションの新ブランド開発
・若年層向けマーケティング戦略の刷新

予算感: 新規事業として3年で10億円投資予定
期間: 6ヶ月で事業計画策定、1年で市場投入`,
          ourStrength: `強み:
・D2Cブランド立ち上げ支援10社以上
・サステナビリティ経営コンサル実績
・Z世代マーケティングの専門知見`,
        },
      },
      {
        title: '営業・マーケティング改革',
        data: {
          clientInfo: `業界: BtoB製造業（産業機械）
企業規模: 売上高1,200億円、従業員数3,000名
直面している状況:
・営業が属人的で、トップセールス依存度が高い
・リードジェネレーションがほぼ展示会頼み
・顧客データが分散し、クロスセル機会を逃している`,
          consultationContent: `相談内容:
・営業プロセスの標準化とSFA/CRM導入
・デジタルマーケティング（MA）の立ち上げ
・カスタマーサクセス組織の構築

予算感: 1〜2億円（ツール導入含む）
期間: 6ヶ月で設計、1年で定着`,
          ourStrength: `強み:
・BtoB営業改革支援50社以上
・Salesforce/HubSpot導入支援実績
・インサイドセールス立ち上げノウハウ`,
        },
      },
    ],
  },
  {
    name: 'オペレーション系',
    presets: [
      {
        title: '業務改善・BPR',
        data: {
          clientInfo: `業界: 金融業（地方銀行）
企業規模: 総資産3兆円、従業員数3,500名
直面している状況:
・人口減少・低金利環境で収益力が低下
・営業店の業務が複雑化し、残業時間が増加
・デジタルバンクの台頭で若年層顧客が流出`,
          consultationContent: `相談内容:
・営業店業務の抜本的な効率化
・顧客接点のデジタル化（アプリ強化）
・人員の最適配置と人材育成計画

予算感: 年間1〜2億円規模の変革投資
期間: 1年間で成果を出したい`,
          ourStrength: `強み:
・金融機関の業務改革支援実績20行以上
・RPA導入による業務効率化ノウハウ
・顧客体験（CX）設計の専門チーム`,
        },
      },
      {
        title: 'DX推進（システム刷新）',
        data: {
          clientInfo: `業界: 製造業（自動車部品）
企業規模: 売上高500億円、従業員数2,000名
直面している状況:
・基幹システム（SAP）が15年前に導入され老朽化
・生産管理と在庫管理がExcelと紙ベースで属人化
・競合他社がIoT・AI活用で生産効率30%向上を発表`,
          consultationContent: `相談内容:
・DX推進のロードマップを策定したい
・デジタル化の優先順位付けと投資対効果の試算
・現場を巻き込んだ変革の進め方

予算感: 初期コンサル費用として3,000〜5,000万円
期間: 3〜6ヶ月でロードマップ策定`,
          ourStrength: `強み:
・製造業DX支援実績50社以上
・SAP S/4HANA移行支援の専門チーム保有
・IoT/AI活用による生産性向上の成功事例多数`,
        },
      },
    ],
  },
  {
    name: '組織・人材系',
    presets: [
      {
        title: '組織改革・人事制度',
        data: {
          clientInfo: `業界: IT（SIer）
企業規模: 売上高2,000億円、従業員数8,000名
直面している状況:
・事業部制の縦割りで部門間連携が困難
・中途採用者の離職率が30%と高水準
・新卒エンジニアの成長速度が競合に劣後`,
          consultationContent: `相談内容:
・組織構造の見直し（マトリクス組織化検討）
・エンゲージメント向上施策の設計
・人材育成体系の再構築

予算感: 5,000万〜1億円
期間: 4ヶ月で施策設計、来期から実行フェーズ`,
          ourStrength: `強み:
・IT企業の組織変革支援30社以上
・エンゲージメントサーベイ設計・分析実績
・アジャイル組織への移行支援経験`,
        },
      },
      {
        title: 'チェンジマネジメント・定着化',
        data: {
          clientInfo: `業界: 総合電機メーカー
企業規模: 売上高1.5兆円、従業員数30,000名
直面している状況:
・生成AI活用を全社方針として打ち出したが現場浸透が進まない
・一部部門での試行から全社展開へのスケールに苦戦
・セキュリティ懸念から利用ルールが厳しく、利用率が低迷`,
          consultationContent: `相談内容:
・生成AI活用の全社浸透プログラム設計
・部門別ユースケースの開発と成功事例の横展開
・利用促進のためのCoE（Center of Excellence）構築
・現場のリテラシー向上と意識改革

予算感: 6,000万〜1億円
期間: 6ヶ月でプログラム設計、1年で全社展開`,
          ourStrength: `強み:
・大企業での生成AI活用支援20社以上
・チェンジマネジメントの専門チーム
・社内浸透のためのコミュニケーション設計実績`,
        },
      },
    ],
  },
  {
    name: '財務系',
    presets: [
      {
        title: 'コスト構造改革',
        data: {
          clientInfo: `業界: 流通業（スーパーマーケット）
企業規模: 売上高4,000億円、店舗数200店舗
直面している状況:
・原材料費・人件費の高騰で営業利益率が2%を切る
・競合との価格競争が激化し、値上げが困難
・物流コストが売上の8%を占め、業界平均を上回る`,
          consultationContent: `相談内容:
・全社コスト構造の可視化と削減余地の特定
・サプライチェーンの最適化（物流センター統廃合）
・間接費削減（本部機能のスリム化）

予算感: 5,000万〜8,000万円
期間: 4ヶ月で施策立案、1年で30億円削減目標`,
          ourStrength: `強み:
・小売業のコスト改革支援30社以上
・ゼロベース予算編成（ZBB）の導入実績
・物流コンサルティングの専門チーム`,
        },
      },
    ],
  },
];

// フラットなプリセットリスト（後方互換性のため）
const presetSamples = presetCategories.flatMap(cat => cat.presets);

type ChatInterfaceProps = {
  proposalId: string;
  section: ChatSession['section'];
  onUpdate?: (data: any) => void;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  proposalId,
  section,
}) => {
  const { messages, sendMessage, loading } = useChat(proposalId, section);
  const [input, setInput] = useState('');
  const [showPromptBuilder, setShowPromptBuilder] = useState(true);
  const [clientInfo, setClientInfo] = useState('');
  const [consultationContent, setConsultationContent] = useState('');
  const [ourStrength, setOurStrength] = useState('');

  // フォームからプロンプトを生成（Phase A: 対話開始用）
  // ※「作成して」等の指示は含めず、情報提供のみ。AIは必ず質問から開始する
  const generatePrompt = (): string => {
    // 情報が入力されていない場合はシンプルな開始メッセージ
    if (!clientInfo && !consultationContent && !ourStrength) {
      return '提案書のストーリーラインを一緒に考えてほしいです。まず何から聞いてもらえますか？';
    }

    // 情報がある場合は、対話の出発点として情報を提供
    return `提案書を作成したいのですが、まずヒアリングをお願いします。

【クライアントについて】
${clientInfo || '（未入力）'}

【相談内容】
${consultationContent || '（未入力）'}

【私たちの強み】
${ourStrength || '（未入力）'}

上記の情報を踏まえて、まず確認したいことを教えてください。`;
  };

  // プリセット適用
  const applyPreset = (preset: typeof presetSamples[0]) => {
    setClientInfo(preset.data.clientInfo);
    setConsultationContent(preset.data.consultationContent);
    setOurStrength(preset.data.ourStrength);
  };

  // プロンプトをチャットにコピーして送信
  const handleCopyAndSend = async () => {
    const prompt = generatePrompt();
    setInput('');
    setShowPromptBuilder(false);
    await sendMessage(prompt);
  };

  // プロンプトをチャット入力欄にコピー（送信はしない）
  const handleCopyToInput = () => {
    const prompt = generatePrompt();
    setInput(prompt);
    setShowPromptBuilder(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    await sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!input.trim() || loading) return;
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !showPromptBuilder ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">まだ対話がありません</p>
              <button
                onClick={() => setShowPromptBuilder(true)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                プロンプト作成パネルを開く
              </button>
            </div>
          </div>
        ) : messages.length === 0 && showPromptBuilder ? (
          /* プロンプト作成パネル */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">プロンプト作成（入力情報を編集）</h3>
              <button
                onClick={() => setShowPromptBuilder(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                閉じる
              </button>
            </div>

            {/* プリセット選択 - カテゴリ別表示 */}
            <div>
              <p className="text-xs text-gray-500 mb-2">
                サンプルから選択（任意）
                <span className="text-gray-400 ml-2">※選択せず自分で入力も可能です</span>
              </p>
              <div className="space-y-2">
                {presetCategories.map((category) => (
                  <div key={category.name} className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-400 w-20 shrink-0 pt-1.5">{category.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {category.presets.map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => applyPreset(preset)}
                          className="px-2.5 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          {preset.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* フォーム入力 - 3つのテキストエリア */}
            <div className="space-y-3">
              {/* クライアント情報 */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  クライアント情報（業界・企業規模・状況）
                </label>
                <textarea
                  value={clientInfo}
                  onChange={(e) => setClientInfo(e.target.value)}
                  placeholder={`例:
業界: 製造業（自動車部品）
企業規模: 売上高500億円、従業員数2,000名
直面している状況:
・基幹システムが15年前に導入され老朽化
・生産管理と在庫管理がExcelと紙ベースで属人化`}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                  rows={5}
                />
              </div>

              {/* 相談内容・RFP概要 */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  相談内容・RFP概要（悩み・依頼内容・予算感）
                </label>
                <textarea
                  value={consultationContent}
                  onChange={(e) => setConsultationContent(e.target.value)}
                  placeholder={`例:
相談内容:
・DX推進のロードマップを策定したい
・デジタル化の優先順位付けと投資対効果の試算

予算感: 初期コンサル費用として3,000〜5,000万円
期間: 3〜6ヶ月でロードマップ策定`}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                  rows={5}
                />
              </div>

              {/* 自社の強み・特徴 */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  自社の強み・特徴（類似実績など）
                </label>
                <textarea
                  value={ourStrength}
                  onChange={(e) => setOurStrength(e.target.value)}
                  placeholder={`例:
強み:
・製造業DX支援実績50社以上
・SAP S/4HANA移行支援の専門チーム保有
・IoT/AI活用による生産性向上の成功事例多数`}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* プレビュー（折りたたみ可能） */}
            <details className="group">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                生成されるプロンプトをプレビュー ▼
              </summary>
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto">
                <pre className="text-[10px] text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {generatePrompt()}
                </pre>
              </div>
            </details>

            {/* アクションボタン */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyToInput}
                className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                入力欄にコピー
              </button>
              <button
                onClick={handleCopyAndSend}
                disabled={loading}
                className="flex-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {loading ? '送信中...' : 'AIに送信'}
              </button>
            </div>
          </div>
        ) : (
          /* メッセージ表示 */
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1 text-gray-400">
                    <div className="animate-bounce text-xs">●</div>
                    <div className="animate-bounce text-xs" style={{ animationDelay: '0.1s' }}>●</div>
                    <div className="animate-bounce text-xs" style={{ animationDelay: '0.2s' }}>●</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 入力フォーム */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        {messages.length > 0 && (
          <button
            onClick={() => setShowPromptBuilder(true)}
            className="text-[10px] text-gray-400 hover:text-gray-600 mb-2 block"
          >
            + 新しいプロンプトを作成
          </button>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力... (Cmd/Ctrl+Enterで送信)"
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 resize-none"
              rows={2}
            />
          </div>
          <Button type="submit" disabled={loading || !input.trim()}>
            送信
          </Button>
        </form>
      </div>
    </div>
  );
};
