// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/* =========================
   Errors
   ========================= */
error Lottery__NotEnoughETH();
error Lottery__LotteryNotOpen();
error Lottery__TransferFailed();

/* =========================
   Interface VRF Mock
   ========================= */
interface IVRFCoordinatorV2Mock {
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256);

    function fulfillRandomWords(uint256 requestId, address consumer) external;
}

/* =========================
   Lottery ETH-weighted
   ========================= */
contract Lottery {
    /* ========== Types ========== */
    enum LotteryState {
        OPEN,
        CALCULATING
    }

    /* ========== State variables ========== */
    IVRFCoordinatorV2Mock private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;

    LotteryState private s_state;

    address[] private s_players;
    mapping(address => uint256) private s_ethContributed;
    uint256 private s_totalEth;

    address private s_recentWinner;

    /* ========== Events ========== */
    event PlayerEntered(address indexed player, uint256 amount);
    event RandomnessRequested(uint256 requestId);
    event WinnerPicked(address indexed winner, uint256 reward);

    /* ========== Constructor ========== */
    constructor(address vrfCoordinator, uint64 subscriptionId) {
        i_vrfCoordinator = IVRFCoordinatorV2Mock(vrfCoordinator);
        i_subscriptionId = subscriptionId;
        s_state = LotteryState.OPEN;
    }

    /* ========== External functions ========== */

    /// @notice Enter lottery with ETH (weight = ETH amount)
    function enter() external payable {
        if (s_state != LotteryState.OPEN) revert Lottery__LotteryNotOpen();
        if (msg.value == 0) revert Lottery__NotEnoughETH();

        if (s_ethContributed[msg.sender] == 0) {
            s_players.push(msg.sender);
        }

        s_ethContributed[msg.sender] += msg.value;
        s_totalEth += msg.value;

        emit PlayerEntered(msg.sender, msg.value);
    }

    /// @notice Trigger VRF mock request
    function pickWinner() external {
        if (s_state != LotteryState.OPEN) revert Lottery__LotteryNotOpen();
        if (s_totalEth == 0) revert Lottery__NotEnoughETH();

        s_state = LotteryState.CALCULATING;

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            0x0, // dummy keyHash
            i_subscriptionId,
            3, // request confirmations dummy
            200_000, // callback gas limit
            1 // num words
        );

        emit RandomnessRequested(requestId);
    }

    /// @notice Callback from VRF mock
    function fulfillRandomWords(uint256, uint256[] memory randomWords) external {
        uint256 rand = randomWords[0] % s_totalEth;

        uint256 cumulative;
        address winner;

        for (uint256 i = 0; i < s_players.length; i++) {
            address player = s_players[i];
            cumulative += s_ethContributed[player];
            if (rand < cumulative) {
                winner = player;
                break;
            }
        }

        s_recentWinner = winner;
        s_state = LotteryState.OPEN;

        // reset balances
        for (uint256 i = 0; i < s_players.length; i++) {
            s_ethContributed[s_players[i]] = 0;
        }
        delete s_players;
        uint256 prize = address(this).balance;
        s_totalEth = 0;

        (bool success, ) = winner.call{value: prize}("");
        if (!success) revert Lottery__TransferFailed();

        emit WinnerPicked(winner, prize);
    }

    /* ========== View functions ========== */
    function getPlayers() external view returns (address[] memory) {
        return s_players;
    }

    function getContribution(address player) external view returns (uint256) {
        return s_ethContributed[player];
    }

    function getTotalEth() external view returns (uint256) {
        return s_totalEth;
    }

    function getRecentWinner() external view returns (address) {
        return s_recentWinner;
    }

    function getLotteryState() external view returns (LotteryState) {
        return s_state;
    }
}
