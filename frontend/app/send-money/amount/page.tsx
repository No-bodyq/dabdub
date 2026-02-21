import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, Coins, Plus, Minus } from "lucide-react";
import Link from "next/link";

export default function AmountSelection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [recipient, setRecipient] = useState(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [network, setNetwork] = useState("Ethereum");
  const [token, setToken] = useState("ETH");
  const [note, setNote] = useState("");

  useEffect(() => {
    const recipientParam = searchParams.get("recipient");
    if (recipientParam) {
      setRecipient(JSON.parse(decodeURIComponent(recipientParam)));
    }
  }, [searchParams]);

  const isDabDubUser = recipient?.type === "dabdub";
  const isCrypto = recipient?.type === "crypto";

  const quickAmounts = [50, 100, 200, 500];

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const transactionData = {
      recipient,
      amount: parseFloat(amount),
      currency: isDabDubUser ? "USD" : currency,
      network: isCrypto ? network : null,
      token: isCrypto ? token : null,
      note,
    };

    router.push(
      `/send-money/review?data=${encodeURIComponent(JSON.stringify(transactionData))}`,
    );
  };

  if (!recipient) return <div>Loading...</div>;

  return (
    <main className="w-full bg-[#141414] flex flex-col items-center min-h-[100vh]">
      <div className="flex flex-col items-center w-[98%] py-[1rem] gap-[1rem]">
        {/* Header */}
        <div className="w-full flex items-center justify-start">
          <Link href="/send-money/recipient" className="text-white">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-white font-bold text-xl ml-4">Send Money</h1>
        </div>

        {/* Recipient Info */}
        <div className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg p-4">
          <p className="text-gray-400 text-sm">Sending to</p>
          <p className="text-white font-medium">
            {recipient.name || recipient.address || "Unknown"}
          </p>
          {recipient.username && (
            <p className="text-gray-400 text-sm">{recipient.username}</p>
          )}
        </div>

        {/* Currency Selection for Crypto */}
        {isCrypto && (
          <div className="w-full">
            <h2 className="text-white font-bold text-lg mb-4">
              Select Network & Token
            </h2>
            <div className="space-y-4">
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg px-4 py-3 text-white"
              >
                <option value="Ethereum">Ethereum</option>
                <option value="Polygon">Polygon</option>
                <option value="BSC">BSC</option>
              </select>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg px-4 py-3 text-white"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="w-full">
          <h2 className="text-white font-bold text-lg mb-4">Amount</h2>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg px-4 py-6 text-white text-2xl font-bold text-center focus:outline-none focus:border-[#1B7339]"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              {isDabDubUser ? "USD" : token}
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg py-2 text-white font-medium hover:bg-[#FFFFFF24] transition-colors"
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Fees */}
        <div className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-400">Fee</p>
            <p className="text-white font-medium">
              {isDabDubUser ? "Free" : `~$${parseFloat(amount || "0") * 0.01}`}
            </p>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-gray-400">Estimated time</p>
            <p className="text-white font-medium">
              {isDabDubUser ? "Instant" : "~2-5 min"}
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="w-full">
          <h2 className="text-white font-bold text-lg mb-4">Note (Optional)</h2>
          <textarea
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#1B7339] resize-none"
            rows={3}
          />
          <p className="text-gray-400 text-sm mt-1">{note.length}/100</p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full bg-[#1B7339] text-white py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </main>
  );
}
