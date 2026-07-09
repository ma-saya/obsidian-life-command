# Masa Life Command MVP

localhostで動く個人用コマンドセンターWebアプリです。Obsidian Vaultは正本のままにして、アプリ本体はVault外に置きます。

## 起動

```powershell
cd path\to\masa-life-command-app
npm start
```

ブラウザで `http://localhost:5177` を開きます。

## Phase 1でできること

- Vaultパス設定
- 今日の日記パス生成
- 指定Markdownから未完了TODOを表示
- TODO完了時に対象行だけ `- [x]` へ更新
- TODO完了ログを今日の日記の `## 今日の完了` へ追記
- 今日の日記の任意見出しへメモ追記
- 勉強タイマー
- 学習ログを今日の日記の `## 学習ログ` へ追記

## セキュリティ / GitHub公開前の注意

このアプリはローカル設定としてGoogle OAuth情報、Google Tokens、非公開iCal URL、Vaultパスを扱います。

- `data/settings.json` は絶対にコミットしないでください。
- 公開用には `data/settings.example.json` だけを使ってください。
- もし誤って `settings.json` を公開した場合は、Google OAuth Client Secret、Refresh Token、非公開iCal URLをすぐ無効化・再発行してください。
- Obsidian Vault本体や日記・TODOの実データは、このアプリのリポジトリには含めない想定です。

## 主な機能

- Obsidian TODO表示・完了・追加
- 今日の日記への追記
- 勉強タイマーと学習ログ
- FocusTODO送信
- Google Calendar / Google Tasks連携
- OllamaローカルAI相談
- Codex読み取り専用相談


