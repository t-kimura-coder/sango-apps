# sango-apps

工事部の業務補助アプリ（iPhone向けPWA）をまとめたリポジトリ。フォルダごとに独立したアプリとしてGitHub Pagesで公開する。

| フォルダ | アプリ | 公開URL |
|---|---|---|
| `genba-manual/` | 現場訪問マニュアル（マニュアル閲覧＋工程別の写真・報告） | https://t-kimura-coder.github.io/sango-apps/genba-manual/ |
| `genba-viewer/` | 現場ナビ 見守り（管理者ビューア・PC用。現場ナビの報告をBox Driveのフォルダから一覧し、返信を書き出す） | https://t-kimura-coder.github.io/sango-apps/genba-viewer/ |
| `sango-support/` | 山郷サポート（建物から業者の連絡先を調べて電話、トラブルと対応を写真付きで記録→管理者へ送る） | https://t-kimura-coder.github.io/sango-apps/sango-support/ |

## ルール
- **社内データ（マニュアル本文・顧客情報・Excel等）は載せない。** 公開するのは仕組みだけで、社内データは各iPhoneでJSONを取り込む
- アプリは必ずフォルダを分けて横に並べる。Service Workerは各フォルダ内に置き、スコープがほかのアプリにかからないようにする（リポジトリ直下にSWを置かない）
- IndexedDB・localStorageのキー名はアプリごとに接頭辞を分ける（同じドメインで共有されるため）
- 走行距離メモは別リポジトリ（koutsuu-kiroku）のまま。URLを変えるとホーム画面のアプリとデータが引き継げないため移さない
