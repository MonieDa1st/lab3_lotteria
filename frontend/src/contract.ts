// Địa chỉ sau khi deploy (dán vào)
export const LOTTERY_ADDRESS = "0xc6e7df5e7b4f2a278906862b61205850344d4e7d" as const;

// VRF mock (nếu bạn deploy VRFCoordinatorV2Mock, dán địa chỉ vào)
export const VRF_MOCK_ADDRESS = "0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae" as const;

// (Tuỳ chọn) địa chỉ “admin” chỉ để UI disable/enable nút (on-chain không chặn)
export const UI_ADMIN = "0xYOUR_ADMIN_ADDRESS_HERE" as const;

// ABI Lottery theo đúng code Solidity bạn gửi
export const LOTTERY_ABI = [
  { type: "function", name: "enter", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "pickWinner", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // fulfillRandomWords là external nhưng do VRF mock gọi, FE không gọi trực tiếp
  {
    type: "function",
    name: "fulfillRandomWords",
    stateMutability: "nonpayable",
    inputs: [
      { name: "", type: "uint256" },
      { name: "randomWords", type: "uint256[]" }
    ],
    outputs: []
  },

  { type: "function", name: "getPlayers", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  {
    type: "function",
    name: "getContribution",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  { type: "function", name: "getTotalEth", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getRecentWinner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },

  // enum LotteryState => uint8
  { type: "function", name: "getLotteryState", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },

  // Events (để đọc requestId từ receipt logs)
  {
    type: "event",
    name: "RandomnessRequested",
    inputs: [{ indexed: false, name: "requestId", type: "uint256" }]
  },
  {
    type: "event",
    name: "PlayerEntered",
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "WinnerPicked",
    inputs: [
      { indexed: true, name: "winner", type: "address" },
      { indexed: false, name: "reward", type: "uint256" }
    ]
  }
] as const;

// ABI VRFCoordinatorV2Mock tối thiểu: fulfillRandomWords(requestId, consumer)
export const VRF_MOCK_ABI = [
  {
    type: "function",
    name: "fulfillRandomWords",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "uint256" },
      { name: "consumer", type: "address" }
    ],
    outputs: []
  }
] as const;
