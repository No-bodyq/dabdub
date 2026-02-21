import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Download,
  Share2,
  RotateCcw,
  Eye,
  Home,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Success() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [transactionData, setTransactionData] = useState(null);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      setTransactionData(JSON.parse(decodeURIComponent(dataParam)));
    }
  }, [searchParams]);

  if (!transactionData) return <div>Loading...</div>;

  const { recipient, amount, currency, network, token, note } =
    transactionData as any;
  const isDabDubUser = recipient.type === "dabdub";
  const transactionId =
    "TXN" + Math.random().toString(36).substr(2, 9).toUpperCase();

  const handleDownloadReceipt = () => {
    // Mock download
    alert("Receipt downloaded!");
  };

  const handleShare = () => {
    // Mock share
    alert("Receipt shared!");
  };

  const handleSendAgain = () => {
    router.push("/send-money");
  };

  return (
    <main className="w-full bg-[#141414] flex flex-col items-center min-h-[100vh]">
      <div className="flex flex-col items-center w-[98%] py-[1rem] gap-[2rem]">
        {/* Success Animation */}
        <div className="relative">
          <div className="w-32 h-32 bg-[#1B7339] rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          {/* Confetti effect - simplified */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-2">Success!</h1>
          <p className="text-gray-400 text-lg">
            Your money has been sent successfully
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src={recipient.avatar || "/cheese.png"}
              alt="Recipient"
              width={50}
              height={50}
              className="rounded-full"
            />
            <div>
              <p className="text-white font-medium">
                Sent to {recipient.name || recipient.address}
              </p>
              <p className="text-gray-400 text-sm">
                Transaction ID: {transactionId}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Amount</span>
              <span className="text-white font-bold">
                ${amount} {currency || token}
              </span>
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

        {/* Receipt Actions */}
        <div className="w-full space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleDownloadReceipt}
              className="flex-1 bg-[#FFFFFF14] border border-[#FFFFFF0A] text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#FFFFFF24] transition-colors"
            >
              <Download size={20} />
              Download Receipt
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-[#FFFFFF14] border border-[#FFFFFF0A] text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#FFFFFF24] transition-colors"
            >
              <Share2 size={20} />
              Share
            </button>
          </div>

          <button
            onClick={handleSendAgain}
            className="w-full bg-[#1B7339] text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Send Again
          </button>

          <Link href="/dashboard" className="w-full">
            <button className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#FFFFFF24] transition-colors">
              <Home size={20} />
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
