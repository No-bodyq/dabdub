import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export default function Processing() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Processing transaction...");

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (!dataParam) return;

    const transactionData = JSON.parse(decodeURIComponent(dataParam));
    const isDabDubUser = transactionData.recipient.type === "dabdub";

    // Simulate processing
    const steps = isDabDubUser
      ? [
          "Validating recipient...",
          "Processing payment...",
          "Transaction complete!",
        ]
      : [
          "Broadcasting to network...",
          "Confirming transaction...",
          "Transaction complete!",
        ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / (steps.length * 10);
        if (newProgress >= (stepIndex + 1) * (100 / steps.length)) {
          setStatus(steps[stepIndex]);
          stepIndex++;
        }
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/send-money/success?data=${dataParam}`);
          }, 1000);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [searchParams, router]);

  return (
    <main className="w-full bg-[#141414] flex flex-col items-center justify-center min-h-[100vh]">
      <div className="flex flex-col items-center w-[98%] py-[1rem] gap-[2rem]">
        {/* Animation */}
        <div className="relative">
          <div className="w-32 h-32 bg-[#1B7339] rounded-full flex items-center justify-center">
            {progress < 100 ? (
              <Loader2 className="w-16 h-16 text-white animate-spin" />
            ) : (
              <CheckCircle className="w-16 h-16 text-white" />
            )}
          </div>
          {/* Progress Ring */}
          <svg
            className="absolute top-0 left-0 w-32 h-32 transform -rotate-90"
            viewBox="0 0 36 36"
          >
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
            />
          </svg>
        </div>

        {/* Status */}
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Sending Money</h1>
          <p className="text-gray-400 text-lg">{status}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#1B7339] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2 text-center">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </main>
  );
}
