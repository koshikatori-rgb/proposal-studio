# Google Cloud Imagen API クォータ増加申請ガイド

このサービスの画像生成機能を本番利用するには、Google CloudのImagen APIのクォータを増やす必要があります。

## 現在の状況

- **プロジェクトID**: `gen-lang-client-0211157228`
- **使用モデル**: `imagen-3.0-fast-generate-001`
- **現在のクォータ**: 20 requests/minute（デフォルト）
- **問題**: クォータ不足により画像生成が失敗する（429 Too Many Requests）

## クォータ増加申請の手順

### 1. Google Cloud Consoleにアクセス

1. https://console.cloud.google.com/ にアクセス
2. プロジェクト `gen-lang-client-0211157228` を選択

### 2. クォータページに移動

1. 左上のハンバーガーメニュー（三本線）をクリック
2. 「IAM と管理」→「割り当て」をクリック
3. または直接URLにアクセス: https://console.cloud.google.com/iam-admin/quotas

### 3. 該当するクォータを検索

検索バーで以下のキーワードを使って絞り込みます：

**検索方法1: モデル名で検索**
```
imagen-3.0-fast-generate
```

**検索方法2: APIで検索**
```
aiplatform.googleapis.com
```

**検索方法3: クォータ名で検索**
```
generate_content_requests_per_minute_per_project_per_base_model
```

### 4. 正しいクォータを特定

表示される項目から以下を探します：

| 列名 | 確認内容 |
|------|---------|
| **サービス** | `Vertex AI API` または `aiplatform.googleapis.com` |
| **名前** | `Generate content requests per minute per project per base model` |
| **ディメンション** | `base_model: imagen-3.0-fast-generate` |
| **現在の上限** | `20 / minute` |
| **場所** | `us-central1` |

### 5. クォータ増加をリクエスト

1. 該当するクォータの行にチェックを入れる
2. 上部の「割り当てを編集」ボタンをクリック
3. 右側にパネルが開く

### 6. 申請フォームに記入

#### 新しい上限値
推奨値を入力します：
- **開発/テスト環境**: `100 / minute`
- **本番環境**: `300 / minute` または `500 / minute`

#### リクエストの説明（必須）
以下のようなビジネスユースケースを記入してください：

**日本語の例**:
```
本プロジェクトでは、戦略コンサルティング提案書の自動生成サービスを開発しています。
AIを活用して提案書のスライド画像を生成する機能を提供しており、
1つの提案書につき平均6枚のスライド画像を生成します。

現在のクォータ（20 requests/minute）では、複数ユーザーが同時に利用した際に
クォータ超過エラーが発生し、サービスの継続的な提供が困難です。

想定ユーザー数と利用パターンから、100 requests/minute のクォータが必要です。
```

**英語の例**:
```
We are developing an AI-powered business proposal generation service
for strategy consulting. The service generates professional slide
mockup images using Imagen API, with an average of 6 images per proposal.

The current quota (20 requests/minute) is insufficient for multiple
concurrent users, causing frequent quota exceeded errors.

Based on our expected user base and usage patterns, we require
100 requests/minute to provide a reliable service.
```

### 7. 送信と承認待ち

1. 「送信」ボタンをクリック
2. 確認ダイアログが表示されたら「リクエスト」をクリック
3. メールで申請確認が届く

### 8. 承認タイムライン

- **通常**: 1〜3営業日
- **急ぎの場合**: サポートチケットを別途作成
- **自動承認**: 小規模な増加（50未満）は即時承認されることもある

### 9. 承認後の確認

承認されたら：
1. Google Cloud Consoleの「割り当て」ページで新しい上限を確認
2. `.env.local` で `NEXT_PUBLIC_USE_MOCK_IMAGES=false` に変更
3. アプリケーションを再起動
4. 実際に画像生成をテストする

## トラブルシューティング

### クォータが見つからない場合

1. **Vertex AI APIが有効になっているか確認**
   - APIとサービス → ダッシュボード
   - 「Vertex AI API」を検索して有効化

2. **正しいプロジェクトを選択しているか確認**
   - 画面上部のプロジェクト名を確認

3. **リージョンフィルタを確認**
   - 「すべての場所」を選択

### 申請が却下された場合

1. より詳細なビジネスユースケースを記載して再申請
2. Google Cloud サポートに問い合わせ
3. 段階的に増加を申請（例: まず50、次に100）

## 代替案

クォータが承認されるまでの間：

### オプション1: モック画像を使用（現在の設定）
```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_IMAGES=true
```
- デモ用のSVG画像を生成
- APIクォータを消費しない
- UI/UXフローを確認できる

### オプション2: レート制限を実装
- ユーザーごとに画像生成数を制限
- キューシステムで順番に処理
- リトライロジックを追加

### オプション3: 別のリージョンを試す
- `us-central1` 以外のリージョン（`us-west1`, `europe-west4` など）
- リージョンごとにクォータが独立している場合がある

## 参考リンク

- [Vertex AI Quotas and Limits](https://cloud.google.com/vertex-ai/docs/quotas)
- [Imagen API Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [Google Cloud Quota Management](https://cloud.google.com/docs/quota)

## 現在の設定

現在、このプロジェクトは**モック画像モード**で動作しています：
- `.env.local`で`NEXT_PUBLIC_USE_MOCK_IMAGES=true`に設定済み
- SVG形式のデモ画像を生成
- クォータが承認され次第、`false`に変更すると実際のImagen APIを使用

## 切り替え方法

### モックモード → 本番モード
```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_IMAGES=false  # この行を変更
```

開発サーバーを再起動：
```bash
# Ctrl+C で停止
npm run dev  # 再起動
```
