(function () {
    "use strict";

    var doubleClickTimeout = null;
    var timer = null;

    var $body;

    var $difficulty;
    var $replay;

    var $result;
    var $time;
    var $resumePause;

    var $grid;

    window.onload = onload;
    function onload() {
        $difficulty = document.getElementById('difficulty');
        $difficulty.addEventListener('change', onDifficultyChange);

        $replay = document.getElementById('replay')
        $replay.addEventListener('click', onReplay);

        $result = document.getElementById('result');
        $time = document.getElementById('time');

        $resumePause = document.getElementById('resume-pause');
        $resumePause.addEventListener('click', function () {
            onResumePause();
        });

        bootstrap();
    }

    function bootstrap() {
        var difficulty = $difficulty.options[$difficulty.selectedIndex].value;
        var grid = createNewGame(difficulty);
        grid.onGameOver(getOnGameEndCallback('Perdu'));
        grid.onGameFinished(getOnGameEndCallback('Gagné !'));

        $grid = document.createElement('div');
        createDOMGrid(grid, $grid);
        updateDOMGrid(grid, $grid);
    }



    function onFirstClick() {
        timer = new Timer();
        timer.onSecondChange(updateTimer);
        timer.start();

        if ($resumePause.hasAttribute('disabled')) { $resumePause.removeAttribute('disabled'); }
        $replay.removeAttribute('disabled');
    }

    function onDifficultyChange() {
        $replay.removeAttribute('disabled');
    }

    function onReplay() {
        $body.removeChild($grid);
        $grid = null;

        $replay.setAttribute('disabled', 'disabled');
        $resumePause.textContent = 'Pause';
        $resumePause.setAttribute('disabled', 'disabled');

        $result.textContent = '';

        timer.stop();
        timer = null;
        $time.textContent = '-:--';

        bootstrap();
    }

    function onResumePause() {
        if (timer.isPaused) {
            timer.resume();
            $resumePause.textContent = 'Pause';
        } else {
            timer.pause();
            $resumePause.textContent = 'Continuer';
        }
    }

    function getOnGameEndCallback(message) {
        return function onGameEnd() {
            $result.textContent = message;

            if ($replay.hasAttribute('disabled')) { $replay.removeAttribute('disabled'); }
            if (!$resumePause.hasAttribute('disabled')) { $resumePause.setAttribute('disabled', 'disabled'); }

            timer.pause();
        }
    }



    function createNewGame(difficulty) {
        switch (difficulty) {
            default:
            case 'easy': return new Grid(10, 10, 5);
            case 'medium': return new Grid(15, 15, 10);
            case 'hard': return new Grid(25, 25, 15);
        }
    }

    /**
     * Creates the Grid's HTML Elements and appends it at the end of the body element.
     * @param {Grid} grid The Grid instance for which to create the HTML Elements.
     * @param {HTMLElement} $grid The HTML Element created when window was loaded.
     */
    function createDOMGrid(grid, $grid) {
        for (var i = 0; i < grid.height; i++) {
            // Create the row element: <div class="row"> ... </div>.
            var $row = document.createElement('div');
            $row.classList.add('row');

            for (var j = 0; j < grid.width; j++) {
                // Create the cell element: <div class="cell"><span> ... </span></div>.
                var $cell = document.createElement('div');
                $cell.classList.add('cell');
                $cell.appendChild(document.createElement('span'));

                // Register an event listener when the user clicks on a cell.
                (function (i, j) {
                    $cell.addEventListener('click', function onClick() {
                        if (doubleClickTimeout === null) {
                            doubleClickTimeout = setTimeout(function () {
                                simpleClick(i, j);
                            }, 200);
                        } else {
                            clearTimeout(doubleClickTimeout);
                            doubleClick();
                        }

                        function simpleClick(i, j, options) {
                            if (grid.status === Grid.GAME_OVER) { return; }
                            if (timer === null) { onFirstClick(); }
                            if (timer.isPaused === true) { return; }
                            doubleClickTimeout = null;
                            grid.play(i, j);
                            if (!options || options.skipUpdate === false) {
                                updateDOMGrid(grid, $grid);
                            }
                        }

                        function doubleClick() {
                            simpleClick(i - 1, j - 1, { skipUpdate: true });
                            simpleClick(i - 1, j, { skipUpdate: true });
                            simpleClick(i - 1, j + 1, { skipUpdate: true });

                            simpleClick(i, j - 1, { skipUpdate: true });
                            simpleClick(i, j + 1, { skipUpdate: true });

                            simpleClick(i + 1, j - 1, { skipUpdate: true });
                            simpleClick(i + 1, j, { skipUpdate: true });
                            simpleClick(i + 1, j + 1, { skipUpdate: true });

                            updateDOMGrid(grid, $grid);
                        }
                    });

                    $cell.addEventListener('contextmenu', function onContextmenu(event) {
                        if (grid.status === Grid.GAME_OVER || timer.isPaused) { return; }
                        if (timer === null) { onFirstClick(); }
                        event.preventDefault();
                        grid.toggleFlag(i, j);
                        updateDOMGrid(grid, $grid);
                    }, true);
                })(i, j);

                // Append the cell in the row.
                $row.appendChild($cell);
            }

            // Append the row in the grid.
            $grid.appendChild($row);
        }

        $grid.classList.add('mines-grid');
        $body = document.getElementsByTagName('body')[0];

        // Actually adding the grid's object model into the DOM.
        $body.appendChild($grid);
    }

    function updateDOMGrid(grid, $grid) {
        for (var i = 0; i < grid.height; i++) {
            var $row = $grid.children[i];
            for (var j = 0; j < grid.width; j++) {
                var $cell = $row.children[j];
                if (grid.flags[i][j] === true) {
                    // Display a flag on a cover.
                    $cell.children[0].textContent = 'F';
                    $cell.classList.add('cover');
                    $cell.classList.add('flag');
                } else if (grid.covers[i][j] === true) {
                    // Hide the cell with a cover.
                    $cell.children[0].textContent = 'o';
                    $cell.classList.add('cover');
                    $cell.classList.remove('flag');
                } else {
                    // Display the board's value and replace zeros by dots.
                    $cell.children[0].textContent = grid.board[i][j] === 0 ? '.' : grid.board[i][j];
                    $cell.classList.remove('cover');
                }
            }
        }
    }

    function updateTimer(diff) {
        $time.textContent = diff.getMinutes() + ':' + pad(diff.getSeconds());
    }



    /**
     * @description Yeah! It's me! The mythical pad function.
     * @param {number} n A number.
     * @return {string} Returns '00', '01', '02', ... '10', '11' and so on.
     */
    function pad(n) {
        return (n === 0 ? '00' : n < 10 ? '0' + n : '' + n);
    }

})();
