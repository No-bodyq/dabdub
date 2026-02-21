import { motion, useMotionValue } from "motion/react";
import { X, AlertTriangle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DepositInfoModalProps {
  onClose: () => void;
}

export function DepositInfoModal({ onClose }: DepositInfoModalProps) {
  const router = useRouter();
  const [slidePosition, setSlidePosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    const threshold = 180;
    if (info.offset.x >= threshold) {
      onClose();
      router.push("/add-money/qr-code");
    } else {
      setSlidePosition(0);
      x.set(0);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-theme-overlay-dark z-50"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-2xl z-50 p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-theme-text flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Yellow Warning Icon */}
          <div className="w-16 h-16 bg-theme-gold rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-theme-text" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-theme-text mb-4">Only send funds using</h2>

          {/* USDC and Arbitrum Items */}
          <div className="space-y-3 mb-6 w-full">
            {/* USDC Item */}
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 bg-theme-usdc rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              </div>
              <span className="text-base font-bold text-theme-text">USDC</span>
            </div>

            {/* Arbitrum Item */}
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 bg-theme-usdc rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-base font-bold text-theme-text">Arbitrum</span>
            </div>
          </div>

          {/* Warning Text */}
          <p className="text-sm text-theme-text mb-6">
            Sending funds via any other network will result in a <strong>permanent loss.</strong>
          </p>

          {/* Slide to Proceed Button */}
          <div className="w-full  relative bg-white border-2 border-theme-text rounded-lg  p-1 overflow-hidden h-12">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 180 }}
              dragElastic={0}
              onDragStart={() => setIsDragging(true)}
              onDrag={(event, info) => {
                setSlidePosition(info.offset.x);
                x.set(info.offset.x);
              }}
              onDragEnd={handleDragEnd}
              className="h-9 bg-theme-primary rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing relative z-10 px-3 w-[50px] min-w-[50px]"
              style={{ x }}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-theme-text">Slide to proceed</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
