# 環境変数一覧

## INSTANCE(URLString型)
* 動作させるアカウントがあるインスタンスのURL

## TOKEN(String型)
* 動作させるアカウントのトークン(書き込み・読み取り属性必須)

## ENV(String型)
* 動作環境
  * `"production"` ... 本番用
  * `"development"` ... デバッグ用(.envファイルの読み込みが有効になります)

## MODE(String型)
* 常駐モード
  * `""` ... 会話モード
  * `"study"` ... 学習モード(連合TLからトゥートを取得・学習します)
