
Grid.GAME_OVER = 'GAME_OVER';
Grid.GAME_FINISHED = 'GAME_FINISHED';
Grid.GAME_ALIVE = 'GAME_ALIVE';

/**
 * Grid constructor function.
 * Initialize the board with random Mines, about 10% of the cells.
 * @param {number} height The Grid's desired height.
 * @param {number} width The Grid's desired width.
 * @param {number} rate A number between 5 and 25 to indicate the probability of a cell to be a Mine.
 */
function Grid(height, width, rate) {
    this.height = height;
    this.width = width;
    this.rate = (rate < 5 || rate > 25 ? 5 : rate);

    this.board = [];
    this.covers = [];
    this.flags = [];

    this.status = Grid.GAME_ALIVE;
    this.onGameOverCallback = function () { };
    this.onGameFinishedCallback = function () { };

    this._counts = {
        mines: 0,
        uncoveredCells: 0,
        totalCells: this.height * this.width,
    };

    for (var i = 0; i < this.height; i++) {
        this.board[i] = [];
        this.covers[i] = [];
        this.flags[i] = [];
        for (var j = 0; j < this.width; j++) {
            this.board[i][j] = Math.floor(Math.random() * 100) < this.rate
                ? (this._counts.mines++ , 'M')
                : 0;
            this.covers[i][j] = true;
            this.flags[i][j] = false;
        }
    }

    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            if (this.board[i][j] === 'M') {
                setMineCount.call(this, i - 1, j - 1);
                setMineCount.call(this, i - 1, j);
                setMineCount.call(this, i - 1, j + 1);

                setMineCount.call(this, i, j - 1);
                // Skip the current cell (i, j).
                setMineCount.call(this, i, j + 1);

                setMineCount.call(this, i + 1, j - 1);
                setMineCount.call(this, i + 1, j);
                setMineCount.call(this, i + 1, j + 1);
            }
        }
    }

    function setMineCount(x, y) {
        if (this.areValidCoordinates(x, y) && this.board[x][y] !== 'M') {
            this.board[x][y]++;
        }
    }
}

Grid.prototype.play = function play(x, y) {
    if (!this.areValidCoordinates(x, y)) { return; }
    if (this.flags[x][y] === true) { return; }

    // If the user clicks on a Mine, the game is over.
    if (this.board[x][y] === 'M') {
        this.status = Grid.GAME_OVER;
        try {
            this.onGameOverCallback();
        } catch (error) {
            console.log('An error occured in the onGameOver callback:', error);
        }
    }

    // If the cell is already uncovered, return. Otherwise, uncover the cell.
    if (this.covers[x][y] === false) {
        return;
    } else {
        this.covers[x][y] = false;
        this._counts.uncoveredCells++;

        // If the cell has no nearing Mine, auto-click on the adjacent cells.
        if (this.board[x][y] === 0) {
            this.play(x - 1, y - 1);
            this.play(x - 1, y);
            this.play(x - 1, y + 1);

            this.play(x, y - 1);
            // Skip the current cell (x, y).
            this.play(x, y + 1);

            this.play(x + 1, y - 1);
            this.play(x + 1, y);
            this.play(x + 1, y + 1);
        }
    }

    if (this.status !== Grid.GAME_FINISHED) {
        if (this._counts.totalCells === this._counts.mines + this._counts.uncoveredCells) {
            this.status = Grid.GAME_FINISHED;
            try {
                this.onGameFinishedCallback();
            } catch (error) {
                console.log('An error occured in the onGameFinished callback:', error);
            }
        }
    }
};

Grid.prototype.toggleFlag = function toggleFlag(x, y) {
    if (this.areValidCoordinates(x, y))  {
        if (this.flags[x][y] === true) {
            this.flags[x][y] = false;
        } else if (this.covers[x][y] === true) {
            this.flags[x][y] = true;
        } else {
            // Flags can only be placed on covered cells.
        }
    }
}

Grid.prototype.areValidCoordinates = function areValidCoordinates(x, y) {
    return x >= 0 && x < this.height && y >= 0 && y < this.width;
};

Grid.prototype.onGameOver = function onGameOver(callback) {
    if (typeof callback !== 'function') { throw TypeError('callback must be a function.'); }
    this.onGameOverCallback = callback;
};

Grid.prototype.onGameFinished = function onGameFinished(callback) {
    if (typeof callback !== 'function') { throw TypeError('callback must be a function.'); }
    this.onGameFinishedCallback = callback;
};
