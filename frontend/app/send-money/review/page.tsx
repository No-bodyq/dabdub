import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Shield,
  Fingerprint,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface TransactionData {
  recipient: any;
  amount: number;
  currency?: string;
  network?: string;
  token?: string;
  note: string;
}

export default function ReviewConfirm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [transactionData, setTransactionData] = useState(null);
  const [pin, setPin] = useState("");
  const [useBiometric, setUseBiometric] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      setTransactionData(JSON.parse(decodeURIComponent(dataParam)));
    }
  }, [searchParams]);

  const handleSend = () => {
    if (!isAuthenticated) return;

    // Simulate sending
    router.push(
      `/send-money/processing?data=${encodeURIComponent(JSON.stringify(transactionData))}`,
    );
  };

  const handleAuthenticate = () => {
    // Mock authentication
    if (useBiometric || pin === "1234") {
      setIsAuthenticated(true);
    }
  };

  if (!transactionData) return <div>Loading...</div>;

  const { recipient, amount, currency, network, token, note } =
    transactionData as any;
  const isDabDubUser = recipient.type === "dabdub";
  const fee = isDabDubUser ? 0 : amount * 0.01;
  const total = amount + fee;

  return (
    <main className="w-full bg-[#141414] flex flex-col items-center min-h-[100vh]">
      <div className="flex flex-col items-center w-[98%] py-[1rem] gap-[1rem]">
        {/* Header */}
        <div className="w-full flex items-center justify-start">
          <Link href="/send-money/amount" className="text-white">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-white font-bold text-xl ml-4">
            Review & Confirm
          </h1>
        </div>

        {/* Summary Card */}
        <div className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg p-6">
          <h2 className="text-white font-bold text-lg mb-4">
            Transaction Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Recipient</span>
              <span className="text-white">
                {recipient.name || recipient.address}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount</span>
              <span className="text-white">
                ${amount} {currency || token}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee</span>
              <span className="text-white">
                {fee === 0 ? "Free" : `$${fee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-white">${total.toFixed(2)}</span>
            </div>
            {network && (
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">{network}</span>
              </div>
            )}
            {note && (
              <div className="flex justify-between">
                <span className="text-gray-400">Note</span>
                <span className="text-white">{note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Estimated Time */}
        <div className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg p-4 flex items-center gap-3">
          <Clock className="text-gray-400" size={20} />
          <div>
            <p className="text-white font-medium">Estimated Time</p>
            <p className="text-gray-400 text-sm">
              {isDabDubUser ? "Instant" : "2-5 minutes"}
            </p>
          </div>
        </div>

        {/* Important Notices */}
        <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-500 mt-1" size={20} />
            <div>
              <p className="text-yellow-500 font-medium mb-2">
                Important Notice
              </p>
              <ul className="text-yellow-400 text-sm space-y-1">
                <li>• Transactions cannot be reversed once sent</li>
                <li>• Ensure the recipient address is correct</li>
                <li>• Network fees may vary</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Check */}
        <div className="w-full">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Shield size={20} />
            Security Check
          </h2>

          <div className="space-y-4">
            {/* PIN Input */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                Enter PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1B7339]"
                placeholder="****"
              />
            </div>

            {/* Biometric Option */}
            <div className="flex items-center justify-between">
              <span className="text-white">Use Biometric</span>
              <button
                onClick={() => setUseBiometric(!useBiometric)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${useBiometric ? "bg-[#1B7339]" : "bg-gray-600"}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${useBiometric ? "translate-x-6" : "translate-x-0"}`}
                />
              </button>
            </div>

            <button
              onClick={handleAuthenticate}
              className="w-full bg-[#1B7339] text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Fingerprint size={20} />
              Authenticate
            </button>
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!isAuthenticated}
          className="w-full bg-[#1B7339] text-white py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} />
          Send Money
        </button>
      </div>
    </main>
  );
}
