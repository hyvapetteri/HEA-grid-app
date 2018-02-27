"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GridDirection;
(function (GridDirection) {
    GridDirection["Up"] = "up";
    GridDirection["Down"] = "down";
    GridDirection["Right"] = "right";
    GridDirection["Left"] = "left";
})(GridDirection = exports.GridDirection || (exports.GridDirection = {}));
var TrialAnswer;
(function (TrialAnswer) {
    TrialAnswer["Correct"] = "correct";
    TrialAnswer["Wrong"] = "wrong";
})(TrialAnswer = exports.TrialAnswer || (exports.TrialAnswer = {}));
var GridTracker = (function () {
    function GridTracker(params) {
        this.grid = params.g;
        this.m_up = params.m_up;
        this.n_down = params.n_down;
        this.answerBuffer = new Array(Math.max(params.m_up, params.n_down));
        for (var i = 0; i < this.answerBuffer.length; i++) {
            this.answerBuffer[i] = null;
        }
        this.n_max_reversals = params.n_revs;
        this.n_max_steps = params.n_step;
        this.initialized = false;
    }
    GridTracker.prototype.getLastNAnswers = function (n) {
        var i = Math.min(this.answerBuffer.length, Math.abs(n));
        return this.answerBuffer.slice(-1 * i);
    };
    GridTracker.prototype.clearAnswerBuffer = function () {
        this.answerBuffer = new Array(this.answerBuffer.length);
        for (var i = 0; i < this.answerBuffer.length; i++) {
            this.answerBuffer[i] = null;
        }
    };
    GridTracker.prototype.getStatus = function () {
        return this.status;
    };
    GridTracker.prototype.getHistory = function () {
        return this.history;
    };
    GridTracker.prototype.getStepsize = function () {
        return this.status.stepsize;
    };
    GridTracker.prototype.setStepsize = function (xstep, ystep) {
        this.status.stepsize = [xstep, ystep];
    };
    GridTracker.prototype.initialize = function (x, y) {
        this.status = {
            xidx: x,
            yidx: y,
            stepsize: [1, 1],
            direction: GridDirection.Up,
            adjust_difficulty: 0,
            finished: false
        };
        this.history = [];
        this.reversal_counter = 0;
        this.initialized = true;
    };
    GridTracker.prototype.updatePosition = function (ans) {
        if (!this.initialized) {
            throw new Error('Tracker not initialized.');
        }
        if (this.status.finished) {
            throw new Error('Tracker has already finished. Re-initialize to start a new run.');
        }
        this.answerBuffer.shift();
        this.answerBuffer.push(ans);
        this.status.answer = ans;
        console.log(this.answerBuffer);
        // compute the m-up-n-down rule
        if (ans == TrialAnswer.Correct) {
            var n_down_buffer = this.getLastNAnswers(this.n_down);
            if (n_down_buffer.every(function (a) { return a == TrialAnswer.Correct; })) {
                console.log('down rule, increase difficulty');
                this.status.adjust_difficulty = -1; // negative -> go down = increase difficulty
                this.clearAnswerBuffer();
            }
            else {
                this.status.adjust_difficulty = 0; // not yet n correct answers, keep going
            }
        }
        else if (ans == TrialAnswer.Wrong) {
            var m_up_buffer = this.getLastNAnswers(this.m_up);
            if (m_up_buffer.every(function (a) { return a == TrialAnswer.Wrong; })) {
                console.log('up rule, decrease difficulty');
                this.status.adjust_difficulty = 1; // positive ->  go up = decrease difficulty
                this.clearAnswerBuffer();
            }
            else {
                this.status.adjust_difficulty = 0;
            }
        }
        var new_yidx = this.status.yidx;
        var new_xidx = this.status.xidx;
        this.status.reversal = false;
        if (this.status.adjust_difficulty != 0) {
            // determine next grid direction
            if (this.status.adjust_difficulty < 0) {
                if (this.status.direction == GridDirection.Up) {
                    this.status.direction = GridDirection.Left;
                }
                else if (this.status.direction == GridDirection.Right) {
                    this.status.direction = GridDirection.Down;
                } // otherwise current direction is down or left -> keep going
            }
            else if (this.status.adjust_difficulty > 0) {
                if (this.status.direction == GridDirection.Down) {
                    this.status.direction = GridDirection.Right;
                }
                else if (this.status.direction == GridDirection.Left) {
                    this.status.direction = GridDirection.Up;
                } // otherwise current direction is up or right -> keep going
            }
            // determine new position towards the chosen direction
            switch (this.status.direction) {
                case GridDirection.Up:
                    new_yidx = new_yidx + this.status.stepsize[1];
                    break;
                case GridDirection.Right:
                    new_xidx = new_xidx + this.status.stepsize[0];
                    break;
                case GridDirection.Down:
                    new_yidx = new_yidx - this.status.stepsize[1];
                    break;
                case GridDirection.Left:
                    new_xidx = new_xidx - this.status.stepsize[0];
                    break;
            }
            // check if we reached the grid boundaries
            if (new_yidx > this.grid.getMaxIndices()[1]) {
                console.log('Grid: y max reached');
                if (this.status.direction == GridDirection.Up) {
                    // max y value reached, change direction to right, i.e. keep
                    // decreasing difficulty
                    new_yidx = this.grid.getMaxIndices()[1];
                    this.status.direction = GridDirection.Right;
                    this.status.reversal = true;
                    this.reversal_counter = this.reversal_counter + 1;
                    new_xidx = new_xidx + this.status.stepsize[0];
                    if (new_xidx > this.grid.getMaxIndices()[0]) {
                        throw new Error('Grid: Upper right corner reached.');
                    }
                }
                else {
                    throw new Error('Grid: unexpected direction when reaching upper y boundary.');
                }
            }
            else if (new_yidx < 0) {
                console.log('Grid: y min reached');
                if (this.status.direction == GridDirection.Down) {
                    // min y value reached, change direction to left, i.e. keep
                    // increasing difficulty
                    new_yidx = 0;
                    this.status.direction = GridDirection.Left;
                    this.status.reversal = true;
                    this.reversal_counter = this.reversal_counter + 1;
                    new_xidx = new_xidx - this.status.stepsize[0];
                    if (new_xidx < 0) {
                        throw new Error('Grid: Lower left corner reached.');
                    }
                }
                else {
                    throw new Error('Grid: unexpected direction when reaching lower y boundary.');
                }
            }
            else if (new_xidx > this.grid.getMaxIndices()[0]) {
                console.log('Grid: x max reached');
                if (this.status.direction == GridDirection.Right) {
                    // max x value reached, change direction to up, i.e. keep
                    // decreasing difficulty
                    new_xidx = this.grid.getMaxIndices()[0];
                    this.status.direction = GridDirection.Up;
                    this.status.reversal = true;
                    this.reversal_counter = this.reversal_counter + 1;
                    new_yidx = new_yidx + this.status.stepsize[1];
                    if (new_yidx > this.grid.getMaxIndices()[1]) {
                        throw new Error('Grid: Upper right corner reached.');
                    }
                }
                else {
                    throw new Error('Grid: unexpected direction when reaching upper x boundary.');
                }
            }
            else if (new_xidx < 0) {
                console.log('Grid: x min reached');
                if (this.status.direction == GridDirection.Left) {
                    // min x value reached, change direction to down, i.e. keep
                    // increasing difficulty
                    new_xidx = 0;
                    this.status.direction = GridDirection.Down;
                    this.status.reversal = true;
                    this.reversal_counter = this.reversal_counter + 1;
                    new_yidx = new_yidx - this.status.stepsize[1];
                    if (new_yidx < 0) {
                        throw new Error('Grid: Lower left corner reached.');
                    }
                }
                else {
                    throw new Error('Grid: unexpected direction when reaching lower x boundary.');
                }
            }
        }
        // check stopping conditions
        if (this.reversal_counter >= this.n_max_reversals) {
            this.status.finished = true;
        }
        if (this.history.length >= this.n_max_steps - 1) {
            this.status.finished = true;
        }
        // save the status to grid history
        var status_clone = Object.assign({}, this.status);
        this.history.push(status_clone);
        // move to new point
        this.status.xidx = new_xidx;
        this.status.yidx = new_yidx;
    };
    GridTracker.prototype.getGrid = function () {
        return this.grid;
    };
    GridTracker.prototype.getCurrentGridParameters = function () {
        return this.grid.getGridValues(this.status.xidx, this.status.yidx);
    };
    return GridTracker;
}());
exports.GridTracker = GridTracker;
var ParamGrid = (function () {
    function ParamGrid(params) {
        if (params.xmax < params.xmin) {
            throw new Error('xmin must be less than xmax');
        }
        this.xlim = [params.xmin, params.xmax];
        if (params.ymax < params.ymin) {
            throw new Error('ymin must be less than ymax');
        }
        this.ylim = [params.ymin, params.ymax];
        this.xresolution = params.xres;
        this.yresolution = params.yres;
        var x_size = Math.floor((params.xmax - params.xmin) / params.xres);
        console.log('X dim size ' + x_size);
        this.xvalues = new Array(x_size);
        this.x_max_idx = x_size - 1;
        for (var i = 0; i <= this.x_max_idx; i++) {
            this.xvalues[i] = params.xmin + i * params.xres;
        }
        //this.xvalues[this.x_max_idx] = params.xmax;
        console.log('x min ' + this.xvalues[0] + ', x max ' + this.xvalues[this.x_max_idx]);
        var y_size = Math.floor((params.ymax - params.ymin) / params.yres);
        console.log('Y dim size ' + y_size);
        this.yvalues = new Array(y_size);
        this.y_max_idx = y_size - 1;
        for (var i = 0; i <= this.y_max_idx; i++) {
            this.yvalues[i] = params.ymin + i * params.yres;
        }
        //this.yvalues[this.y_max_idx] = params.ymax;
        console.log('y min ' + this.yvalues[0] + ', y max ' + this.yvalues[this.y_max_idx]);
    }
    ParamGrid.prototype.printGrid = function () {
        var gridstring = '';
        for (var yi = this.y_max_idx; yi >= 0; yi--) {
            for (var xi = 0; xi <= this.x_max_idx; xi++) {
                gridstring = gridstring + '(' + this.xvalues[xi] + ', ' + this.yvalues[yi] + ') ';
            }
            gridstring = gridstring + ' . ';
        }
        return gridstring;
    };
    ParamGrid.prototype.getXlim = function () {
        return this.xlim;
    };
    ParamGrid.prototype.getMaxIndices = function () {
        return [this.x_max_idx, this.y_max_idx];
    };
    ParamGrid.prototype.getYlim = function () {
        return this.ylim;
    };
    ParamGrid.prototype.getGridValues = function (xidx, yidx) {
        if (xidx > this.x_max_idx) {
            throw new Error('xidx exceeds grid range');
        }
        if (yidx > this.y_max_idx) {
            throw new Error('yidx exceeds grid range');
        }
        return [this.xvalues[xidx], this.yvalues[yidx]];
    };
    return ParamGrid;
}());
exports.ParamGrid = ParamGrid;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdyaWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFZLGFBS1g7QUFMRCxXQUFZLGFBQWE7SUFDdkIsMEJBQVMsQ0FBQTtJQUNULDhCQUFhLENBQUE7SUFDYixnQ0FBZSxDQUFBO0lBQ2YsOEJBQWEsQ0FBQTtBQUNmLENBQUMsRUFMVyxhQUFhLEdBQWIscUJBQWEsS0FBYixxQkFBYSxRQUt4QjtBQUVELElBQVksV0FHWDtBQUhELFdBQVksV0FBVztJQUNyQixrQ0FBbUIsQ0FBQTtJQUNuQiw4QkFBZSxDQUFBO0FBQ2pCLENBQUMsRUFIVyxXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQUd0QjtBQWNEO0lBWUUscUJBQVksTUFBb0Y7UUFDOUYsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDcEUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzlCLENBQUM7UUFFRCxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDckMsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxXQUFX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QztBQUFELENBQUMsQUFsRkQsSUFrRkM7QUFsRlksOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBHcmlkRGlyZWN0aW9uIHtcbiAgVXAgPSBcInVwXCIsXG4gIERvd24gPSBcImRvd25cIixcbiAgUmlnaHQgPSBcInJpZ2h0XCIsXG4gIExlZnQgPSBcImxlZnRcIlxufVxuXG5leHBvcnQgZW51bSBUcmlhbEFuc3dlciB7XG4gIENvcnJlY3QgPSBcImNvcnJlY3RcIixcbiAgV3JvbmcgPSBcIndyb25nXCJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHcmlkVHJhY2tpbmdTdGF0dXMge1xuICB4aWR4OiBudW1iZXI7XG4gIHlpZHg6IG51bWJlcjtcbiAgZGlyZWN0aW9uOiBHcmlkRGlyZWN0aW9uO1xuICBhZGp1c3RfZGlmZmljdWx0eTogbnVtYmVyO1xuICBmaW5pc2hlZDogYm9vbGVhbjtcbiAgYW5zd2VyPzogVHJpYWxBbnN3ZXI7XG4gIGNvcnJlY3Q/OiBib29sZWFuO1xuICBzdGVwc2l6ZT86IFtudW1iZXIsIG51bWJlcl07XG4gIHJldmVyc2FsPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEdyaWRUcmFja2VyIHtcbiAgcHJpdmF0ZSBncmlkOiBQYXJhbUdyaWQ7XG4gIHByaXZhdGUgc3RhdHVzOiBHcmlkVHJhY2tpbmdTdGF0dXM7XG4gIHByaXZhdGUgaGlzdG9yeTogQXJyYXk8R3JpZFRyYWNraW5nU3RhdHVzPjtcbiAgcHJpdmF0ZSBtX3VwOiBudW1iZXI7XG4gIHByaXZhdGUgbl9kb3duOiBudW1iZXI7XG4gIHByaXZhdGUgYW5zd2VyQnVmZmVyOiBBcnJheTxUcmlhbEFuc3dlcnxudWxsPjtcbiAgcHJpdmF0ZSBuX21heF9yZXZlcnNhbHM6IG51bWJlcjtcbiAgcHJpdmF0ZSByZXZlcnNhbF9jb3VudGVyOiBudW1iZXI7XG4gIHByaXZhdGUgbl9tYXhfc3RlcHM6IG51bWJlcjtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZDogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihwYXJhbXM6IHtnOiBQYXJhbUdyaWQsIG1fdXA6IG51bWJlciwgbl9kb3duOiBudW1iZXIsIG5fcmV2czogbnVtYmVyLCBuX3N0ZXA6IG51bWJlcn0pIHtcbiAgICB0aGlzLmdyaWQgPSBwYXJhbXMuZztcbiAgICB0aGlzLm1fdXAgPSBwYXJhbXMubV91cDtcbiAgICB0aGlzLm5fZG93biA9IHBhcmFtcy5uX2Rvd247XG4gICAgdGhpcy5hbnN3ZXJCdWZmZXIgPSBuZXcgQXJyYXkoTWF0aC5tYXgocGFyYW1zLm1fdXAsIHBhcmFtcy5uX2Rvd24pKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYW5zd2VyQnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmFuc3dlckJ1ZmZlcltpXSA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5uX21heF9yZXZlcnNhbHMgPSBwYXJhbXMubl9yZXZzO1xuICAgIHRoaXMubl9tYXhfc3RlcHMgPSBwYXJhbXMubl9zdGVwO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgfVxuXG4gIGdldExhc3ROQW5zd2VycyhuOiBudW1iZXIpOiBUcmlhbEFuc3dlcltdIHtcbiAgICBsZXQgaSA9IE1hdGgubWluKHRoaXMuYW5zd2VyQnVmZmVyLmxlbmd0aCwgTWF0aC5hYnMobikpO1xuICAgIHJldHVybiB0aGlzLmFuc3dlckJ1ZmZlci5zbGljZSgtMSppKTtcbiAgfVxuXG4gIGNsZWFyQW5zd2VyQnVmZmVyKCk6IHZvaWQge1xuICAgIHRoaXMuYW5zd2VyQnVmZmVyID0gbmV3IEFycmF5KHRoaXMuYW5zd2VyQnVmZmVyLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmFuc3dlckJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5hbnN3ZXJCdWZmZXJbaV0gPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGdldFN0YXR1cygpOiBHcmlkVHJhY2tpbmdTdGF0dXMge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cztcbiAgfVxuXG4gIGdldEhpc3RvcnkoKTogR3JpZFRyYWNraW5nU3RhdHVzW10ge1xuICAgIHJldHVybiB0aGlzLmhpc3Rvcnk7XG4gIH1cblxuICBnZXRTdGVwc2l6ZSgpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0dXMuc3RlcHNpemU7XG4gIH1cblxuICBzZXRTdGVwc2l6ZSh4c3RlcDpudW1iZXIsIHlzdGVwOm51bWJlcikge1xuICAgIHRoaXMuc3RhdHVzLnN0ZXBzaXplID0gW3hzdGVwLCB5c3RlcF07XG4gIH1cblxuICBpbml0aWFsaXplKHg6bnVtYmVyLCB5Om51bWJlcikge1xuICAgIHRoaXMuc3RhdHVzID0ge1xuICAgICAgeGlkeDogeCxcbiAgICAgIHlpZHg6IHksXG4gICAgICBzdGVwc2l6ZTogWzEsIDFdLFxuICAgICAgZGlyZWN0aW9uOiBHcmlkRGlyZWN0aW9uLlVwLFxuICAgICAgYWRqdXN0X2RpZmZpY3VsdHk6IDAsXG4gICAgICBmaW5pc2hlZDogZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLmhpc3RvcnkgPSBbXTtcbiAgICB0aGlzLnJldmVyc2FsX2NvdW50ZXIgPSAwO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgdXBkYXRlUG9zaXRpb24oYW5zOiBUcmlhbEFuc3dlcik6IHZvaWQge1xuICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUcmFja2VyIG5vdCBpbml0aWFsaXplZC4nKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdHVzLmZpbmlzaGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyYWNrZXIgaGFzIGFscmVhZHkgZmluaXNoZWQuIFJlLWluaXRpYWxpemUgdG8gc3RhcnQgYSBuZXcgcnVuLicpO1xuICAgIH1cblxuICAgIHRoaXMuYW5zd2VyQnVmZmVyLnNoaWZ0KCk7XG4gICAgdGhpcy5hbnN3ZXJCdWZmZXIucHVzaChhbnMpO1xuICAgIHRoaXMuc3RhdHVzLmFuc3dlciA9IGFucztcblxuICAgIGNvbnNvbGUubG9nKHRoaXMuYW5zd2VyQnVmZmVyKTtcbiAgICAvLyBjb21wdXRlIHRoZSBtLXVwLW4tZG93biBydWxlXG4gICAgaWYgKGFucyA9PSBUcmlhbEFuc3dlci5Db3JyZWN0KSB7XG4gICAgICBsZXQgbl9kb3duX2J1ZmZlciA9IHRoaXMuZ2V0TGFzdE5BbnN3ZXJzKHRoaXMubl9kb3duKTtcbiAgICAgIGlmIChuX2Rvd25fYnVmZmVyLmV2ZXJ5KGEgPT4gYSA9PSBUcmlhbEFuc3dlci5Db3JyZWN0KSkge1xuICAgICAgICBjb25zb2xlLmxvZygnZG93biBydWxlLCBpbmNyZWFzZSBkaWZmaWN1bHR5Jyk7XG4gICAgICAgIHRoaXMuc3RhdHVzLmFkanVzdF9kaWZmaWN1bHR5ID0gLTE7IC8vIG5lZ2F0aXZlIC0+IGdvIGRvd24gPSBpbmNyZWFzZSBkaWZmaWN1bHR5XG4gICAgICAgIHRoaXMuY2xlYXJBbnN3ZXJCdWZmZXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RhdHVzLmFkanVzdF9kaWZmaWN1bHR5ID0gMDsgLy8gbm90IHlldCBuIGNvcnJlY3QgYW5zd2Vycywga2VlcCBnb2luZ1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYW5zID09IFRyaWFsQW5zd2VyLldyb25nKSB7XG4gICAgICBsZXQgbV91cF9idWZmZXIgPSB0aGlzLmdldExhc3ROQW5zd2Vycyh0aGlzLm1fdXApO1xuICAgICAgaWYgKG1fdXBfYnVmZmVyLmV2ZXJ5KGEgPT4gYSA9PSBUcmlhbEFuc3dlci5Xcm9uZykpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3VwIHJ1bGUsIGRlY3JlYXNlIGRpZmZpY3VsdHknKTtcbiAgICAgICAgdGhpcy5zdGF0dXMuYWRqdXN0X2RpZmZpY3VsdHkgPSAxOyAvLyBwb3NpdGl2ZSAtPiAgZ28gdXAgPSBkZWNyZWFzZSBkaWZmaWN1bHR5XG4gICAgICAgIHRoaXMuY2xlYXJBbnN3ZXJCdWZmZXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RhdHVzLmFkanVzdF9kaWZmaWN1bHR5ID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgbmV3X3lpZHggPSB0aGlzLnN0YXR1cy55aWR4O1xuICAgIGxldCBuZXdfeGlkeCA9IHRoaXMuc3RhdHVzLnhpZHg7XG4gICAgdGhpcy5zdGF0dXMucmV2ZXJzYWwgPSBmYWxzZTtcbiAgICBcbiAgICBpZiAodGhpcy5zdGF0dXMuYWRqdXN0X2RpZmZpY3VsdHkgIT0gMCkge1xuICAgICAgLy8gZGV0ZXJtaW5lIG5leHQgZ3JpZCBkaXJlY3Rpb25cbiAgICAgIGlmICh0aGlzLnN0YXR1cy5hZGp1c3RfZGlmZmljdWx0eSA8IDApIHsgLy8gZ28gZG93biA9IGluY3JlYXNlIGRpZmZpY3VsdHlcbiAgICAgICAgICBpZiAodGhpcy5zdGF0dXMuZGlyZWN0aW9uID09IEdyaWREaXJlY3Rpb24uVXApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9IEdyaWREaXJlY3Rpb24uTGVmdDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9PSBHcmlkRGlyZWN0aW9uLlJpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPSBHcmlkRGlyZWN0aW9uLkRvd247XG4gICAgICAgICAgfSAvLyBvdGhlcndpc2UgY3VycmVudCBkaXJlY3Rpb24gaXMgZG93biBvciBsZWZ0IC0+IGtlZXAgZ29pbmdcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0dXMuYWRqdXN0X2RpZmZpY3VsdHkgPiAwKSB7IC8vIGdvIHVwID0gZGVjcmVhc2UgZGlmZmljdWx0eVxuICAgICAgICBpZiAodGhpcy5zdGF0dXMuZGlyZWN0aW9uID09IEdyaWREaXJlY3Rpb24uRG93bikge1xuICAgICAgICAgIHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9IEdyaWREaXJlY3Rpb24uUmlnaHQ7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0dXMuZGlyZWN0aW9uID09IEdyaWREaXJlY3Rpb24uTGVmdCkge1xuICAgICAgICAgIHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9IEdyaWREaXJlY3Rpb24uVXA7XG4gICAgICAgIH0gLy8gb3RoZXJ3aXNlIGN1cnJlbnQgZGlyZWN0aW9uIGlzIHVwIG9yIHJpZ2h0IC0+IGtlZXAgZ29pbmdcbiAgICAgIH1cblxuICAgICAgLy8gZGV0ZXJtaW5lIG5ldyBwb3NpdGlvbiB0b3dhcmRzIHRoZSBjaG9zZW4gZGlyZWN0aW9uXG4gICAgICBzd2l0Y2ggKHRoaXMuc3RhdHVzLmRpcmVjdGlvbikge1xuICAgICAgICBjYXNlIEdyaWREaXJlY3Rpb24uVXA6XG4gICAgICAgICAgbmV3X3lpZHggPSBuZXdfeWlkeCArIHRoaXMuc3RhdHVzLnN0ZXBzaXplWzFdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEdyaWREaXJlY3Rpb24uUmlnaHQ6XG4gICAgICAgICAgbmV3X3hpZHggPSBuZXdfeGlkeCArIHRoaXMuc3RhdHVzLnN0ZXBzaXplWzBdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEdyaWREaXJlY3Rpb24uRG93bjpcbiAgICAgICAgICBuZXdfeWlkeCA9IG5ld195aWR4IC0gdGhpcy5zdGF0dXMuc3RlcHNpemVbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgR3JpZERpcmVjdGlvbi5MZWZ0OlxuICAgICAgICAgIG5ld194aWR4ID0gbmV3X3hpZHggLSB0aGlzLnN0YXR1cy5zdGVwc2l6ZVswXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gY2hlY2sgaWYgd2UgcmVhY2hlZCB0aGUgZ3JpZCBib3VuZGFyaWVzXG4gICAgICBpZiAobmV3X3lpZHggPiB0aGlzLmdyaWQuZ2V0TWF4SW5kaWNlcygpWzFdKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHcmlkOiB5IG1heCByZWFjaGVkJyk7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPT0gR3JpZERpcmVjdGlvbi5VcCkge1xuICAgICAgICAgIC8vIG1heCB5IHZhbHVlIHJlYWNoZWQsIGNoYW5nZSBkaXJlY3Rpb24gdG8gcmlnaHQsIGkuZS4ga2VlcFxuICAgICAgICAgIC8vIGRlY3JlYXNpbmcgZGlmZmljdWx0eVxuICAgICAgICAgIG5ld195aWR4ID0gdGhpcy5ncmlkLmdldE1heEluZGljZXMoKVsxXTtcbiAgICAgICAgICB0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPSBHcmlkRGlyZWN0aW9uLlJpZ2h0O1xuICAgICAgICAgIHRoaXMuc3RhdHVzLnJldmVyc2FsID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnJldmVyc2FsX2NvdW50ZXIgPSB0aGlzLnJldmVyc2FsX2NvdW50ZXIgKyAxO1xuICAgICAgICAgIG5ld194aWR4ID0gbmV3X3hpZHggKyB0aGlzLnN0YXR1cy5zdGVwc2l6ZVswXTtcbiAgICAgICAgICBpZiAobmV3X3hpZHggPiB0aGlzLmdyaWQuZ2V0TWF4SW5kaWNlcygpWzBdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWQ6IFVwcGVyIHJpZ2h0IGNvcm5lciByZWFjaGVkLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWQ6IHVuZXhwZWN0ZWQgZGlyZWN0aW9uIHdoZW4gcmVhY2hpbmcgdXBwZXIgeSBib3VuZGFyeS4nKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChuZXdfeWlkeCA8IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0dyaWQ6IHkgbWluIHJlYWNoZWQnKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9PSBHcmlkRGlyZWN0aW9uLkRvd24pIHtcbiAgICAgICAgICAvLyBtaW4geSB2YWx1ZSByZWFjaGVkLCBjaGFuZ2UgZGlyZWN0aW9uIHRvIGxlZnQsIGkuZS4ga2VlcFxuICAgICAgICAgIC8vIGluY3JlYXNpbmcgZGlmZmljdWx0eVxuICAgICAgICAgIG5ld195aWR4ID0gMDtcbiAgICAgICAgICB0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPSBHcmlkRGlyZWN0aW9uLkxlZnQ7XG4gICAgICAgICAgdGhpcy5zdGF0dXMucmV2ZXJzYWwgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmV2ZXJzYWxfY291bnRlciA9IHRoaXMucmV2ZXJzYWxfY291bnRlciArIDE7XG4gICAgICAgICAgbmV3X3hpZHggPSBuZXdfeGlkeCAtIHRoaXMuc3RhdHVzLnN0ZXBzaXplWzBdO1xuICAgICAgICAgIGlmIChuZXdfeGlkeCA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR3JpZDogTG93ZXIgbGVmdCBjb3JuZXIgcmVhY2hlZC4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHcmlkOiB1bmV4cGVjdGVkIGRpcmVjdGlvbiB3aGVuIHJlYWNoaW5nIGxvd2VyIHkgYm91bmRhcnkuJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobmV3X3hpZHggPiB0aGlzLmdyaWQuZ2V0TWF4SW5kaWNlcygpWzBdKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHcmlkOiB4IG1heCByZWFjaGVkJyk7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPT0gR3JpZERpcmVjdGlvbi5SaWdodCkge1xuICAgICAgICAgIC8vIG1heCB4IHZhbHVlIHJlYWNoZWQsIGNoYW5nZSBkaXJlY3Rpb24gdG8gdXAsIGkuZS4ga2VlcFxuICAgICAgICAgIC8vIGRlY3JlYXNpbmcgZGlmZmljdWx0eVxuICAgICAgICAgIG5ld194aWR4ID0gdGhpcy5ncmlkLmdldE1heEluZGljZXMoKVswXTtcbiAgICAgICAgICB0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPSBHcmlkRGlyZWN0aW9uLlVwO1xuICAgICAgICAgIHRoaXMuc3RhdHVzLnJldmVyc2FsID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnJldmVyc2FsX2NvdW50ZXIgPSB0aGlzLnJldmVyc2FsX2NvdW50ZXIgKyAxO1xuICAgICAgICAgIG5ld195aWR4ID0gbmV3X3lpZHggKyB0aGlzLnN0YXR1cy5zdGVwc2l6ZVsxXTtcbiAgICAgICAgICBpZiAobmV3X3lpZHggPiB0aGlzLmdyaWQuZ2V0TWF4SW5kaWNlcygpWzFdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWQ6IFVwcGVyIHJpZ2h0IGNvcm5lciByZWFjaGVkLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWQ6IHVuZXhwZWN0ZWQgZGlyZWN0aW9uIHdoZW4gcmVhY2hpbmcgdXBwZXIgeCBib3VuZGFyeS4nKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChuZXdfeGlkeCA8IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0dyaWQ6IHggbWluIHJlYWNoZWQnKTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzLmRpcmVjdGlvbiA9PSBHcmlkRGlyZWN0aW9uLkxlZnQpIHtcbiAgICAgICAgICAvLyBtaW4geCB2YWx1ZSByZWFjaGVkLCBjaGFuZ2UgZGlyZWN0aW9uIHRvIGRvd24sIGkuZS4ga2VlcFxuICAgICAgICAgIC8vIGluY3JlYXNpbmcgZGlmZmljdWx0eVxuICAgICAgICAgIG5ld194aWR4ID0gMDtcbiAgICAgICAgICB0aGlzLnN0YXR1cy5kaXJlY3Rpb24gPSBHcmlkRGlyZWN0aW9uLkRvd247XG4gICAgICAgICAgdGhpcy5zdGF0dXMucmV2ZXJzYWwgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucmV2ZXJzYWxfY291bnRlciA9IHRoaXMucmV2ZXJzYWxfY291bnRlciArIDE7XG4gICAgICAgICAgbmV3X3lpZHggPSBuZXdfeWlkeCAtIHRoaXMuc3RhdHVzLnN0ZXBzaXplWzFdO1xuICAgICAgICAgIGlmIChuZXdfeWlkeCA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR3JpZDogTG93ZXIgbGVmdCBjb3JuZXIgcmVhY2hlZC4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHcmlkOiB1bmV4cGVjdGVkIGRpcmVjdGlvbiB3aGVuIHJlYWNoaW5nIGxvd2VyIHggYm91bmRhcnkuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjaGVjayBzdG9wcGluZyBjb25kaXRpb25zXG4gICAgaWYgKHRoaXMucmV2ZXJzYWxfY291bnRlciA+PSB0aGlzLm5fbWF4X3JldmVyc2Fscykge1xuICAgICAgdGhpcy5zdGF0dXMuZmluaXNoZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+PSB0aGlzLm5fbWF4X3N0ZXBzIC0gMSkge1xuICAgICAgdGhpcy5zdGF0dXMuZmluaXNoZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIHNhdmUgdGhlIHN0YXR1cyB0byBncmlkIGhpc3RvcnlcbiAgICBsZXQgc3RhdHVzX2Nsb25lID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zdGF0dXMpO1xuICAgIHRoaXMuaGlzdG9yeS5wdXNoKHN0YXR1c19jbG9uZSk7XG5cbiAgICAvLyBtb3ZlIHRvIG5ldyBwb2ludFxuICAgIHRoaXMuc3RhdHVzLnhpZHggPSBuZXdfeGlkeDtcbiAgICB0aGlzLnN0YXR1cy55aWR4ID0gbmV3X3lpZHg7XG4gIH1cblxuICBnZXRHcmlkKCk6IFBhcmFtR3JpZCB7XG4gICAgcmV0dXJuIHRoaXMuZ3JpZDtcbiAgfVxuXG4gIGdldEN1cnJlbnRHcmlkUGFyYW1ldGVycygpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICByZXR1cm4gdGhpcy5ncmlkLmdldEdyaWRWYWx1ZXModGhpcy5zdGF0dXMueGlkeCwgdGhpcy5zdGF0dXMueWlkeCk7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgUGFyYW1HcmlkIHtcbiAgcHJpdmF0ZSB4bGltOiBbbnVtYmVyLCBudW1iZXJdO1xuICBwcml2YXRlIHhfbWF4X2lkeDogbnVtYmVyO1xuICBwcml2YXRlIHlsaW06IFtudW1iZXIsIG51bWJlcl07XG4gIHByaXZhdGUgeV9tYXhfaWR4OiBudW1iZXI7XG4gIHByaXZhdGUgeHJlc29sdXRpb246IG51bWJlcjtcbiAgcHJpdmF0ZSB5cmVzb2x1dGlvbjogbnVtYmVyO1xuICBwcml2YXRlIHh2YWx1ZXM6IEFycmF5PG51bWJlcj47XG4gIHByaXZhdGUgeXZhbHVlczogQXJyYXk8bnVtYmVyPjtcblxuICBjb25zdHJ1Y3RvcihwYXJhbXM6IHt4bWluOiBudW1iZXIsIHhtYXg6IG51bWJlciwgeW1pbjogbnVtYmVyLCB5bWF4OiBudW1iZXIsXG4gICAgICAgICAgICAgIHhyZXM6IG51bWJlciwgeXJlczogbnVtYmVyfSkge1xuXG4gICAgaWYgKHBhcmFtcy54bWF4IDwgcGFyYW1zLnhtaW4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigneG1pbiBtdXN0IGJlIGxlc3MgdGhhbiB4bWF4Jyk7XG4gICAgfVxuICAgIHRoaXMueGxpbSA9IFtwYXJhbXMueG1pbiwgcGFyYW1zLnhtYXhdO1xuICAgIGlmIChwYXJhbXMueW1heCA8IHBhcmFtcy55bWluKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3ltaW4gbXVzdCBiZSBsZXNzIHRoYW4geW1heCcpO1xuICAgIH1cbiAgICB0aGlzLnlsaW0gPSBbcGFyYW1zLnltaW4sIHBhcmFtcy55bWF4XTtcblxuICAgIHRoaXMueHJlc29sdXRpb24gPSBwYXJhbXMueHJlcztcbiAgICB0aGlzLnlyZXNvbHV0aW9uID0gcGFyYW1zLnlyZXM7XG5cbiAgICBsZXQgeF9zaXplID0gTWF0aC5mbG9vcigocGFyYW1zLnhtYXggLSBwYXJhbXMueG1pbikvcGFyYW1zLnhyZXMpO1xuICAgIGNvbnNvbGUubG9nKCdYIGRpbSBzaXplICcgKyB4X3NpemUpO1xuICAgIHRoaXMueHZhbHVlcyA9IG5ldyBBcnJheSh4X3NpemUpO1xuICAgIHRoaXMueF9tYXhfaWR4ID0geF9zaXplIC0gMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSB0aGlzLnhfbWF4X2lkeDsgaSsrKSB7XG4gICAgICB0aGlzLnh2YWx1ZXNbaV0gPSBwYXJhbXMueG1pbiArIGkqcGFyYW1zLnhyZXM7XG4gICAgfVxuICAgIC8vdGhpcy54dmFsdWVzW3RoaXMueF9tYXhfaWR4XSA9IHBhcmFtcy54bWF4O1xuICAgIGNvbnNvbGUubG9nKCd4IG1pbiAnICsgdGhpcy54dmFsdWVzWzBdICsgJywgeCBtYXggJyArIHRoaXMueHZhbHVlc1t0aGlzLnhfbWF4X2lkeF0pO1xuXG4gICAgbGV0IHlfc2l6ZSA9IE1hdGguZmxvb3IoKHBhcmFtcy55bWF4IC0gcGFyYW1zLnltaW4pL3BhcmFtcy55cmVzKTtcbiAgICBjb25zb2xlLmxvZygnWSBkaW0gc2l6ZSAnICsgeV9zaXplKTtcbiAgICB0aGlzLnl2YWx1ZXMgPSBuZXcgQXJyYXkoeV9zaXplKTtcbiAgICB0aGlzLnlfbWF4X2lkeCA9IHlfc2l6ZSAtIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gdGhpcy55X21heF9pZHg7IGkrKykge1xuICAgICAgdGhpcy55dmFsdWVzW2ldID0gcGFyYW1zLnltaW4gKyBpKnBhcmFtcy55cmVzO1xuICAgIH1cbiAgICAvL3RoaXMueXZhbHVlc1t0aGlzLnlfbWF4X2lkeF0gPSBwYXJhbXMueW1heDtcbiAgICBjb25zb2xlLmxvZygneSBtaW4gJyArIHRoaXMueXZhbHVlc1swXSArICcsIHkgbWF4ICcgKyB0aGlzLnl2YWx1ZXNbdGhpcy55X21heF9pZHhdKTtcblxuICB9XG5cbiAgcHJpbnRHcmlkKCk6IHN0cmluZyB7XG4gICAgbGV0IGdyaWRzdHJpbmc6IHN0cmluZyA9ICcnO1xuICAgIGZvciAobGV0IHlpID0gdGhpcy55X21heF9pZHg7IHlpID49IDA7IHlpLS0pIHtcbiAgICAgIGZvciAobGV0IHhpID0gMDsgeGkgPD0gdGhpcy54X21heF9pZHg7IHhpKyspIHtcbiAgICAgICAgZ3JpZHN0cmluZyA9IGdyaWRzdHJpbmcgKyAnKCcgKyB0aGlzLnh2YWx1ZXNbeGldICsgJywgJyArIHRoaXMueXZhbHVlc1t5aV0gKyAnKSAnO1xuICAgICAgfVxuICAgICAgZ3JpZHN0cmluZyA9IGdyaWRzdHJpbmcgKyAnIC4gJztcbiAgICB9XG5cbiAgICByZXR1cm4gZ3JpZHN0cmluZztcbiAgfVxuXG4gIGdldFhsaW0oKTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIHRoaXMueGxpbTtcbiAgfVxuXG4gIGdldE1heEluZGljZXMoKTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIFt0aGlzLnhfbWF4X2lkeCwgdGhpcy55X21heF9pZHhdO1xuICB9XG5cbiAgZ2V0WWxpbSgpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICByZXR1cm4gdGhpcy55bGltO1xuICB9XG5cbiAgZ2V0R3JpZFZhbHVlcyh4aWR4LCB5aWR4KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgaWYgKHhpZHggPiB0aGlzLnhfbWF4X2lkeCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd4aWR4IGV4Y2VlZHMgZ3JpZCByYW5nZScpO1xuICAgIH1cbiAgICBpZiAoeWlkeCA+IHRoaXMueV9tYXhfaWR4KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3lpZHggZXhjZWVkcyBncmlkIHJhbmdlJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFt0aGlzLnh2YWx1ZXNbeGlkeF0sIHRoaXMueXZhbHVlc1t5aWR4XV07XG4gIH1cblxufVxuIl19