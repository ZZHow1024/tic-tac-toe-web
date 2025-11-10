import { useState } from 'react';
import { Button, Radio, Loading, Dialog } from 'tdesign-react';
import 'tdesign-react/es/style/index.css';

type Player = 'X' | 'O' | null;
type Board = Player[];

export default function Game() {
    const [board, setBoard] = useState<Board>(Array(9).fill(null));
    const [isPlayerFirst, setIsPlayerFirst] = useState<boolean>(true);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<Player>(null);
    const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
    const [showResultDialog, setShowResultDialog] = useState<boolean>(false);
    const [winningLine, setWinningLine] = useState<number[]>([]);

    // 检查获胜
    const checkWinner = (squares: Board): Player => {
        const lines: number[][] = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // 竖
            [0, 4, 8], [2, 4, 6] // 斜
        ];

        for (let line of lines) {
            const [a, b, c] = line;
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                setWinningLine(line);
                return squares[a];
            }
        }
        return null;
    };

    // 检查是否平局
    const isBoardFull = (squares: Board): boolean => {
        return squares.every(square => square !== null);
    };

    // MiniMax + Alpha-Beta 剪枝算法
    const minimax = (squares: Board, depth: number, isMaximizing: boolean, alpha: number, beta: number): number => {
        const winner = checkWinner(squares);

        // 终止条件
        if (winner === 'O') return 10 - depth; // AI 获胜
        if (winner === 'X') return depth - 10; // 玩家获胜
        if (isBoardFull(squares)) return 0; // 平局

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (squares[i] === null) {
                    squares[i] = 'O';
                    const evaluation = minimax(squares, depth + 1, false, alpha, beta);
                    squares[i] = null;
                    maxEval = Math.max(maxEval, evaluation);
                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha) break; // Beta 剪枝
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < 9; i++) {
                if (squares[i] === null) {
                    squares[i] = 'X';
                    const evaluation = minimax(squares, depth + 1, true, alpha, beta);
                    squares[i] = null;
                    minEval = Math.min(minEval, evaluation);
                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha) break; // Alpha 剪枝
                }
            }
            return minEval;
        }
    };

    // AI 落子
    const getAIMove = (squares: Board): number => {
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (squares[i] === null) {
                const boardCopy = [...squares];
                boardCopy[i] = 'O';
                const score = minimax(boardCopy, 0, false, -Infinity, Infinity);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    };

    // AI 执行落子
    const executeAIMove = (currentBoard: Board) => {
        setIsAIThinking(true);
        setTimeout(() => {
            const aiMove = getAIMove(currentBoard);
            if (aiMove !== -1) {
                const newBoard = [...currentBoard];
                newBoard[aiMove] = 'O';
                setBoard(newBoard);
                setIsAIThinking(false);

                const aiWinner = checkWinner(newBoard);
                if (aiWinner) {
                    setWinner(aiWinner);
                    setGameOver(true);
                    setTimeout(() => setShowResultDialog(true), 500);
                } else if (isBoardFull(newBoard)) {
                    setGameOver(true);
                    setTimeout(() => setShowResultDialog(true), 500);
                }
            } else {
                setIsAIThinking(false);
            }
        }, 800);
    };

    // 玩家点击
    const handleClick = (index: number) => {
        if (gameOver || board[index] !== null || isAIThinking) return;

        // 如果游戏还没开始，自动开始游戏（玩家先手）
        if (!gameStarted) {
            setGameStarted(true);
            setIsPlayerFirst(true);
        }

        const newBoard = [...board];
        newBoard[index] = 'X';
        setBoard(newBoard);

        // 检查游戏是否结束
        const winner = checkWinner(newBoard);
        if (winner) {
            setWinner(winner);
            setGameOver(true);
            setTimeout(() => setShowResultDialog(true), 500);
            return;
        }

        if (isBoardFull(newBoard)) {
            setGameOver(true);
            setTimeout(() => setShowResultDialog(true), 500);
            return;
        }

        // AI 回合
        executeAIMove(newBoard);
    };

    // 开始游戏
    const startGame = () => {
        const newBoard = Array(9).fill(null);
        setBoard(newBoard);
        setGameStarted(true);
        setGameOver(false);
        setWinner(null);
        setWinningLine([]);

        // 如果 AI 先手
        if (!isPlayerFirst) {
            executeAIMove(newBoard);
        }
    };

    // 重新开始
    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setGameStarted(false);
        setGameOver(false);
        setWinner(null);
        setIsAIThinking(false);
        setShowResultDialog(false);
        setWinningLine([]);
    };

    // 获取结果信息
    const getResultInfo = () => {
        if (winner === 'X') {
            return {
                title: '🎉 恭喜胜利！',
                message: '你成功击败了 AI！',
                color: '#52c41a',
                emoji: '🏆'
            };
        } else if (winner === 'O') {
            return {
                title: '💪 再接再厉！',
                message: 'AI 获胜了，继续挑战吧！',
                color: '#f5222d',
                emoji: '🤖'
            };
        } else {
            return {
                title: '🤝 平局！',
                message: '势均力敌，不分胜负！',
                color: '#1890ff',
                emoji: '⚖️'
            };
        }
    };

    const resultInfo = getResultInfo();

    return (
        <div style={{
            padding: '20px',
            height: 'calc(100vh - 115px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* 背景动画装饰 */}
            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.6); }
        }
        .cell-enter {
          animation: none; /* 移除弹跳动画 */
        }
        .winning-cell {
          animation: glow 1s infinite; /* 只保留光晕效果，移除可能导致大小变化的脉冲效果 */
        }
      `}</style>

            <div style={{
                display: 'flex',
                width: '100%',
                maxWidth: '1000px',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px'
            }}>
                {/* 左侧 - 算法说明 */}
                <div style={{
                    flex: '1',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '30px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '300px'
                }}>
                    <h3 style={{
                        fontSize: '24px',
                        marginBottom: '20px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '700',
                    }}>
                        💡 算法说明
                    </h3>
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.7' }}>
                        本游戏采用 <strong>MiniMax 算法 + Alpha-Beta 剪枝</strong> 实现 AI 对弈。
                        AI 会计算所有可能的走法并选择最优策略，Alpha-Beta 剪枝大幅减少搜索空间。
                        <br /><br />
                        MiniMax 算法是一种递归算法，用于在双人游戏中决定最佳走法。它通过模拟所有可能的游戏状态，并假设双方都会做出最优决策。
                        <br /><br />
                        Alpha-Beta 剪枝通过跳过不会影响最终决策的分支，大大提高了算法效率。
                    </div>
                </div>

                {/* 中间 - 棋盘 */}
                <div style={{
                    flex: '2',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <h2 style={{
                        marginBottom: '30px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        井字棋对弈
                    </h2>

                    {/* 游戏状态提示 */}
                    {(
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            padding: '16px',
                            width: '100%',
                            background: isAIThinking ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            animation: isAIThinking ? 'pulse 2s infinite' : 'none'
                        }}>
                            <div style={{ fontSize: '15px', fontWeight: '600' }}>
                                <span style={{ color: '#666' }}>你是：</span>
                                <span style={{
                                    color: '#0052d9',
                                    fontWeight: 'bold',
                                    fontSize: '20px',
                                    marginLeft: '8px'
                                }}>X</span>
                            </div>
                            {isAIThinking && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#ff9800',
                                    fontWeight: '600',
                                    animation: 'bounce 1s infinite'
                                }}>
                                    <Loading size="small" />
                                    AI 思考中
                                </div>
                            )}
                            <div style={{ fontSize: '15px', fontWeight: '600' }}>
                                <span style={{ color: '#666' }}>AI 是：</span>
                                <span style={{
                                    color: '#e34d59',
                                    fontWeight: 'bold',
                                    fontSize: '20px',
                                    marginLeft: '8px'
                                }}>O</span>
                            </div>
                        </div>
                    )}

                    {/* 棋盘 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '10px',
                        marginBottom: '25px',
                        background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                        padding: '12px',
                        borderRadius: '16px',
                        width: '340px',
                        height: '340px',
                        margin: '0 auto 25px',
                        boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                        {board.map((cell, index) => {
                            const isCellDisabled = gameOver || cell !== null || isAIThinking
                            const cellClassName = [
                                cell ? 'cell-enter' : '',
                                winningLine.includes(index) ? 'winning-cell' : ''
                            ]
                                .filter(Boolean)
                                .join(' ')

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleClick(index)}
                                    disabled={isCellDisabled}
                                    className={cellClassName}
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        fontSize: '52px',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        borderRadius: '12px',
                                        background: winningLine.includes(index)
                                            ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                                            : cell ? '#f9f9f9' : 'white',
                                        cursor: isCellDisabled ? 'not-allowed' : 'pointer',
                                        color: cell === 'X' ? '#0052d9' : '#e34d59',
                                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                            onMouseEnter={(event) => {
                                if (cell || gameOver || isAIThinking) {
                                    return
                                }

                                const currentTarget = event.currentTarget
                                currentTarget.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                                currentTarget.style.boxShadow = '0 8px 16px rgba(0,82,217,0.3)'
                            }}
                            onMouseLeave={(event) => {
                                if (cell || gameOver || isAIThinking) {
                                    return
                                }

                                const currentTarget = event.currentTarget
                                currentTarget.style.background = 'white'
                                currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                            }}
                                >
                                    {cell}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 右侧 - 选择先手和开始游戏 */}
                <div style={{
                    flex: '1',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '30px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <h3 style={{
                        fontSize: '24px',
                        marginBottom: '10px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '700',
                    }}>
                        游戏设置
                    </h3>

                    {/* 先手选择 */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                            🎮 选择先手方
                        </div>
                        <Radio.Group
                            value={isPlayerFirst}
                            onChange={(value) => {
                                if (typeof value === 'boolean') {
                                    setIsPlayerFirst(value)
                                }
                            }}
                            disabled={gameStarted}
                        >
                            <Radio.Button value={true}>玩家先手 (X)</Radio.Button>
                            <Radio.Button value={false}>AI 先手 (O)</Radio.Button>
                        </Radio.Group>
                    </div>

                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!gameStarted ? (
                            <Button
                                theme="primary"
                                size="large"
                                onClick={startGame}
                                block
                                style={{
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    height: '50px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                🚀 开始游戏
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="large"
                                onClick={resetGame}
                                block
                                disabled={isAIThinking}
                                style={{
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    height: '50px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isAIThinking) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isAIThinking) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                🔄 重新开始
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* 游戏结果弹窗 */}
            <Dialog
                visible={showResultDialog}
                header={null}
                footer={null}
                onClose={() => setShowResultDialog(false)}
                width="400px"
            >
                <div style={{
                    textAlign: 'center',
                    padding: '30px 20px',
                    background: `linear-gradient(135deg, ${resultInfo.color}15 0%, ${resultInfo.color}30 100%)`
                }}>
                    <div style={{
                        fontSize: '80px',
                        marginBottom: '20px',
                        animation: 'bounce 1s ease infinite'
                    }}>
                        {resultInfo.emoji}
                    </div>
                    <h3 style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: resultInfo.color,
                        marginBottom: '15px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {resultInfo.title}
                    </h3>
                    <p style={{
                        fontSize: '18px',
                        color: '#666',
                        marginBottom: '30px',
                        fontWeight: '500'
                    }}>
                        {resultInfo.message}
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            theme="primary"
                            size="large"
                            onClick={resetGame}
                            block
                            style={{
                                borderRadius: '12px',
                                fontWeight: '600',
                                background: resultInfo.color,
                                border: 'none'
                            }}
                        >
                            🎮 再来一局
                        </Button>
                        <Button
                            variant="outline"
                            size="large"
                            onClick={() => setShowResultDialog(false)}
                            block
                            style={{
                                borderRadius: '12px',
                                fontWeight: '600'
                            }}
                        >
                            查看棋局
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
