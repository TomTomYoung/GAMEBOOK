# Web公開の手順

このゲームは配布フォルダの`index.html`を直接開いて遊べます。Webで配布するときも、同じ静的ファイルを使います。

## GitHub Pages

`.github/workflows/pages.yml`に手動実行用の公開処理を用意しています。Pagesを有効化する操作と、ゲームの実装は別の設定です。

1. リポジトリの **Settings → Pages** を開く。
2. **Build and deployment → Source** で **GitHub Actions** を選ぶ。
3. **Actions → Deploy gamebook to Pages → Run workflow** を開き、`main`を選んで実行する。
4. `deploy`の完了を確認し、GitHubが表示するURLを開く。

このリポジトリ名を変えない場合の予定URLは`https://tomtomyoung.github.io/GAMEBOOK/`です。設定とデプロイが完了するまでは、公開済みURLとして案内しないでください。

公開処理は、原稿と生成物の一致・実行テストを確認してから、`index.html`、`css/`、`js/`、`assets/`だけをアップロードします。次回の更新も同じワークフローを手動実行して反映できます。自動公開に変更する場合は、公開方針を決めてから`push`トリガーを追加します。

出典：[GitHub公式・カスタムワークフローでGitHub Pagesを使う](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。使用する公式アクションは`configure-pages`、`upload-pages-artifact`、`deploy-pages`です。

## 通常の静的ホスティング

サブディレクトリ配置に対応しています。`index.html`、`css/`、`js/`、`assets/`を同じ相対構造で配置してください。JavaScriptや画像への参照はすべて相対パスです。APIサーバー、外部フォント、CDN、外部AIの呼出しはありません。

## 保存の引継ぎ

ローカルファイルで遊んだ栞と、Web公開先で遊ぶ栞は別の保存領域です。移動前に「セーブ → ファイルに保存」で書き出し、移動先で読み込んでください。URLや利用するブラウザを変更するときも同じです。
