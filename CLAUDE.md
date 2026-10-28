# sango-apps で作業する AI へ

- **main は GitHub Pages（本番）。** push した瞬間に現場の iPhone に届く。木村さんに言われた時以外は main に push しない。
- **公開リポジトリ。** 社内のデータ（マニュアル本文・現場名・お客様・人の名前・合言葉）を書かない。テストは作りものだけ（`tests/README.md`）。
- 現場ナビ（`genba-manual/`）を変えたら：`APP_VERSION`・`index.html` の `?v=`・`service-worker.js` の `APP_SHELL` と `CACHE_VERSION`・`ANNOUNCEMENTS` の先頭。
- 「動作チェックして」→ スキル `dousa-check`（`.claude/skills/dousa-check/SKILL.md`）。
- 返事は日本語で、専門用語を使わずに（木村さんはエンジニアではない）。
