# ディレクトリ構造(Structure of Directories)

```Directory
/(Root directory)
  - src | Shiinaのソースファイル
    - libs | 各モジュール
    - models | Mastodonから返されるデータモデル
    - views | デバッグビューページ
    - tests | 各テスト(動作テストなど)
    + shiina.js | メインスクリプト
  - dict | 辞書ファイル
  - db | 形態素解析データ
    - kantei.go.jp | 首相官邸からのデータ(語彙/文法構造用)
    + friends_nico.db | ニコフレからのデータ(単語用)
  - samples | サンプルの教師データ
    - both | 語彙/文法構造用のデータ
    - vocabulary | 語彙用のデータ
    - structure | 文法構造用のデータ
  - docs | 開発するにあたってのノートなど
  + .gulpfile.js | 辞書ファイル生成スクリプト
  + .env | 環境変数
```