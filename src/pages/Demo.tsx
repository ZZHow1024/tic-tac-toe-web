import React, { useState, useEffect, useRef } from 'react'
import { Button, Radio, Loading, Dialog } from 'tdesign-react'
import 'tdesign-react/es/style/index.css'

type Player = 'X' | 'O' | null
type Board = Player[]

// 定义搜索树节点类型
interface TreeNode {
  id: string
  board: Board
  score: number | null
  depth: number
  isMaximizing: boolean
  children: TreeNode[]
  pruned: boolean
  alpha: number
  beta: number
  bestChildId: string | null
  move: number | null
}

export default function Demo() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [isPlayerFirst, setIsPlayerFirst] = useState<boolean>(true)
  const [gameStarted, setGameStarted] = useState<boolean>(false)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [winner, setWinner] = useState<Player>(null)
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false)
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false)
  const [winningLine, setWinningLine] = useState<number[]>([])
  
  // 搜索树可视化相关状态
  const [searchTree, setSearchTree] = useState<TreeNode | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [totalSteps, setTotalSteps] = useState<number>(0)
  const [searchSteps, setSearchSteps] = useState<TreeNode[]>([])
  const [showingAnimation, setShowingAnimation] = useState<boolean>(false)
  const [animationSpeed, setAnimationSpeed] = useState<number>(1000) // 毫秒
  const animationRef = useRef<number | null>(null)
  
  // 拖拽和缩放相关状态
  const [scale, setScale] = useState<number>(1)
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const treeContentRef = useRef<HTMLDivElement>(null)
  
  // 残局生成相关状态
  const [isEndgameMode, setIsEndgameMode] = useState<boolean>(true) // 默认开启残局模式
  const [endgameDepth, setEndgameDepth] = useState<number>(3) // 残局深度（已下的棋子数量）

  // 检查获胜
  const checkWinner = (squares: Board): Player => {
    const lines: number[][] = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // 竖
      [0, 4, 8], [2, 4, 6] // 斜
    ]

    for (let line of lines) {
      const [a, b, c] = line
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        setWinningLine(line)
        return squares[a]
      }
    }
    return null
  }

  // 检查是否平局
  const isBoardFull = (squares: Board): boolean => {
    return squares.every(square => square !== null)
  }

  // 生成唯一ID
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 9)
  }

  // MiniMax + Alpha-Beta 剪枝算法（带搜索树构建）
  const minimax = (
    squares: Board, 
    depth: number, 
    isMaximizing: boolean, 
    alpha: number, 
    beta: number, 
    parentNode: TreeNode | null = null,
    move: number | null = null
  ): [number, TreeNode] => {
    const nodeId = generateId()
    const node: TreeNode = {
      id: nodeId,
      board: [...squares],
      score: null,
      depth,
      isMaximizing,
      children: [],
      pruned: false,
      alpha,
      beta,
      bestChildId: null,
      move
    }

    // 如果有父节点，将当前节点添加为子节点
    if (parentNode) {
      parentNode.children.push(node)
    }

    const winner = checkWinner(squares)

    // 终止条件
    if (winner === 'O') {
      node.score = 10 - depth
      return [node.score, node]
    }
    if (winner === 'X') {
      node.score = depth - 10
      return [node.score, node]
    }
    if (isBoardFull(squares)) {
      node.score = 0
      return [0, node]
    }

    if (isMaximizing) {
      let maxEval = -Infinity
      let bestChildId = null

      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          const boardCopy = [...squares]
          boardCopy[i] = 'O'
          
          const [evaluation, childNode] = minimax(boardCopy, depth + 1, false, alpha, beta, node, i)
          
          if (evaluation > maxEval) {
            maxEval = evaluation
            bestChildId = childNode.id
          }
          
          alpha = Math.max(alpha, evaluation)
          
          // Beta 剪枝
          if (beta <= alpha) {
            // 标记剩余的可能移动为剪枝
            for (let j = i + 1; j < 9; j++) {
              if (squares[j] === null) {
                const prunedNode: TreeNode = {
                  id: generateId(),
                  board: [...squares],
                  score: null,
                  depth: depth + 1,
                  isMaximizing: false,
                  children: [],
                  pruned: true,
                  alpha,
                  beta,
                  bestChildId: null,
                  move: j
                }
                prunedNode.board[j] = 'O'
                node.children.push(prunedNode)
              }
            }
            break
          }
        }
      }
      
      node.score = maxEval
      node.bestChildId = bestChildId
      return [maxEval, node]
    } else {
      let minEval = Infinity
      let bestChildId = null

      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          const boardCopy = [...squares]
          boardCopy[i] = 'X'
          
          const [evaluation, childNode] = minimax(boardCopy, depth + 1, true, alpha, beta, node, i)
          
          if (evaluation < minEval) {
            minEval = evaluation
            bestChildId = childNode.id
          }
          
          beta = Math.min(beta, evaluation)
          
          // Alpha 剪枝
          if (beta <= alpha) {
            // 标记剩余的可能移动为剪枝
            for (let j = i + 1; j < 9; j++) {
              if (squares[j] === null) {
                const prunedNode: TreeNode = {
                  id: generateId(),
                  board: [...squares],
                  score: null,
                  depth: depth + 1,
                  isMaximizing: true,
                  children: [],
                  pruned: true,
                  alpha,
                  beta,
                  bestChildId: null,
                  move: j
                }
                prunedNode.board[j] = 'X'
                node.children.push(prunedNode)
              }
            }
            break
          }
        }
      }
      
      node.score = minEval
      node.bestChildId = bestChildId
      return [minEval, node]
    }
  }

  // 生成搜索步骤序列（用于动画）
  const generateSearchSteps = (node: TreeNode): TreeNode[] => {
    const steps: TreeNode[] = []
    
    // 深度优先遍历搜索树
    const traverse = (node: TreeNode) => {
      steps.push(node)
      for (const child of node.children) {
        if (!child.pruned) {
          traverse(child)
        } else {
          steps.push(child) // 也添加被剪枝的节点，但不继续遍历
        }
      }
    }
    
    traverse(node)
    return steps
  }
  
  // 确保当前步骤不超过总步骤
  const ensureValidStep = () => {
    if (currentStep >= totalSteps && totalSteps > 0) {
      setCurrentStep(totalSteps - 1)
    }
  }

  // AI 落子
  const getAIMove = (squares: Board): [number, TreeNode] => {
    let bestMove = -1
    let rootNode: TreeNode | null = null

    // 构建搜索树并获取最佳移动
    const [_, treeRoot] = minimax([...squares], 0, true, -Infinity, Infinity)
    rootNode = treeRoot

    // 找到最佳移动
    for (const child of rootNode.children) {
      if (child.id === rootNode.bestChildId) {
        bestMove = child.move !== null ? child.move : -1
        break
      }
    }

    // 生成搜索步骤序列
    const steps = generateSearchSteps(rootNode)
    setSearchSteps(steps)
    setTotalSteps(steps.length)
    
    return [bestMove, rootNode]
  }

  // 播放搜索树动画
  const playSearchAnimation = () => {
    // 确保总步骤数正确
    if (searchSteps.length === 0) {
      return
    }
    
    // 更新总步骤数，确保与实际步骤数一致
    if (totalSteps !== searchSteps.length) {
      setTotalSteps(searchSteps.length)
    }
    
    setShowingAnimation(true)
    setCurrentStep(0)
    
    // 清除之前的动画定时器
    if (animationRef.current !== null) {
      window.clearInterval(animationRef.current)
    }

    // 设置新的动画定时器
    animationRef.current = window.setInterval(() => {
      setCurrentStep(previousStep => {
        // 确保不超出范围
        if (previousStep >= searchSteps.length - 1) {
          if (animationRef.current !== null) {
            window.clearInterval(animationRef.current)
            animationRef.current = null
          }
          setShowingAnimation(false)
          return searchSteps.length - 1
        }

        return previousStep + 1
      })
    }, animationSpeed)
  }

  // 停止动画
  const stopAnimation = () => {
    if (animationRef.current !== null) {
      window.clearInterval(animationRef.current)
      animationRef.current = null
    }
    setShowingAnimation(false)
  }
  
  // 使用useEffect确保当前步骤始终有效
  useEffect(() => {
    ensureValidStep()
  }, [totalSteps])

  // 手动控制动画步骤
  const stepForward = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // AI 执行落子
  const executeAIMove = (currentBoard: Board) => {
    setIsAIThinking(true)
    
    // 延迟执行，以便UI可以更新
    setTimeout(() => {
      const [aiMove, rootNode] = getAIMove(currentBoard)
      setSearchTree(rootNode)
      
      // 立即执行AI的移动，不等待动画完成
      if (aiMove !== -1) {
        const newBoard = [...currentBoard]
        newBoard[aiMove] = 'O'
        setBoard(newBoard)
        
        // 检查游戏状态
        const aiWinner = checkWinner(newBoard)
        if (aiWinner) {
          setWinner(aiWinner)
          setGameOver(true)
          setTimeout(() => setShowResultDialog(true), 500)
        } else if (isBoardFull(newBoard)) {
          setGameOver(true)
          setTimeout(() => setShowResultDialog(true), 500)
        }
      }
      
      // 播放搜索树动画，但不阻塞游戏进行
      playSearchAnimation()
      
      // 无论动画是否完成，都允许玩家继续操作
      setIsAIThinking(false)
    }, 500)
  }

  // 玩家点击
  const handleClick = (index: number) => {
    // 移除showingAnimation条件，允许在动画播放时操作
    if (gameOver || board[index] !== null || isAIThinking) return

    // 如果动画正在播放，停止动画
    if (showingAnimation) {
      stopAnimation()
    }

    // 如果游戏还没开始，自动开始游戏（玩家先手）
    if (!gameStarted) {
      setGameStarted(true)
      setIsPlayerFirst(true)
    }

    const newBoard = [...board]
    newBoard[index] = 'X'
    setBoard(newBoard)

    // 检查游戏是否结束
    const winner = checkWinner(newBoard)
    if (winner) {
      setWinner(winner)
      setGameOver(true)
      setTimeout(() => setShowResultDialog(true), 500)
      return
    }

    if (isBoardFull(newBoard)) {
      setGameOver(true)
      setTimeout(() => setShowResultDialog(true), 500)
      return
    }

    // AI 回合
    executeAIMove(newBoard)
  }

  // 生成随机残局
  const generateEndgame = () => {
    // 创建空棋盘
    const newBoard = Array(9).fill(null)
    
    // 确定已下的棋子数量（深度）
    const depth = Math.min(endgameDepth, 5) // 限制最大深度为5，避免生成接近终局的残局
    
    // 跟踪已下的X和O数量
    let xCount = 0
    let oCount = 0
    
    // 随机放置棋子
    const positions = Array.from({ length: 9 }, (_, i) => i)
    
    // 打乱位置数组
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }
    
    // 根据先手情况确定初始棋子分布
    const playerIsX = true // 玩家始终是X
    
    // 放置棋子
    for (let i = 0; i < depth; i++) {
      const position = positions[i]
      
      if (i % 2 === 0) {
        // 偶数索引，放置先手棋子
        newBoard[position] = playerIsX ? 'X' : 'O'
        xCount += playerIsX ? 1 : 0
        oCount += playerIsX ? 0 : 1
      } else {
        // 奇数索引，放置后手棋子
        newBoard[position] = playerIsX ? 'O' : 'X'
        xCount += playerIsX ? 0 : 1
        oCount += playerIsX ? 1 : 0
      }
    }
    
    // 确保没有获胜方
    const winner = checkWinner(newBoard)
    if (winner) {
      // 如果有获胜方，重新生成
      return generateEndgame()
    }
    
    // 确保轮到玩家行动（X）
    if (xCount <= oCount) {
      return newBoard
    } else {
      // 如果X比O多，说明轮到O行动，这不是我们想要的
      // 移除一个X或添加一个O
      const emptyPositions = positions.slice(depth)
      if (emptyPositions.length > 0) {
        // 添加一个O
        newBoard[emptyPositions[0]] = 'O'
      } else {
        // 没有空位了，重新生成
        return generateEndgame()
      }
    }
    
    return newBoard
  }

  // 开始游戏
  const startGame = () => {
    let newBoard
    
    if (isEndgameMode) {
      // 生成残局
      newBoard = generateEndgame()
    } else {
      // 常规空棋盘
      newBoard = Array(9).fill(null)
    }
    
    setBoard(newBoard)
    setGameStarted(true)
    setGameOver(false)
    setWinner(null)
    setWinningLine([])
    setSearchTree(null)
    setSearchSteps([])
    setCurrentStep(0)
    setTotalSteps(0)
    stopAnimation()

    // 如果 AI 先手且不是残局模式
    if (!isPlayerFirst && !isEndgameMode) {
      executeAIMove(newBoard)
    }
  }

  // 重新开始
  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setGameStarted(false)
    setGameOver(false)
    setWinner(null)
    setIsAIThinking(false)
    setShowResultDialog(false)
    setWinningLine([])
    setSearchTree(null)
    setSearchSteps([])
    setCurrentStep(0)
    setTotalSteps(0)
    stopAnimation()
  }

  // 获取结果信息
  const getResultInfo = () => {
    if (winner === 'X') {
      return {
        title: '🎉 恭喜胜利！',
        message: '你成功击败了 AI！',
        color: '#52c41a',
        emoji: '🏆'
      }
    } else if (winner === 'O') {
      return {
        title: '💪 再接再厉！',
        message: 'AI 获胜了，继续挑战吧！',
        color: '#f5222d',
        emoji: '🤖'
      }
    } else {
      return {
        title: '🤝 平局！',
        message: '势均力敌，不分胜负！',
        color: '#1890ff',
        emoji: '⚖️'
      }
    }
  }

  // 渲染搜索树节点
  const renderTreeNode = (node: TreeNode | null, level: number = 0, isCurrentNode: boolean = false, parentBestChildId: string | null = null) => {
    if (!node) return null

    const nodeSize = Math.max(30, 60 - level * 5) // 根据层级调整节点大小
    const isLeaf = node.children.length === 0
    const isBestMove = node.id === parentBestChildId
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '5px',
      }}>
        <div style={{
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${nodeSize / 3}px`,
          fontWeight: 'bold',
          background: isCurrentNode 
            ? '#ffeb3b' 
            : node.pruned 
              ? '#ffcdd2' 
              : isLeaf 
                ? '#e8f5e9' 
                : isBestMove 
                  ? '#bbdefb' 
                  : '#f5f5f5',
          border: isCurrentNode ? '3px solid #ff9800' : '1px solid #ccc',
          position: 'relative',
          zIndex: isCurrentNode ? 2 : 1,
          boxShadow: isCurrentNode ? '0 0 10px rgba(255, 152, 0, 0.5)' : 'none',
        }}>
          {node.score !== null ? node.score : '?'}
        </div>
        
        {/* 显示 Alpha-Beta 值 */}
        <div style={{
          fontSize: '10px',
          marginTop: '2px',
          color: '#666',
        }}>
          α: {node.alpha === -Infinity ? '-∞' : node.alpha}, 
          β: {node.beta === Infinity ? '∞' : node.beta}
        </div>
        
        {/* 显示棋盘状态 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          margin: '5px 0',
          background: '#ddd',
          padding: '2px',
          borderRadius: '4px',
        }}>
          {node.board.map((cell, idx) => (
            <div key={idx} style={{
              width: '12px',
              height: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 'bold',
              background: 'white',
              color: cell === 'X' ? '#0052d9' : cell === 'O' ? '#e34d59' : 'transparent',
            }}>
              {cell}
            </div>
          ))}
        </div>
        
        {/* 子节点 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {node.children.map((child, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {/* 连接线 */}
              <div style={{
                width: '2px',
                height: '20px',
                background: child.pruned ? '#ffcdd2' : child.id === node.bestChildId ? '#bbdefb' : '#ddd',
              }} />
              {renderTreeNode(
                child, 
                level + 1, 
                searchSteps[currentStep]?.id === child.id,
                node.bestChildId ?? null
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 渲染当前步骤信息
  const renderStepInfo = () => {
    const currentNode = searchSteps[currentStep]
    if (!currentNode) return null
    
    return (
      <div style={{
        background: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px',
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>步骤 {currentStep + 1}/{totalSteps}</h4>
        <div>
          <p><strong>深度:</strong> {currentNode.depth}</p>
          <p><strong>角色:</strong> {currentNode.isMaximizing ? 'AI (最大化)' : '玩家 (最小化)'}</p>
          <p><strong>Alpha:</strong> {currentNode.alpha === -Infinity ? '-∞' : currentNode.alpha}</p>
          <p><strong>Beta:</strong> {currentNode.beta === Infinity ? '∞' : currentNode.beta}</p>
          <p><strong>评分:</strong> {currentNode.score !== null ? currentNode.score : '未评估'}</p>
          <p><strong>状态:</strong> {
            currentNode.pruned 
              ? '被剪枝' 
              : currentNode.children.length === 0 
                ? '叶节点' 
                : '内部节点'
          }</p>
        </div>
      </div>
    )
  }

  const resultInfo = getResultInfo()

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  // 处理拖拽过程
  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.preventDefault()
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      
      // 使用 requestAnimationFrame 减少卡顿
      requestAnimationFrame(() => {
        setPosition({ x: newX, y: newY })
      })
    }
  }

  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // 处理缩放
  const handleZoom = (delta: number) => {
    // 获取容器中心点
    const container = treeContainerRef.current
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    const containerCenterX = containerRect.width / 2
    const containerCenterY = containerRect.height / 2
    
    setScale(prevScale => {
      const newScale = prevScale + delta * 0.1
      const limitedScale = Math.max(0.1, Math.min(2, newScale)) // 允许更小的缩放比例
      
      // 调整位置以保持中心点不变
      if (prevScale !== limitedScale) {
        const scaleFactor = limitedScale / prevScale
        const offsetX = containerCenterX - (containerCenterX - position.x) * scaleFactor
        const offsetY = containerCenterY - (containerCenterY - position.y) * scaleFactor
        
        // 使用 requestAnimationFrame 减少卡顿
        requestAnimationFrame(() => {
          setPosition({ x: offsetX, y: offsetY })
        })
      }
      
      return limitedScale
    })
  }

  // 处理鼠标滚轮事件
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    handleZoom(delta)
  }

  // 重置视图
  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }
  
  // 自动居中视图
  const centerView = () => {
    if (!treeContainerRef.current || !treeContentRef.current) return
    
    const container = treeContainerRef.current
    const content = treeContentRef.current
    
    const containerRect = container.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    
    const centerX = (containerRect.width - contentRect.width * scale) / 2
    const centerY = (containerRect.height - contentRect.height * scale) / 2
    
    setPosition({ x: centerX, y: centerY })
  }
  
  // 当搜索树变化时自动居中
  useEffect(() => {
    if (searchTree) {
      // 给DOM一点时间渲染
      setTimeout(centerView, 100)
    }
  }, [searchTree])

  // 清理副作用
  useEffect(() => {
    return () => {
    if (animationRef.current !== null) {
      window.clearInterval(animationRef.current)
    }
    }
  }, [])

  return (
    <div style={{
      padding: '20px',
      minHeight: 'calc(100vh - 115px)',
      display: 'flex',
      flexDirection: 'column',
      background: '#000000',
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
          animation: none;
        }
        .winning-cell {
          animation: glow 1s infinite;
        }
      `}</style>

      <h2 style={{
        textAlign: 'center',
        color: 'white',
        marginBottom: '20px',
        fontSize: '28px',
        fontWeight: '700',
      }}>
        算法演示：MiniMax + Alpha-Beta 剪枝
      </h2>

      <div style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        {/* 左侧 - 算法说明 */}
        <div style={{
          flex: '1',
          minWidth: '300px',
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: 1,
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
            <p>本演示展示了 <strong>MiniMax 算法 + Alpha-Beta 剪枝</strong> 在井字棋游戏中的应用过程。</p>
            
            <h4>MiniMax 算法</h4>
            <p>MiniMax 是一种递归算法，用于在双人游戏中决定最佳走法。它通过模拟所有可能的游戏状态，并假设双方都会做出最优决策。</p>
            <ul>
              <li>最大化玩家（AI）尝试最大化得分</li>
              <li>最小化玩家（人类）尝试最小化得分</li>
            </ul>
            
            <h4>Alpha-Beta 剪枝</h4>
            <p>Alpha-Beta 剪枝通过跳过不会影响最终决策的分支，大大提高了算法效率。</p>
            <ul>
              <li>Alpha: 最大化玩家的最佳选择</li>
              <li>Beta: 最小化玩家的最佳选择</li>
              <li>当 Beta ≤ Alpha 时，可以安全地剪枝</li>
            </ul>
            
            <h4>可视化说明</h4>
            <ul>
              <li><span style={{color: '#ffeb3b', fontWeight: 'bold'}}>黄色节点</span>: 当前评估的节点</li>
              <li><span style={{color: '#ffcdd2', fontWeight: 'bold'}}>红色节点</span>: 被剪枝的节点</li>
              <li><span style={{color: '#bbdefb', fontWeight: 'bold'}}>蓝色节点</span>: 最佳移动路径</li>
              <li><span style={{color: '#e8f5e9', fontWeight: 'bold'}}>绿色节点</span>: 叶节点（终止状态）</li>
            </ul>
          </div>
        </div>

        {/* 中间 - 棋盘 */}
        <div style={{
          flex: '1',
          minWidth: '400px',
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h3 style={{
            marginBottom: '20px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700',
          }}>
            井字棋对弈
          </h3>

          {/* 游戏状态提示 */}
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
                {showingAnimation ? 'AI 正在分析...' : 'AI 思考中'}
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

          {/* 棋盘 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '25px',
            background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
            padding: '12px',
            borderRadius: '16px',
            width: '300px',
            height: '300px',
            margin: '0 auto 25px',
            boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1)'
          }}>
            {board.map((cell, index) => {
            const isCellDisabled = gameOver || cell !== null || isAIThinking || showingAnimation
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
                  width: '90px',
                  height: '90px',
                  fontSize: '48px',
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
                  if (cell || gameOver || isAIThinking || showingAnimation) {
                    return
                  }

                  const currentTarget = event.currentTarget
                  currentTarget.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                  currentTarget.style.boxShadow = '0 8px 16px rgba(0,82,217,0.3)'
                }}
                onMouseLeave={(event) => {
                  if (cell || gameOver || isAIThinking || showingAnimation) {
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

          {/* 游戏控制 */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '15px', 
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '15px',
            borderRadius: '12px',
          }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>游戏模式</h4>
              <Radio.Group
                value={isEndgameMode}
                onChange={(value) => {
                  if (typeof value === 'boolean') {
                    setIsEndgameMode(value)
                  }
                }}
                disabled={gameStarted}
              >
                <Radio.Button value={true}>残局模式</Radio.Button>
                <Radio.Button value={false}>完整对局</Radio.Button>
              </Radio.Group>
            </div>
            
            {isEndgameMode && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>残局深度</h4>
                <Radio.Group
                  value={endgameDepth}
                  onChange={(value) => {
                    if (typeof value === 'number') {
                      setEndgameDepth(value)
                    }
                  }}
                  disabled={gameStarted}
                >
                  <Radio.Button value={2}>简单 (2步)</Radio.Button>
                  <Radio.Button value={3}>中等 (3步)</Radio.Button>
                  <Radio.Button value={4}>复杂 (4步)</Radio.Button>
                </Radio.Group>
              </div>
            )}
            
            {!isEndgameMode && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>先手选择</h4>
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
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!gameStarted ? (
              <Button
                theme="primary"
                onClick={startGame}
                style={{
                  borderRadius: '8px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                {isEndgameMode ? '生成残局' : '开始游戏'}
              </Button>
            ) : (
              <Button
                theme="danger"
                onClick={resetGame}
                style={{
                  borderRadius: '8px',
                  fontWeight: '600',
                }}
                disabled={isAIThinking}
              >
                重新开始
              </Button>
            )}
          </div>
        </div>

        {/* 右侧 - 动画控制 */}
        <div style={{
          flex: '1',
          minWidth: '300px',
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: 1,
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
            🎬 动画控制
          </h3>

          {searchTree ? (
            <>
              {renderStepInfo()}
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}>
                <Button
                  theme="default"
                  onClick={stepBackward}
                  disabled={currentStep <= 0 || showingAnimation}
                  style={{ borderRadius: '8px' }}
                >
                  上一步
                </Button>
                
                {showingAnimation ? (
                  <Button
                    theme="warning"
                    onClick={stopAnimation}
                    style={{ borderRadius: '8px' }}
                  >
                    暂停
                  </Button>
                ) : (
                  <Button
                    theme="success"
                    onClick={playSearchAnimation}
                    disabled={totalSteps === 0}
                    style={{ borderRadius: '8px' }}
                  >
                    播放
                  </Button>
                )}
                
                <Button
                  theme="default"
                  onClick={stepForward}
                  disabled={currentStep >= totalSteps - 1 || showingAnimation}
                  style={{ borderRadius: '8px' }}
                >
                  下一步
                </Button>
              </div>
              
              <div style={{
                marginBottom: '20px',
              }}>
                <div style={{ marginBottom: '5px', fontSize: '14px' }}>动画速度</div>
                <Radio.Group
                  value={animationSpeed}
                  onChange={(value) => {
                    if (typeof value === 'number') {
                      setAnimationSpeed(value)
                    }
                  }}
                  disabled={showingAnimation}
                >
                  <Radio.Button value={2000}>慢速</Radio.Button>
                  <Radio.Button value={1000}>中速</Radio.Button>
                  <Radio.Button value={500}>快速</Radio.Button>
                </Radio.Group>
              </div>
              
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '10px',
              }}>
                当前进度: {currentStep + 1} / {totalSteps}
              </div>
              
              <div style={{
                width: '100%',
                height: '10px',
                background: '#f0f0f0',
                borderRadius: '5px',
                overflow: 'hidden',
                marginBottom: '20px',
              }}>
                <div style={{
                  width: `${((currentStep + 1) / totalSteps) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '5px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#999',
              fontSize: '16px',
              textAlign: 'center',
              padding: '0 20px',
            }}>
              开始游戏并等待 AI 落子，<br />
              将在此处显示搜索树动画
            </div>
          )}
        </div>
      </div>

      {/* 搜索树可视化 */}
      <div style={{
        marginTop: '30px',
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden', // 改为 hidden 以便控制内部内容
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
          🌳 搜索树可视化
        </h3>
        
        {/* 缩放控制按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '10px',
        }}>
          <Button
            theme="default"
            size="small"
            onClick={() => handleZoom(1)}
            style={{ borderRadius: '4px' }}
          >
            放大 +
          </Button>
          <Button
            theme="default"
            size="small"
            onClick={() => handleZoom(-1)}
            style={{ borderRadius: '4px' }}
          >
            缩小 -
          </Button>
          <Button
            theme="default"
            size="small"
            onClick={resetView}
            style={{ borderRadius: '4px' }}
          >
            重置视图
          </Button>
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            缩放: {Math.round(scale * 100)}%
          </div>
        </div>
        
        {/* 拖拽提示 */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#999',
          marginBottom: '10px',
        }}>
          提示: 可拖拽移动视图，使用鼠标滚轮或按钮缩放
        </div>
        
        {/* 可拖拽和缩放的容器 */}
        <div 
          style={{
            position: 'relative',
            height: '400px', // 固定高度
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            border: '1px solid #eee',
            borderRadius: '8px',
            background: '#fafafa',
            userSelect: 'none', // 防止拖动时选中文本
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onWheel={handleWheel}
          ref={treeContainerRef}
        >
          <div 
            ref={treeContentRef}
            style={{
              position: 'absolute',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0', // 从左上角开始变换，避免缩放时位置偏移
              transition: isDragging ? 'none' : 'transform 0.1s ease',
              display: 'inline-block', // 使容器大小适应内容
              padding: '20px',
              willChange: 'transform', // 优化性能
            }}
          >
            {searchTree ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                minWidth: '300px', // 确保即使在小比例下也有最小宽度
              }}>
                {renderTreeNode(
                  searchTree, 
                  0, 
                  searchSteps[currentStep]?.id === searchTree.id
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '300px',
                height: '200px',
                color: '#999',
                fontSize: '16px',
              }}>
                开始游戏并等待 AI 落子，将在此处显示搜索树
              </div>
            )}
          </div>
          
          {/* 添加缩放指示器 */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}>
            {Math.round(scale * 100)}%
          </div>
          
          {/* 添加居中按钮 */}
          <Button
            theme="default"
            size="small"
            onClick={centerView}
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              borderRadius: '4px',
              opacity: 0.8,
              zIndex: 10,
            }}
          >
            居中视图
          </Button>
        </div>
      </div>

      {/* 结果对话框 */}
      <Dialog
        visible={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        destroyOnClose
        showOverlay
        closeOnOverlayClick
        theme="info"
        header={
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: resultInfo.color
          }}>
            {resultInfo.title}
          </div>
        }
        footer={
          <Button
            theme="primary"
            onClick={() => {
              setShowResultDialog(false)
              resetGame()
            }}
            style={{
              borderRadius: '8px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            再来一局
          </Button>
        }
      >
        <div style={{
          padding: '20px',
          textAlign: 'center',
          fontSize: '18px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>{resultInfo.emoji}</div>
          <div>{resultInfo.message}</div>
        </div>
      </Dialog>
    </div>
  )
}