// =============================================================================
// Sui dApp Kit - React Hooks for Sui Blockchain Interaction
// =============================================================================
// Sui公式が提供するdApp開発用のReact Hooksライブラリ
// 公式ドキュメント: https://sdk.mystenlabs.com/dapp-kit
import {
    // 接続中のウォレットアカウント情報を取得
    useCurrentAccount,
    // トランザクションに署名してSuiネットワークに送信
    useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";

// =============================================================================
// Sui Transaction Builder
// =============================================================================
// Suiブロックチェーン上で実行される操作（トランザクション）を構築するクラス
// 公式ドキュメント: https://sdk.mystenlabs.com/typescript/transaction-building/basics
import { Transaction } from "@mysten/sui/transactions";

// =============================================================================
// UI Components (Radix UI)
// =============================================================================
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";

// =============================================================================
// React Hooks
// =============================================================================
import { useState } from "react";

/**
 * MintButton コンポーネント
 *
 * NFTをmintするためのボタンとUI状態管理を提供します。
 * このコンポーネントは以下の機能を持ちます：
 * 1. 環境変数からスマートコントラクト情報を読み込み
 * 2. トランザクションを構築
 * 3. ウォレットで署名してSuiネットワークに送信
 * 4. 実行結果の表示（成功時はdigest、失敗時はエラーメッセージ）
 */
export function MintButton() {
    // ===========================================================================
    // Sui dApp Kit Hooks
    // ===========================================================================

    // 【Hook 1】現在接続されているウォレットアカウント情報を取得
    // - ウォレット未接続の場合: null
    // - ウォレット接続済みの場合: { address, publicKey, chains, features } などの情報
    const account = useCurrentAccount();

    // 【Hook 2】トランザクション実行用のHook
    // - mutate: トランザクションを実行する関数（signAndExecuteTransactionという名前で使用）
    // - isPending: トランザクション実行中かどうかを示すフラグ
    const { mutate: signAndExecuteTransaction, isPending } =
        useSignAndExecuteTransaction();

    // ===========================================================================
    // ローカル状態管理（React useState）
    // ===========================================================================

    // トランザクション成功時のdigest（トランザクションの一意な識別子・ハッシュ値）を保存
    // digestを使ってSuiscanなどのエクスプローラーでトランザクション詳細を確認できます
    const [digest, setDigest] = useState<string>("");

    // トランザクション失敗時のエラーメッセージを保存
    const [error, setError] = useState<string>("");

    // ===========================================================================
    // 環境変数の読み込み
    // ===========================================================================
    // 【重要】Viteの環境変数システム
    // - Viteでは環境変数に `VITE_` プレフィックスが必要です
    // - import.meta.env 経由でアクセスします
    // - .envファイルに設定した値がここで読み込まれます
    //
    // 設定例（.envファイル）:
    // VITE_PACKAGE_ID=0x1234...
    // VITE_MODULE_NAME=nft
    // VITE_FUNCTION_NAME=mint

    // スマートコントラクトが配置されているパッケージのID（0xから始まる64文字のアドレス）
    const packageId = import.meta.env.VITE_PACKAGE_ID;

    // 呼び出すMoveモジュールの名前
    const moduleName = import.meta.env.VITE_MODULE_NAME;

    // モジュール内の実行する関数名
    const functionName = import.meta.env.VITE_FUNCTION_NAME;

    // 接続先ネットワーク（mainnet/testnet/devnet）
    // Suiscanリンクで使用するネットワーク名
    const network = import.meta.env.VITE_NETWORK || "testnet";

    // ===========================================================================
    // 環境変数のバリデーション
    // ===========================================================================
    // 環境変数が正しく設定されているかをチェック
    // - 全ての値が存在すること
    // - packageIdがダミー値（0x0000...）でないこと
    const isConfigured =
        packageId &&
        moduleName &&
        functionName &&
        packageId !==
            "0x0000000000000000000000000000000000000000000000000000000000000000";

    // ===========================================================================
    // Mint実行ハンドラー
    // ===========================================================================
    const handleMint = () => {
        // 前回の実行結果をクリア
        setError("");
        setDigest("");

        try {
            // -----------------------------------------------------------------------
            // ステップ1: トランザクションの構築
            // -----------------------------------------------------------------------
            // 【重要】Transaction クラス
            // Suiブロックチェーン上で実行される操作を構築します
            // 公式ドキュメント: https://sdk.mystenlabs.com/typescript/transaction-building/basics
            const tx = new Transaction();

            // -----------------------------------------------------------------------
            // ステップ2: Move関数の呼び出しを追加
            // -----------------------------------------------------------------------
            // 【重要】moveCall() メソッド
            // スマートコントラクト（Move言語で書かれた関数）を呼び出します
            //
            // パラメータ:
            // - target: "パッケージID::モジュール名::関数名" の形式で指定
            //   例: "0x2::devnet_nft::mint"
            //
            // - arguments: 関数に渡す引数の配列
            //   引数の型に応じて適切なメソッドを使用します：
            //   - tx.pure.string("text")  : 文字列
            //   - tx.pure.u64(123)        : 64bit符号なし整数
            //   - tx.pure.bool(true)      : 真偽値
            //   - tx.object("0x...")      : オブジェクト参照
            //
            // 例: 3つの文字列引数を渡す場合
            // arguments: [
            //   tx.pure.string("NFT Name"),
            //   tx.pure.string("NFT Description"),
            //   tx.pure.string("https://example.com/image.png")
            // ]
            tx.moveCall({
                target: `${packageId}::${moduleName}::${functionName}`,
                arguments: [
                    tx.pure.string("Build on Sui NFT"),
                    tx.pure.string("NFT created at Build on Sui at Chapter 4"),
                    tx.pure.string(
                        "https://www.1-firststep.com/wp-content/uploads/2016/12/unko-lime.png",
                    ),
                ],
            });

            // -----------------------------------------------------------------------
            // ステップ3: トランザクションに署名して実行
            // -----------------------------------------------------------------------
            // 【重要】signAndExecuteTransaction 関数
            // 1. ユーザーのウォレットでトランザクションに署名を求める
            // 2. 署名後、Suiネットワークにトランザクションを送信
            // 3. トランザクションの実行完了を待つ
            //
            // 戻り値（onSuccessで受け取る）:
            // - digest: トランザクションの一意な識別子（ハッシュ値）
            // - effects: トランザクションの実行結果
            //
            // 公式ドキュメント: https://sdk.mystenlabs.com/dapp-kit/wallet-hooks/useSignAndExecuteTransaction
            signAndExecuteTransaction(
                {
                    transaction: tx,
                },
                {
                    // 成功時のコールバック
                    // result には { digest, effects } が含まれます
                    onSuccess: (result) => {
                        console.log("Transaction successful:", result);
                        // digestを保存してUIに表示
                        setDigest(result.digest);
                        setError("");
                    },

                    // 失敗時のコールバック
                    // ユーザーが署名を拒否した場合やネットワークエラーなどで呼ばれます
                    onError: (err) => {
                        console.error("Transaction failed:", err);
                        setError(err.message || "Transaction failed");
                        setDigest("");
                    },
                },
            );
        } catch (err) {
            // トランザクション構築時のエラーをキャッチ
            console.error("Error building transaction:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Error building transaction",
            );
        }
    };

    // ===========================================================================
    // ボタンの無効化条件
    // ===========================================================================
    // 以下のいずれかに該当する場合、Mintボタンを無効化します：
    // 1. ウォレットが接続されていない（account が null）
    // 2. 環境変数が正しく設定されていない（isConfigured が false）
    // 3. トランザクション実行中（isPending が true）
    const isDisabled = !account || !isConfigured || isPending;

    // ===========================================================================
    // UIレンダリング
    // ===========================================================================
    return (
        <Container my="2">
            <Heading mb="2">Mint NFT</Heading>

            {/* 環境変数未設定時の警告メッセージ */}
            {!isConfigured && (
                <Flex direction="column" gap="2" mb="2">
                    <Text color="orange">
                        ⚠️ Please configure environment variables in .env file
                    </Text>
                    <Text size="2" color="gray">
                        Set VITE_PACKAGE_ID, VITE_MODULE_NAME, and
                        VITE_FUNCTION_NAME
                    </Text>
                </Flex>
            )}

            <Flex direction="column" gap="2">
                {/* Mintボタン */}
                {/*
                    disabled属性:
                    - ウォレット未接続時
                    - 環境変数未設定時
                    - トランザクション実行中
                    のいずれかでボタンが無効化されます
                */}
                <Button onClick={handleMint} disabled={isDisabled} size="3">
                    {isPending ? "Minting..." : "Mint NFT"}
                </Button>

                {/* ウォレット未接続時のメッセージ */}
                {!account && (
                    <Text size="2" color="gray">
                        Please connect your wallet to mint
                    </Text>
                )}

                {/* トランザクション成功時の表示 */}
                {/* digestが存在する場合のみ表示されます */}
                {digest && (
                    <Flex direction="column" gap="1">
                        <Text color="green" weight="bold">
                            ✅ Mint successful!
                        </Text>
                        {/*
                            トランザクションdigest（ハッシュ値）を表示
                            digestは64文字の16進数文字列です
                        */}
                        <Text size="2" style={{ wordBreak: "break-all" }}>
                            Transaction: {digest}
                        </Text>
                        {/*
                            Suiscanへのリンク
                            Suiscan: Suiブロックチェーンのエクスプローラー
                            トランザクションの詳細情報を確認できます

                            ネットワークは.envファイルのVITE_NETWORKから自動的に設定されます
                        */}
                        <Text size="2">
                            <a
                                href={`https://suiscan.xyz/${network}/tx/${digest}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--accent-9)" }}
                            >
                                View on Suiscan →
                            </a>
                        </Text>
                    </Flex>
                )}

                {/* トランザクション失敗時のエラーメッセージ */}
                {error && (
                    <Text color="red" size="2">
                        ❌ Error: {error}
                    </Text>
                )}
            </Flex>
        </Container>
    );
}
