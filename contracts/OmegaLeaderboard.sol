// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title OmegaLeaderboard
 * @dev Simple leaderboard contract for Omega Quake
 */
contract OmegaLeaderboard {
    struct ScoreEntry {
        address player;
        uint256 score;
        uint256 timestamp;
    }

    // Store the high score for each player
    mapping(address => uint256) public highScores;
    
    // Array of all scores only for top list tracking (careful with gas in prod!)
    // For a game demo, we can just emit events, but storing top scores allows easy on-chain retrieval
    ScoreEntry[] public recentScores;

    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);
    event NewHighScore(address indexed player, uint256 score);

    /**
     * @dev Submit a new score. Updates player's high score if higher.
     * @param _score The score achieved in the game.
     */
    function submitScore(uint256 _score) external {
        require(_score > 0, "Score must be positive");

        // Update personal high score
        if (_score > highScores[msg.sender]) {
            highScores[msg.sender] = _score;
            emit NewHighScore(msg.sender, _score);
        }

        emit ScoreSubmitted(msg.sender, _score, block.timestamp);
    }

    /**
     * @dev Get the high score for a specific player.
     * @param _player The address of the player.
     */
    function getHighScore(address _player) external view returns (uint256) {
        return highScores[_player];
    }
}
