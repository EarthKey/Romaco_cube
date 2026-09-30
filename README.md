# Romaco Cube

罵尻ロマ子ひとりを6つの画風で描く、3×3のキューブパズル。CryptoNinja Cubeから**パズルの仕組みだけ**を複製した独立プロジェクトです。元ゲームの画像・動画・BGM・Git履歴は含みません。

## 現在地

- 6面の画風: アニメスクリーンキャップ／3D／トラディショナルメディア＋ラインアート／1999年スタイル／ピクセルアート／カートゥーン。
- 難易度は易（採用静止画）・中（採用5秒動画）・難（仮タイル）の3段階。中は6面を無音で繰り返し再生し、動画を読めない場合や動きを抑える設定では静止画を表示する。
- 3×3の回転・混ぜる回数・1面または6面完成の判定は元ゲームから継承。成人向けの難しさは6面の画風設計で詰める。混ぜる手数や操作ルールの変更は未確定。
- 採用素材の正本は `D:\AIillust\NonoshiriRomaco\Game`。LoRAや学習画像はこのリポジトリに置かない。

## UIデザイン

画面左の青から右の赤へつながるグラデーションと、VTuber風の2.5Dボタン・パネル。ネオン／ナイト表示に対応。スタイルは `src/romaco-arcade.css`。

## 起動と検証

Node.jsの依存パッケージを用意した後、`npm run dev` で `http://127.0.0.1:5174/` に起動。`npm test` と `npm run build` で検証。GitHub: https://github.com/EarthKey/Romaco_cube。公開先はCloudflare Workers（GitHubのmainと接続）。

## 素材の入れ方

`public/romaco/easy/face-1.png`〜`face-6.png` が易と中の静止画、`public/romaco/medium/face-1.mp4`〜`face-6.mp4` が中の動画。面3だけv1、残り5面はv2を採用した。「難」はまだ仮タイルで、素材は別途採用後に配線する。
