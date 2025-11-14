import { useState } from "react";

type Match = {
  id: string;
  fighterAName: string;
  fighterBName: string;
  charityAName: string;
  charityBName: string;
  // 寄付先の国
  charityARegion: string;
  charityBRegion: string;
  fighterAImageUrl: string;
  fighterBImageUrl: string;
  totalA: number;
  totalB: number;
};

type Side = "A" | "B";

function App() {
  const [match, setMatch] = useState<Match>({
    id: "demo-001",
    fighterAName: "Goku",
    fighterBName: "Bejita",
    charityAName: "Children's Health Fund",
    charityBName: "Education for All",
    charityARegion: "フィリピン",
    charityBRegion: "タイ",
    fighterAImageUrl: "/fighters/fighter_Goku.png",
    fighterBImageUrl: "/fighters/fighter_Bejita.png",
    totalA: 1.2,
    totalB: 0.8,
  });

  const [side, setSide] = useState<Side | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [winnerSide, setWinnerSide] = useState<Side | null>(null);

  const handleBet = () => {
    // 試合終了後はベットできない
    if (winnerSide) {
      setMessage("この試合はすでに終了しています（デモ）。");
      return;
    }

    if (!side) {
      setMessage("応援する側（ファイター）を選択してください");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setMessage("ベット額を正しく入力してください");
      return;
    }

    // デモ用：ローカルで合計を更新
    const updated: Match = {
      ...match,
      totalA: side === "A" ? match.totalA + numAmount : match.totalA,
      totalB: side === "B" ? match.totalB + numAmount : match.totalB,
    };

    setMatch(updated);
    setMessage("（デモ）ローカルでベット額を反映しました。");
    setAmount("");
    setSide(null);
  };

  const totalSum = match.totalA + match.totalB || 1;
  const ratioA = (match.totalA / totalSum) * 100;
  const percentA = Math.round(ratioA);
  const percentB = 100 - percentA;

  const selectedFighterName =
    side === "A" ? match.fighterAName : side === "B" ? match.fighterBName : null;
  const selectedRegion =
    side === "A" ? match.charityARegion : side === "B" ? match.charityBRegion : null;

  const winner =
    winnerSide === "A"
      ? {
          name: match.fighterAName,
          region: match.charityARegion,
          amount: match.totalA,
        }
      : winnerSide === "B"
      ? {
          name: match.fighterBName,
          region: match.charityBRegion,
          amount: match.totalB,
        }
      : null;

  const handleEndMatchDemo = () => {
    if (winnerSide) return; // すでに終了

    if (match.totalA === 0 && match.totalB === 0) {
      setMessage("まだ寄付が集まっていません。");
      return;
    }

    const winner: Side = match.totalA >= match.totalB ? "A" : "B";
    setWinnerSide(winner);
    const winnerName = winner === "A" ? match.fighterAName : match.fighterBName;
    setMessage(`（デモ）試合を終了しました。勝者は ${winnerName} です。`);
  };

  return (
    <div className="app-root">
      <div className="app-container">
        {/* ヒーロー */}
        <header className="hero">
          <div>
            <h1 className="hero-title">ONE Charity Bet</h1>
            <p className="hero-subtitle">
              あなたのベットが、ファイターへの応援と社会貢献を同時に実現します。
            </p>
          </div>
          <div className="hero-tag">LIVE CHARITY ENGAGEMENT</div>
        </header>

        {/* メッセージ */}
        {message && <div className="message">{message}</div>}

        {/* マッチカード */}
        <section className="match-section">
          <div className="match-header">
            <span className="match-label">CURRENT BOUT</span>
            <span className="match-id">Match ID: {match.id}</span>
          </div>

          <div className="match-card">
            {/* 左側ファイター */}
            <div
              className={
                "fighter-column " +
                (side === "A" ? "fighter-column-selected" : "")
              }
            >
              <div className="fighter-avatar">
                <img src={match.fighterAImageUrl} alt={match.fighterAName} />
              </div>
              <div className="fighter-name">{match.fighterAName}</div>

              <div className="charity-region">
                寄付先の国：{match.charityARegion}
              </div>
              <div className="charity-name">{match.charityAName}</div>
              <div className="total-amount">
                合計 {match.totalA.toFixed(2)} SUI
              </div>

              <button
                className={`side-button ${
                  side === "A" ? "side-button-active" : ""
                }`}
                onClick={() => setSide("A")}
              >
                このファイターを選ぶ
              </button>
            </div>

            {/* VS */}
            <div className="vs-column">
              <span className="vs-text">VS</span>
            </div>

            {/* 右側ファイター */}
            <div
              className={
                "fighter-column " +
                (side === "B" ? "fighter-column-selected" : "")
              }
            >
              <div className="fighter-avatar">
                <img src={match.fighterBImageUrl} alt={match.fighterBName} />
              </div>
              <div className="fighter-name">{match.fighterBName}</div>

              <div className="charity-region">
                寄付先の国：{match.charityBRegion}
              </div>
              <div className="charity-name">{match.charityBName}</div>
              <div className="total-amount">
                合計 {match.totalB.toFixed(2)} SUI
              </div>

              <button
                className={`side-button ${
                  side === "B" ? "side-button-active" : ""
                }`}
                onClick={() => setSide("B")}
              >
                このファイターを選ぶ
              </button>
            </div>
          </div>

          {/* 円グラフ（CSS は 240px に調整済みのものをそのまま使う） */}
          <div className="totals-donut-area">
            <div className="totals-donut-wrapper">
              <div
                className="totals-donut"
                style={{
                  background: `conic-gradient(var(--accent-red) 0 ${percentA}%, var(--accent-blue) ${percentA}% 100%)`,
                }}
              >
                <div className="totals-donut-center">
                  <div className="totals-donut-total">
                    {(match.totalA + match.totalB).toFixed(2)} SUI
                  </div>
                  <div className="totals-donut-label">TOTAL</div>
                </div>
              </div>

              <div className="totals-donut-legend">
                <div className="totals-donut-legend-item">
                  <span className="totals-donut-swatch totals-donut-swatch-a" />
                  <span>
                    {match.fighterAName}: {percentA}%<br />
                    寄付先の国：{match.charityARegion}
                  </span>
                </div>
                <div className="totals-donut-legend-item">
                  <span className="totals-donut-swatch totals-donut-swatch-b" />
                  <span>
                    {match.fighterBName}: {percentB}%<br />
                    寄付先の国：{match.charityBRegion}
                  </span>
                </div>
              </div>

              <div className="end-match-row">
                <button
                  className="secondary-button"
                  onClick={handleEndMatchDemo}
                  disabled={!!winnerSide}
                >
                  試合を終了して結果を見る（デモ）
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 結果表示（デモ） */}
        {winner && (
          <section className="result-section">
            <div className="result-banner">
              <div className="result-main">
                <div className="result-label">RESULT (DEMO)</div>
                <div className="result-winner-title">勝者</div>
                <div className="result-winner-name">{winner.name}</div>
                <div className="result-winner-region">
                  寄付先の国：{winner.region}
                </div>
              </div>
              <div className="result-totals">
                <div className="result-totals-title">寄付合計</div>
                <div className="result-totals-row">
                  <span>{match.charityARegion}</span>
                  <span>{match.totalA.toFixed(2)} SUI</span>
                </div>
                <div className="result-totals-row">
                  <span>{match.charityBRegion}</span>
                  <span>{match.totalB.toFixed(2)} SUI</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ベットフォーム */}
        <section className="bet-section">
          <h2 className="section-title">チャリティにベットする</h2>
          <p className="section-caption">
            応援するファイターを選び、ベットしたい SUI の額を入力してください。
          </p>

          {/* 選択中のファイター表示 */}
          <div className="selected-summary">
            <span className="selected-label">選択中のファイター：</span>
            {selectedFighterName ? (
              <>
                <span className="selected-name">{selectedFighterName}</span>
                {selectedRegion && (
                  <span className="selected-region">
                    （寄付先の国：{selectedRegion}）
                  </span>
                )}
              </>
            ) : (
              <span className="selected-none">まだ選択されていません</span>
            )}
          </div>

          <div className="form-row">
            <label className="input-label">
              ベット額（SUI）
              <input
                type="number"
                className="input"
                min={0}
                step={0.1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="例: 0.5"
              />
            </label>
          </div>

          <button
            className="primary-button"
            onClick={handleBet}
            disabled={!side || !!winnerSide}
          >
            チャリティにベットする
          </button>
        </section>
      </div>
    </div>
  );
}

export default App;
