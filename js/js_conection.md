# モジュール依存関係ドキュメント

## 概要

このドキュメントは、「画像マッチゲーム＋アイテム」のソースコードにおけるモジュール間の依存関係を解説するものです。各モジュールがどのような役割を持ち、どのモジュールと連携して動作するのかを明確にすることで、コードの理解、保守、拡張を容易にすることを目的とします。

## ファイル構成
.
├── index.html         # ゲームのメインHTMLファイル
├── style.css          # スタイルシート
├── js/
│   ├── main.js        # (起点) アプリケーションのエントリーポイント
│   ├── config.js      # ゲーム全体の設定値
│   ├── dom.js         # DOM要素の参照
│   ├── gameState.js   # ゲーム状態の管理
│   ├── storage.js     # localStorageへのデータ保存・読込
│   ├── ui.js          # UIの描画・更新
│   ├── effects.js     # (追加) 演出効果の専門モジュール
│   ├── utils.js       # 汎用的な補助関数
│   ├── input.js       # ユーザー入力の処理
│   ├── gameFlow.js    # ゲーム全体の流れ（開始・終了）
│   └── gameLogic.js   # ゲームのコアロジック（マッチ判定など）
└── img/
    ├── 1.png
    ├── ... (ゲームに使用する画像)

## モジュール依存関係図

以下の図は、各JavaScriptモジュール間の依存関係（import の流れ）を示しています。矢印は「依存する側」から「依存される側」へ向かっています。

```mermaid
graph TD
    subgraph "エントリーポイント"
        main
    end

    subgraph "ユーザーインタラクション"
        input
    end

    subgraph "ゲームフロー制御"
        gameFlow
    end

    subgraph "コアロジック"
        gameLogic
    end

    subgraph "UI/ビュー"
        ui
        effects %% <-- [変更] effectsモジュールを追加
    end

    subgraph "ユーティリティ"
        utils
    end
    
    subgraph "状態管理"
        gameState
        storage
    end

    subgraph "基盤/設定"
        dom
        config
    end

    %% --- 依存関係の定義 ---
    main --> input
    main --> gameFlow
    main --> ui
    main --> storage
    main --> dom
    main --> gameState

    input --> gameLogic
    input --> utils
    input --> dom
    input --> config

    gameFlow --> gameLogic
    gameFlow --> ui
    gameFlow --> storage
    gameFlow --> gameState
    gameFlow --> dom
    gameFlow --> config

    gameLogic --> utils
    gameLogic --> ui
    gameLogic --> gameState
    gameLogic --> dom
    gameLogic --> config

    storage --> gameState
    storage --> dom
    storage --> config

    gameState --> config
    
    ui --> dom
    ui --> config
    ui --> gameState
    ui --> effects %% <-- [変更] uiからeffectsへの依存を追加

    effects --> dom %% <-- [変更] effectsからdomへの依存を追加
    effects --> config %% <-- [変更] effectsからconfigへの依存を追加

    utils --> gameState
    utils --> config
    
    %% --- 循環参照 ---
    utils --> ui

    %% --- スタイリング ---
    linkStyle 33 stroke:#ff4d4d,stroke-width:2px,stroke-dasharray: 5 5; %% utils -> ui の循環参照を強調
    classDef base fill:#f9f,stroke:#333,stroke-width:2px;
    classDef state fill:#bbf,stroke:#333,stroke-width:2px;
    classDef logic fill:#fb9,stroke:#333,stroke-width:2px;
    classDef interaction fill:#9fb,stroke:#333,stroke-width:2px;
    classDef view fill:#9ff,stroke:#333,stroke-width:2px;
    
    class main,input,gameFlow,gameLogic,ui,utils,gameState,storage,dom,config,effects default;
    class dom,config base;
    class gameState,storage state;
    class gameLogic logic;
    class input,gameFlow interaction;
    class ui,utils,effects view; %% <-- [変更] effectsをviewグループに追加