import { useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { buildBetTx, type Side } from "./lib/buildBetTx";

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

function App() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const [match, setMatch] = useState<Match>({
    id: "demo-001",
    fighterAName: "Goku",
    fighterBName: "Bejita",
    charityAName: "Children's Health Fund",
    charityBName: "Education for All",
    charityARegion: "Japan",
    charityBRegion: "Thailand",
    fighterAImageUrl: "/fighters/fighter_Goku.png",
    fighterBImageUrl: "/fighters/fighter_Bejita.png",
    totalA: 1.2,
    totalB: 0.8,
  });

  const [side, setSide] = useState<Side | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [winnerSide, setWinnerSide] = useState<Side | null>(null);

  const [lastDigest, setLastDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleBet = async () => {
    setError(null);

    // 試合終了後はベットできない
    if (winnerSide) {
      setMessage("This match has already ended (demo).");
      return;
    }

    if (!side) {
      setMessage("Please select which fighter you want to support.");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setMessage("Please enter a valid bet amount.");
      return;
    }

    if (!currentAccount) {
      setMessage(
        "Please connect your wallet (use the Connect Wallet button at the top right).",
      );
      return;
    }

    try {
      setIsSending(true);
      setMessage("Sending transaction...");

      // 1. Tx を組み立てる（Move の bet 関数呼び出し）
      const tx = buildBetTx({
        side,
        amountSui: numAmount,
      });

      // 2. ウォレットに署名・実行してもらう
      const result = await signAndExecuteTransaction({
        transaction: tx,
        // chain は省略 → main.tsx の SuiClientProvider 設定に従う
      });

      console.log("executed transaction:", result);
      setLastDigest(result.digest);

      // 3. フロント側の表示も更新（ここはデモとしてローカル加算）
      setMatch((prev) => ({
        ...prev,
        totalA: side === "A" ? prev.totalA + numAmount : prev.totalA,
        totalB: side === "B" ? prev.totalB + numAmount : prev.totalB,
      }));

      setMessage("Your bet has been sent on-chain!");
      setAmount("");
      setSide(null);
    } catch (e: unknown) {
      console.error(e);
      const errMessage =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : String(e);
      setError(errMessage);
      setMessage("Failed to send transaction.");
    } finally {
      setIsSending(false);
    }
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
      setMessage("No donations have been collected yet.");
      return;
    }

    const w: Side = match.totalA >= match.totalB ? "A" : "B";
    setWinnerSide(w);
    const winnerName = w === "A" ? match.fighterAName : match.fighterBName;
    setMessage(`(Demo) The match has ended. The winner is ${winnerName}.`);
  };

  return (
    <div className="app-root">
      <div className="app-container">
        {/* Hero */}
        <header className="hero">
          <div>
            <h1 className="hero-title">ONE CHARITY BET</h1>
            <p className="hero-subtitle">
              Your bet powers both your favorite fighter and real-world impact.
            </p>
          </div>
          <div className="hero-right">
            <div className="hero-tag">LIVE CHARITY ENGAGEMENT</div>
            <ConnectButton />
          </div>
        </header>

        {/* Message & Tx info */}
        {message && <div className="message">{message}</div>}
        {error && <div className="message error">Error: {error}</div>}
        {lastDigest && (
          <div className="message tx-digest">
            Tx digest: <code>{lastDigest}</code>
          </div>
        )}

        {/* Match + Bet + Donut */}
        <section className="match-section">
          <div className="match-header">
            <span className="match-label">CURRENT BOUT</span>
            <span className="match-id">Match ID: {match.id}</span>
          </div>

          <div className="match-card">
            {/* Left fighter */}
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
                Charity region: {match.charityARegion}
              </div>
              <div className="charity-name">{match.charityAName}</div>
              <div className="total-amount">
                Total {match.totalA.toFixed(2)} SUI
              </div>

              <button
                className={`side-button ${
                  side === "A" ? "side-button-active" : ""
                }`}
                onClick={() => setSide("A")}
              >
                Cheer for this fighter
              </button>
            </div>

            {/* VS */}
            <div className="vs-column">
              <div className="vs-badge">
                <span className="vs-icon-left">⚔️</span>
                <span className="vs-text">VS</span>
                <span className="vs-icon-right">⚔️</span>
              </div>
              <div className="vs-subtext">Place your bet.</div>
            </div>

            {/* Right fighter */}
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
                Charity region: {match.charityBRegion}
              </div>
              <div className="charity-name">{match.charityBName}</div>
              <div className="total-amount">
                Total {match.totalB.toFixed(2)} SUI
              </div>

              <button
                className={`side-button ${
                  side === "B" ? "side-button-active" : ""
                }`}
                onClick={() => setSide("B")}
              >
                Cheer for this fighter
              </button>
            </div>
          </div>

          {/* ▼ Bet board */}
          <div className="bet-board">
            <h2 className="section-title">Place your charity bet</h2>
            <p className="section-caption">
              Choose the fighter you support and enter the amount of SUI you want to bet.
            </p>

            <div className="selected-summary">
              <span className="selected-label">Selected fighter: </span>
              {selectedFighterName ? (
                <>
                  <span className="selected-name">{selectedFighterName}</span>
                  {selectedRegion && (
                    <span className="selected-region">
                      {" "}
                      (Charity region: {selectedRegion})
                    </span>
                  )}
                </>
              ) : (
                <span className="selected-none">No fighter selected yet</span>
              )}
            </div>

            <div className="form-row">
              <label className="input-label">
                Bet amount (SUI)
                <input
                  type="number"
                  className="input"
                  min={0}
                  step={0.1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 0.5"
                />
              </label>
            </div>

            <button
              className="primary-button"
              onClick={handleBet}
              disabled={!side || !!winnerSide || isSending}
            >
              {isSending ? "Sending..." : "Place bet for charity"}
            </button>
          </div>

          {/* ▼ Donut chart */}
          <div className="totals-donut-area">
            <div className="totals-donut-wrapper">
              <div
                className="totals-donut"
                style={{
                  // A = blue（accent-blue）, B = red（accent-red）
                  background: `conic-gradient(var(--accent-red) 0 ${percentB}%, var(--accent-blue) ${percentB}% 100%)`,
                }}
              >
                <div className="totals-donut-center">
                  <div className="totals-donut-total">
                    {(match.totalA + match.totalB).toFixed(2)} SUI
                  </div>
                  <div className="totals-donut-label">TOTAL</div>
                </div>
              </div>

              {/* Legend */}
              <div className="totals-donut-legend">
                {/* A */}
                <div className="totals-donut-legend-item">
                  <span className="totals-donut-swatch totals-donut-swatch-a" />
                  <span>
                    {match.fighterAName}: {match.totalA.toFixed(2)} SUI ({percentA}
                    %)
                    <br />
                    Charity region: {match.charityARegion}
                  </span>
                </div>
                {/* B */}
                <div className="totals-donut-legend-item">
                  <span className="totals-donut-swatch totals-donut-swatch-b" />
                  <span>
                    {match.fighterBName}: {match.totalB.toFixed(2)} SUI ({percentB}
                    %)
                    <br />
                    Charity region: {match.charityBRegion}
                  </span>
                </div>
              </div>

              <div className="end-match-row">
                <button
                  className="secondary-button"
                  onClick={handleEndMatchDemo}
                  disabled={!!winnerSide}
                >
                  End match and show result (demo)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Result (demo) */}
        {winner && (
          <section className="result-section">
            <div className="result-banner">
              <div className="result-main">
                <div className="result-label">RESULT (DEMO)</div>
                <div className="result-winner-title">Winner</div>
                <div className="result-winner-name">{winner.name}</div>
                <div className="result-winner-region">
                  Charity region: {winner.region}
                </div>
              </div>
              <div className="result-totals">
                <div className="result-totals-title">Total donations</div>
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
      </div>
    </div>
  );
}

export default App;
