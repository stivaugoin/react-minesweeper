import React, { Component } from "react";
import classnames from "classnames";

function getSibblings(row, cell) {
  return [
    [+row - 1, +cell - 1],
    [+row - 1, +cell],
    [+row - 1, +cell + 1],
    [+row, +cell - 1],
    [+row, +cell + 1],
    [+row + 1, +cell - 1],
    [+row + 1, +cell],
    [+row + 1, +cell + 1]
  ].filter(([r, c]) => r >= 0 && c >= 0 && r < 9 && c < 9);
}

class App extends Component {
  constructor() {
    super();

    this.state = {
      board: [],
      cellOpened: 0,
      isLose: false,
      isPlaying: true,
      isWin: false
    };
  }

  async componentDidMount() {
    await this.initBoard();
  }

  initBoard = () => {
    // Create board
    const board = [...Array(9)].map((row, rowIndex) =>
      [...Array(9)].map((cell, cellIndex) => {
        return {
          id: `${rowIndex}-${cellIndex}`,
          isOpen: false,
          sibblingBomb: 0
        };
      })
    );

    // Place bomb
    this.getBombsPosition().forEach(([row, cell]) => {
      const currCell = board[row][cell];
      delete currCell.sibblingBomb;
      board[row][cell] = { ...currCell, isBomb: true };

      // Calculate sibblings
      getSibblings(row, cell).forEach(sibbling => {
        const currCell = board[sibbling[0]][sibbling[1]];
        const currSibbling = currCell.sibblingBomb;
        board[sibbling[0]][sibbling[1]] = {
          ...currCell,
          sibblingBomb: currSibbling + 1
        };
      });
    });

    this.setState({
      board,
      cellOpened: 0,
      isLose: false,
      isPlaying: true,
      isWin: false
    });
  };

  getBombsPosition = () => {
    const bombs = [];
    while (bombs.length < 10) {
      const row = Math.floor(Math.random() * 9);
      const cell = Math.floor(Math.random() * 9);

      if (
        !bombs.some(
          bomb => JSON.stringify(bomb) === JSON.stringify([row, cell])
        )
      ) {
        bombs.push([row, cell]);
      }
    }

    return bombs;
  };

  openCell = ({ row, cell }) => {
    if (!this.state.board[row][cell].isOpen) {
      this.setState(prevState => {
        const state = { ...prevState };

        state.board[row][cell] = { ...state.board[row][cell], isOpen: true };
        const nb = state.board.reduce((acc, board) => {
          return acc + board.filter(b => b.isOpen).length;
        }, 0);
        state.cellOpened = nb;

        if (nb === 71) {
          state.isWin = true;
          state.isPlaying = false;
        }

        return {
          ...state
        };
      });
    }
  };

  openOtherCellWithoutSibbling = (board, [row, cell]) => {
    const newBoard = JSON.parse(JSON.stringify(board));
    const otherEmptySibblings = [];

    function loopSibbling(row, cell) {
      const sibblings = getSibblings(row, cell).filter(sibbling => {
        const cellInfo = board[sibbling[0]][sibbling[1]];
        return !cellInfo.isBomb;
      });

      if (sibblings.length > 0) {
        sibblings.forEach(sibbling => {
          const alreadyExists = otherEmptySibblings.some(
            s =>
              JSON.stringify(s) === JSON.stringify([sibbling[0], sibbling[1]])
          );
          if (!alreadyExists) {
            otherEmptySibblings.push([sibbling[0], sibbling[1]]);

            if (board[sibbling[0]][sibbling[1]].sibblingBomb === 0) {
              loopSibbling(sibbling[0], sibbling[1]);
            }
          }
        });
      }
    }

    loopSibbling(row, cell);

    otherEmptySibblings.forEach(sibbling => {
      const currCell = newBoard[sibbling[0]][sibbling[1]];
      newBoard[sibbling[0]][sibbling[1]] = {
        ...currCell,
        isOpen: true
      };
    });

    this.setState(prevState => {
      const nb = newBoard.reduce((acc, board) => {
        return acc + board.filter(b => b.isOpen).length;
      }, 0);
      return {
        ...prevState,
        board: newBoard,
        cellOpened: nb
      };
    });
  };

  handleClick = event => {
    const { id } = event.target;
    const [row, cell] = id.split("-");

    const cellInfo = this.state.board[row][cell];

    if (cellInfo.isOpen) {
      return;
    }

    if (cellInfo.isBomb) {
      this.setState({ isLose: true, isPlaying: false });
      return;
    }

    if (cellInfo.sibblingBomb === 0) {
      this.openOtherCellWithoutSibbling(this.state.board, [row, cell]);
    }
    this.openCell({ row, cell });

    if (this.state.cellOpened === 71) {
      this.setState({ isWin: true, isPlaying: false });
    }
  };

  handleReset = () => {
    this.initBoard();
  };

  isBomb = data => {
    const [row, cell] = data.id.split("-");
    return this.state.board[row][cell].isBomb;
  };

  isOpen = data => {
    const [row, cell] = data.id.split("-");
    return this.state.board[row][cell].isOpen;
  };

  render() {
    const { board, isLose, isPlaying, isWin } = this.state;

    return (
      <div className="game">
        <h1>Minesweeper React</h1>

        {isLose && (
          <div className="lose">
            <h1>You Lose</h1>
            <div>
              <button onClick={this.handleReset}>Reset</button>
            </div>
          </div>
        )}
        {isWin && (
          <div className="win">
            <h1>You Win</h1>
            <div>
              <button onClick={this.handleReset}>Reset</button>
            </div>
          </div>
        )}
        {isPlaying && (
          <div className="board">
            {board.map((row, rowIndex) => (
              <div className="row" key={rowIndex}>
                {row.map(cell => (
                  <div
                    className={classnames("cell", {
                      isOpen: this.isOpen(cell),
                      isBomb: this.isBomb(cell)
                    })}
                    key={cell.id}
                    id={cell.id}
                    onClick={this.handleClick}
                  >
                    {cell.sibblingBomb > 0 && this.isOpen(cell)
                      ? cell.sibblingBomb
                      : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default App;
