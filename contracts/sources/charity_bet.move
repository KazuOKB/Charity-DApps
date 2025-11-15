module charity_bet::charity_bet {
    use sui::sui::SUI;
    use sui::coin::{Self as coin, Coin};
    use sui::balance::{Self as balance, Balance};
    use sui::object::{Self as object, UID, ID};
    use sui::tx_context::{Self as tx_context, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::clock::{Self as clock, Clock};

    // NFT をウォレット表示するための Display 用
    use sui::display;
    use sui::package;

    // String
    use std::string::{Self as string, String};

    /// エラーコード
    const E_NOT_ADMIN: u64 = 1;
    const E_ALREADY_SETTLED: u64 = 2;
    const E_DEADLINE_NOT_REACHED: u64 = 3;
    const E_INVALID_SIDE: u64 = 4;

    /// NFT 用の画像 URL
    /// とりあえず今わかっている Walrus の URL を両方に入れてあります。
    /// あとで別々の URL に変えたければ、この 2 行だけ書き換えれば OK です。
    const IMAGE_URL_A: vector<u8> = b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-object-id/0x62aec7955c529cda055f3d8e90b23c7da09e8e00e9a9d41ffe16923a825322af";
    const IMAGE_URL_B: vector<u8> = b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-object-id/0x4dfaec5d59d3ab620ba1cf0d28771fa69f352bf4026907042cc71a3b8b9cd570";

    /// 1試合（1マッチ）に対応する shared object
    public struct CharityBetEvent has key {
        id: UID,

        /// settle 可能なのはこの admin だけ
        admin: address,

        /// 勝者が A のときに寄付するアドレス
        charity_a: address,
        /// 勝者が B のときに寄付するアドレス
        charity_b: address,

        /// A 側に寄付された合計（見せる用のカウンタ）
        total_a: u64,
        /// B 側に寄付された合計
        total_b: u64,

        /// ロックされている SUI の総額（実体）
        vault: Balance<SUI>,

        /// 締切時刻（ミリ秒）
        deadline: u64,

        /// 既に settle 済みかどうか
        is_settled: bool,
        /// 0 = 未確定, 1 = A 勝利, 2 = B 勝利
        winner_side: u8,
    }

    /// 寄付イベント（フロント側で履歴を追いやすくするため）
    public struct Donation has copy, drop {
        event_id: ID,
        donor: address,
        /// 1 = A, 2 = B
        side: u8,
        amount: u64,
    }

    /// settle イベント
    public struct Settled has copy, drop {
        event_id: ID,
        /// 1 = A, 2 = B
        winner_side: u8,
        total_amount: u64,
    }

    /// サポーター NFT
    public struct SupporterNFT has key, store {
        id: UID,
        event_id: ID,
        donor: address,
        /// 1 = A, 2 = B
        side: u8,
        image_url: String,
    }

    /// ★ Display 初期化用の One-Time Witness
    /// モジュール名 charity_bet の大文字版 = CHARITY_BET にする必要がある
    public struct CHARITY_BET has drop {}

    /// ★ パッケージ publish 時に 1 度だけ呼ばれる init。
    /// ここで SupporterNFT 用の Display<SupporterNFT> を作る。
    fun init(otw: CHARITY_BET, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);

        // Display のキー
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
        ];

        // Display の値（テンプレート）
        // {event_id}, {side}, {image_url} は SupporterNFT のフィールドから埋め込まれる
        let values = vector[
            string::utf8(b"ONE Charity Bet Supporter"),
            string::utf8(b"Supporter of event {event_id}, side {side}"),
            string::utf8(b"{image_url}"),
        ];

        let mut display_obj = display::new_with_fields<SupporterNFT>(
            &publisher,
            keys,
            values,
            ctx,
        );
        display::update_version(&mut display_obj);

        let sender = tx_context::sender(ctx);
        transfer::public_transfer(publisher, sender);
        transfer::public_transfer(display_obj, sender);
    }

    /// 新しい試合を作成して shared object 化する。
    /// duration_ms: 現在時刻からどれだけの期間寄付を受け付けるか（ミリ秒）
    public entry fun create_event(
        charity_a: address,
        charity_b: address,
        duration_ms: u64,
        clock_obj: &Clock,
        ctx: &mut TxContext
    ) {
        let now = clock::timestamp_ms(clock_obj);
        let admin_addr = tx_context::sender(ctx);

        let event = CharityBetEvent {
            id: object::new(ctx),
            admin: admin_addr,
            charity_a,
            charity_b,
            total_a: 0,
            total_b: 0,
            vault: balance::zero<SUI>(),
            deadline: now + duration_ms,
            is_settled: false,
            winner_side: 0,
        };

        transfer::share_object(event)
    }

    /// サポーター NFT をミントして寄付者に送る内部関数
    fun mint_nft_for_donor(
        event: &CharityBetEvent,
        side: u8,
        ctx: &mut TxContext
    ) {
        let url_bytes =
            if (side == 1) {
                IMAGE_URL_A
            } else {
                IMAGE_URL_B
            };

        let image_url = string::utf8(url_bytes);
        let donor = tx_context::sender(ctx);
        let event_id = object::uid_to_inner(&event.id);

        let nft = SupporterNFT {
            id: object::new(ctx),
            event_id,
            donor,
            side,
            image_url,
        };

        transfer::transfer(nft, donor)
    }

    /// 内部ヘルパー：A / B どちらかへの寄付共通処理
    fun deposit_internal(
        event: &mut CharityBetEvent,
        side: u8,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        let bal = coin::into_balance(payment);
        balance::join(&mut event.vault, bal);

        // カウンタ更新
        if (side == 1) {
            event.total_a = event.total_a + amount
        } else if (side == 2) {
            event.total_b = event.total_b + amount
        } else {
            abort E_INVALID_SIDE
        };

        // 寄付イベントを emit
        let event_id = object::uid_to_inner(&event.id);
        let donor = tx_context::sender(ctx);
        event::emit(Donation {
            event_id,
            donor,
            side,
            amount,
        });

        // ★ 寄付ごとにサポーター NFT をミント
        mint_nft_for_donor(event, side, ctx)
    }

    /// 「選手 A に寄付する」
    public entry fun donate_for_a(
        event: &mut CharityBetEvent,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        deposit_internal(event, 1, payment, ctx)
    }

    /// 「選手 B に寄付する」
    public entry fun donate_for_b(
        event: &mut CharityBetEvent,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        deposit_internal(event, 2, payment, ctx)
    }

    /// 試合結果が確定したあとに呼ぶ。
    /// winner_side: 1 = A 勝利, 2 = B 勝利
    public entry fun settle(
        event: &mut CharityBetEvent,
        winner_side: u8,
        clock_obj: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        if (sender != event.admin) {
            abort E_NOT_ADMIN
        };

        let now = clock::timestamp_ms(clock_obj);
        if (now < event.deadline) {
            abort E_DEADLINE_NOT_REACHED
        };

        if (event.is_settled) {
            abort E_ALREADY_SETTLED
        };

        if (!(winner_side == 1 || winner_side == 2)) {
            abort E_INVALID_SIDE
        };

        event.is_settled = true;
        event.winner_side = winner_side;

        let payout_bal = balance::withdraw_all(&mut event.vault);
        let total = balance::value(&payout_bal);
        let payout_coin = coin::from_balance(payout_bal, ctx);

        let to_charity =
            if (winner_side == 1) {
                event.charity_a
            } else {
                event.charity_b
            };

        transfer::public_transfer(payout_coin, to_charity);

        let event_id = object::uid_to_inner(&event.id);
        event::emit(Settled {
            event_id,
            winner_side,
            total_amount: total,
        })
    }
}
