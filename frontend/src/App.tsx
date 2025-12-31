import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther, parseEventLogs } from "viem";
import { publicClient, getWalletClient } from "./eth";
import {
  LOTTERY_ABI,
  LOTTERY_ADDRESS,
  UI_ADMIN,
  VRF_MOCK_ABI,
  VRF_MOCK_ADDRESS
} from "./contract.ts";

type Addr = `0x${string}`;

const StateLabel: Record<number, string> = {
  0: "OPEN",
  1: "CALCULATING"
};

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function App() {
  const [account, setAccount] = useState<Addr | null>(null);
  const [walletBal, setWalletBal] = useState("0");

  const [players, setPlayers] = useState<Addr[]>([]);
  const [totalEth, setTotalEth] = useState("0");
  const [recentWinner, setRecentWinner] = useState<Addr | null>(null);
  const [lotteryState, setLotteryState] = useState<number>(0);

  const [lastRequestId, setLastRequestId] = useState<bigint | null>(null);
  const [status, setStatus] = useState<string>("");

  const isAdminUI = useMemo(() => {
    if (!account) return false;
    if (!UI_ADMIN || (UI_ADMIN as string).includes("YOUR_ADMIN")) return true; // chưa set admin thì cho bấm
    return account.toLowerCase() === (UI_ADMIN as string).toLowerCase();
  }, [account]);

  async function connect() {
    try {
      const wc = getWalletClient();
      const [addr] = await wc.requestAddresses();
      setAccount(addr as Addr);
      setStatus("Connected ✅");
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "Connect lỗi");
    }
  }

  async function refresh() {
    try {
      // debug nhanh: address có bytecode không
      const code = await publicClient.getBytecode({ address: LOTTERY_ADDRESS });
      if (!code || code === "0x") {
        setStatus("❌ LOTTERY_ADDRESS không có contract trên network hiện tại (sai chain hoặc sai address).");
        return;
      }

      if (account) {
        const b = await publicClient.getBalance({ address: account });
        setWalletBal(formatEther(b));
      }

      const ps = await publicClient.readContract({
        address: LOTTERY_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: "getPlayers"
      });
      setPlayers(ps as Addr[]);

      const t = await publicClient.readContract({
        address: LOTTERY_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: "getTotalEth"
      });
      setTotalEth(formatEther(t as bigint));

      const w = await publicClient.readContract({
        address: LOTTERY_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: "getRecentWinner"
      });
      const wAddr = w as Addr;
      setRecentWinner(wAddr === "0x0000000000000000000000000000000000000000" ? null : wAddr);

      const s = await publicClient.readContract({
        address: LOTTERY_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: "getLotteryState"
      });
      setLotteryState(Number(s));
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "Refresh lỗi (check address/ABI)");
    }
  }

  async function playNow() {
    try {
      if (!account) return setStatus("Hãy connect MetaMask trước.");
      const wc = getWalletClient();

      setStatus("Đang gửi 0.01 ETH...");
      const hash = await wc.writeContract({
        address: LOTTERY_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: "enter",
        account,
        value: parseEther("0.01")
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setStatus("✅ Đã tham gia lottery");
      await refresh();
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "Enter lỗi");
    }
  }

  async function pickWinner() {
    try {
      if (!account) return setStatus("Hãy connect MetaMask trước.");
      const wc = getWalletClient();

      setStatus("Đang request randomness (pickWinner)...");
      const hash = await wc.writeContract({
        address: LOTTERY_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: "pickWinner",
        account
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // đọc requestId từ event RandomnessRequested
      const logs = parseEventLogs({
        abi: LOTTERY_ABI,
        logs: receipt.logs
      });

      const reqLog = logs.find((l) => l.eventName === "RandomnessRequested");
      const reqId = (reqLog?.args as any)?.requestId as bigint | undefined;

      if (reqId !== undefined) {
        setLastRequestId(reqId);
        setStatus(`✅ Requested. requestId = ${reqId.toString()}`);
      } else {
        setStatus("✅ Requested. (Không đọc được requestId từ logs)");
      }

      await refresh();
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "pickWinner lỗi");
    }
  }

  async function fulfillVRF() {
    try {
      if (!account) return setStatus("Hãy connect MetaMask trước.");
      if (!lastRequestId) return setStatus("Chưa có requestId. Hãy bấm Pick Winner trước.");

      const wc = getWalletClient();

      setStatus("Đang fulfill VRF (mock)...");
      const hash = await wc.writeContract({
        address: VRF_MOCK_ADDRESS,
        abi: VRF_MOCK_ABI,
        functionName: "fulfillRandomWords",
        args: [lastRequestId, LOTTERY_ADDRESS],
        account
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setStatus("🎉 Fulfill xong! Đã chọn winner và trả thưởng.");
      setLastRequestId(null);
      await refresh();
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "fulfillRandomWords lỗi (check VRF_MOCK_ADDRESS)");
    }
  }

  useEffect(() => {
  // Khi có người enter -> refresh
  const unwatchEnter = publicClient.watchContractEvent({
    address: LOTTERY_ADDRESS,
    abi: LOTTERY_ABI,
    eventName: "PlayerEntered", // đổi đúng tên event của bạn
    onLogs: () => refresh()
  });

  // Khi pick winner/request -> refresh
  const unwatchReq = publicClient.watchContractEvent({
    address: LOTTERY_ADDRESS,
    abi: LOTTERY_ABI,
    eventName: "RandomnessRequested",
    onLogs: (logs) => {
      // nếu muốn lấy requestId trực tiếp từ event:
      const reqId = (logs?.[0] as any)?.args?.requestId as bigint | undefined;
      if (reqId !== undefined) setLastRequestId(reqId);
      refresh();
    }
  });

  // Khi winner được chọn -> refresh
  const unwatchWin = publicClient.watchContractEvent({
    address: LOTTERY_ADDRESS,
    abi: LOTTERY_ABI,
    eventName: "WinnerPicked", // đổi đúng tên event của bạn
    onLogs: () => refresh()
  });

  return () => {
    unwatchEnter?.();
    unwatchReq?.();
    unwatchWin?.();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [account]);


  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Ether Lottery</h1>

      <div style={styles.content}>
        {/* MetaMask line (giống ảnh: góc phải/nhỏ) */}
        <div style={styles.topRow}>
          <div style={styles.walletPill}>
            <div style={{ fontSize: 12, color: "#666" }}>
              {account ? "Connected" : "Not connected"}
            </div>
            <div style={{ fontWeight: 700 }}>
              {account ? short(account) : "-"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {account ? `${Number(walletBal).toFixed(4)} ETH` : ""}
            </div>
          </div>

          <button style={styles.smallBtn} onClick={connect}>
            {account ? "Connected" : "Connect"}
          </button>
        </div>

        <div style={{ marginTop: 10, color: "#666" }}>
          Enter the lottery by sending <b>0.01 Ether</b>
        </div>

        <div style={{ marginTop: 14 }}>
          <button style={styles.playBtn} onClick={playNow}>
            Play now
          </button>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontWeight: 700, color: "#222" }}>Admin only: Pick winner</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button
              style={{
                ...styles.pickBtn,
                ...(isAdminUI ? {} : styles.pickBtnDisabled)
              }}
              onClick={pickWinner}
              disabled={!isAdminUI}
              title={!isAdminUI ? "Bạn không phải admin (UI)" : ""}
            >
              Pick Winner
            </button>

            <button style={styles.fulfillBtn} onClick={fulfillVRF}>
              Fulfill VRF (mock)
            </button>
          </div>
        </div>

        {/* Info list giống ảnh */}
        <div style={styles.infoBox}>
          <InfoRow label="State" value={StateLabel[lotteryState] ?? String(lotteryState)} />
          <InfoRow label="Players" value={String(players.length)} />
          <InfoRow label="Total ETH" value={`${Number(totalEth).toFixed(4)} ETH`} />
          <InfoRow label="Recent winner" value={recentWinner ? short(recentWinner) : "-"} />
          <InfoRow label="Last requestId" value={lastRequestId ? lastRequestId.toString() : "-"} />
        </div>

        <div style={styles.status}>{status}</div>

        <div style={{ marginTop: 10 }}>
          <button style={styles.smallBtn} onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoRow}>
      <div style={{ color: "#333" }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

/** Inline styles để bạn khỏi phải sửa CSS nhiều */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    color: "#111",
    padding: "26px 16px",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
  },
  title: {
    fontSize: 56,
    fontWeight: 800,
    margin: "18px auto 18px",
    maxWidth: 720
  },
  content: {
    maxWidth: 720,
    margin: "0 auto"
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center"
  },
  walletPill: {
    border: "1px solid #eee",
    borderRadius: 10,
    padding: "10px 12px",
    minWidth: 220
  },
  smallBtn: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700
  },
  playBtn: {
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #d8d8d8",
    background: "#eef4ff",
    color: "#2a59ff",
    cursor: "pointer",
    fontWeight: 800,
    width: 160
  },
  pickBtn: {
    padding: "14px 16px",
    borderRadius: 8,
    border: "1px solid #cfe9da",
    background: "#e9fff2",
    color: "#1b8a4b",
    cursor: "pointer",
    fontWeight: 800,
    width: 180
  },
  pickBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  },
  fulfillBtn: {
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #e7e7e7",
    background: "#fafafa",
    color: "#333",
    cursor: "pointer",
    fontWeight: 700
  },
  infoBox: {
    marginTop: 18,
    borderTop: "1px solid #eee",
    paddingTop: 12
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f2f2f2"
  },
  status: {
    marginTop: 14,
    minHeight: 22,
    color: "#333"
  }
};
