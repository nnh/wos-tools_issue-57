# wos-tools_issue-57
## 概要
出力したHTMLファイルの内容を確認するためのスクリプトです。
## 処理手順
- 入力フォルダにHTMLファイルを格納してください。
- issue57.gsの関数issue57を実行してください。出力ファイル格納フォルダに「実行日時」という名前のスプレッドシートが作成され、その中にファイル毎の確認結果を出力します。  
- 必要があれば、issue57.gsの関数issue57Summaryを実行してください。上記スプレッドシートに「summary」という名前のシートが作成され、その中にPubMedのDEPまたはDPと年月が合わない情報を出力します。  
## このリポジトリからCloneした場合の事前処理  
下記のスクリプトプロパティの設定が必要です。  
- inputFolderId : 確認対象ファイルを格納しているフォルダのID  
- outputFolderId : 確認結果出力用フォルダのID  

下記ライブラリに依存します。  
- https://github.com/nnh/driveCommon
- wos-tools-common
