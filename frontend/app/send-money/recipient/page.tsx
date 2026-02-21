import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  QrCode,
  User,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock data
const dabDubUsers = [
  {
    id: 1,
    name: "Alice Johnson",
    username: "@alicej",
    avatar: "/woman.jpg",
    verified: true,
  },
  {
    id: 2,
    name: "Bob Smith",
    username: "@bobsmith",
    avatar: "/man1.jpg",
    verified: false,
  },
  {
    id: 3,
    name: "Charlie Brown",
    username: "@charlieb",
    avatar: "/man2.jpg",
    verified: true,
  },
];

const addressBook = [
  {
    id: 1,
    name: "My Wallet",
    address: "0x1234567890abcdef",
    nickname: "Personal ETH",
  },
  {
    id: 2,
    name: "Business",
    address: "0xabcdef1234567890",
    nickname: "Company BTC",
  },
];

export default function RecipientSelection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [cryptoAddress, setCryptoAddress] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In real app, this would call an API
  };

  const handleSelectRecipient = (recipient: any) => {
    setSelectedRecipient(recipient);
    // Navigate to amount page with recipient data
    router.push(
      `/send-money/amount?recipient=${encodeURIComponent(JSON.stringify(recipient))}`,
    );
  };

  const handleAddressSubmit = () => {
    if (cryptoAddress) {
      const recipient = { type: "crypto", address: cryptoAddress };
      router.push(
        `/send-money/amount?recipient=${encodeURIComponent(JSON.stringify(recipient))}`,
      );
    }
  };

  const filteredUsers = dabDubUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className="w-full bg-[#141414] flex flex-col items-center min-h-[100vh]">
      <div className="flex flex-col items-center w-[98%] py-[1rem] gap-[1rem]">
        {/* Header */}
        <div className="w-full flex items-center justify-start">
          <Link href="/send-money" className="text-white">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-white font-bold text-xl ml-4">
            Select Recipient
          </h1>
        </div>

        {/* Search Bar */}
        <div className="w-full relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search username, phone, email, or address"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-full px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#1B7339]"
          />
        </div>

        {/* Tabs or Toggle */}
        <div className="w-full flex gap-2">
          <button
            onClick={() => setShowAddressInput(false)}
            className={`flex-1 py-2 rounded-lg font-medium ${!showAddressInput ? "bg-[#1B7339] text-white" : "bg-[#FFFFFF14] text-gray-400"}`}
          >
            DabDub Users
          </button>
          <button
            onClick={() => setShowAddressInput(true)}
            className={`flex-1 py-2 rounded-lg font-medium ${showAddressInput ? "bg-[#1B7339] text-white" : "bg-[#FFFFFF14] text-gray-400"}`}
          >
            Crypto Address
          </button>
        </div>

        {!showAddressInput ? (
          <>
            {/* DabDub Users Results */}
            {filteredUsers.length > 0 && (
              <div className="w-full">
                <h2 className="text-white font-bold text-lg mb-4">
                  DabDub Users
                </h2>
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() =>
                        handleSelectRecipient({ type: "dabdub", ...user })
                      }
                      className="flex items-center justify-between bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg p-4 cursor-pointer hover:bg-[#FFFFFF24] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">
                            {user.username}
                          </p>
                        </div>
                      </div>
                      {user.verified && (
                        <CheckCircle className="text-[#1B7339]" size={24} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address Book */}
            <div className="w-full">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen size={20} />
                Address Book
              </h2>
              <div className="space-y-2">
                {addressBook.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() =>
                      handleSelectRecipient({
                        type: "crypto",
                        address: entry.address,
                        nickname: entry.nickname,
                      })
                    }
                    className="bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg p-4 cursor-pointer hover:bg-[#FFFFFF24] transition-colors"
                  >
                    <p className="text-white font-medium">{entry.name}</p>
                    <p className="text-gray-400 text-sm">{entry.nickname}</p>
                    <p className="text-gray-500 text-xs font-mono">
                      {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Crypto Address Input */
          <div className="w-full">
            <h2 className="text-white font-bold text-lg mb-4">
              Enter Crypto Address
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="0x... or ENS domain"
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#1B7339]"
              />
              <div className="flex gap-2">
                <Link href="/scan-qr-code" className="flex-1">
                  <button className="w-full bg-[#FFFFFF14] border border-[#FFFFFF0A] text-white py-3 rounded-lg flex items-center justify-center gap-2">
                    <QrCode size={20} />
                    Scan QR
                  </button>
                </Link>
                <button
                  onClick={handleAddressSubmit}
                  disabled={!cryptoAddress}
                  className="flex-1 bg-[#1B7339] text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
