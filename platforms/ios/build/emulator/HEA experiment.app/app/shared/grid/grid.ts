export enum GridDirection {
  Up,
  Down,
  Right,
  Left
}

export enum TrialAnswer {
  Correct = "correct",
  Wrong = "wrong"
}

export interface GridTrackingStatus {
  xidx: number;
  yidx: number;
  direction: GridDirection;
  adjust_difficulty: number;
  finished: boolean;
  answer?: TrialAnswer;
  correct?: boolean;
  stepsize?: [number, number];
  reversal?: boolean;
}

export class GridTracker {
  private grid: ParamGrid;
  private status: GridTrackingStatus;
  private history: Array<GridTrackingStatus>;
  private m_up: number;
  private n_down: number;
  private answerBuffer: Array<TrialAnswer>;
  private n_max_reversals: number;
  private reversal_counter: number;
  private n_max_steps: number;
  private initialized: boolean;

  constructor(params: {g: ParamGrid, m_up: number, n_down: number, n_revs: number, n_step: number}) {
    this.grid = params.g;
    this.m_up = params.m_up;
    this.n_down = params.n_down;
    this.answerBuffer = new Array(Math.max(params.m_up, params.n_down));
    this.n_max_reversals = params.n_revs;
    this.n_max_steps = params.n_step;
    this.initialized = false;
  }

  getLastNAnswers(n: number): TrialAnswer[] {
    let i = Math.min(this.answerBuffer.length, Math.abs(n));
    return this.answerBuffer.slice(-1*i);
  }

  getStatus(): GridTrackingStatus {
    return this.status;
  }

  getHistory(): GridTrackingStatus[] {
    return this.history;
  }

  getStepsize(): [number, number] {
    return this.status.stepsize;
  }

  setStepsize(xstep:number, ystep:number) {
    this.status.stepsize = [xstep, ystep];
  }

  initialize(x:number, y:number) {
    this.status = {
      xidx: x,
      yidx: y,
      stepsize: [1, 1],
      direction: GridDirection.Up,
      adjust_difficulty: 0,
      finished: false
    }

    this.history = [];
    this.reversal_counter = 0;
    this.initialized = true;
  }

  updatePosition(ans: TrialAnswer): void {
    if (!this.initialized) {
      throw new Error('Tracker not initialized.');
    }
    if (this.status.finished) {
      throw new Error('Tracker has already finished. Re-initialize to start a new run.');
    }

    this.answerBuffer.shift();
    this.answerBuffer.push(ans);
    this.status.answer = ans;

    // compute the m-up-n-down rule
    if (ans == TrialAnswer.Correct) {
      let n_down_buffer = this.getLastNAnswers(this.n_down);
      if (n_down_buffer.every(a => a == TrialAnswer.Correct)) {
        this.status.adjust_difficulty = -1; // negative -> go down = increase difficulty
        this.answerBuffer = new Array(this.answerBuffer.length); // reset buffer
      } else {
        this.status.adjust_difficulty = 0; // not yet n correct answers, keep going
      }
    } else if (ans == TrialAnswer.Wrong) {
      let m_up_buffer = this.getLastNAnswers(this.m_up);
      if (m_up_buffer.every(a => a == TrialAnswer.Wrong)) {
        this.status.adjust_difficulty = 1; // positive ->  go up = decrease difficulty
        this.answerBuffer = new Array(this.answerBuffer.length);
      } else {
        this.status.adjust_difficulty = 0;
      }
    }

    // determine next grid direction
    if (this.status.adjust_difficulty < 0) { // go down = increase difficulty
        if (this.status.direction == GridDirection.Up) {
          this.status.direction = GridDirection.Left;
        } else if (this.status.direction == GridDirection.Right) {
          this.status.direction = GridDirection.Down;
        } // otherwise current direction is down or left -> keep going
    } else if (this.status.adjust_difficulty > 0) { // go up = decrease difficulty
      if (this.status.direction == GridDirection.Down) {
        this.status.direction = GridDirection.Right;
      } else if (this.status.direction == GridDirection.Left) {
        this.status.direction = GridDirection.Up;
      } // otherwise current direction is up or right -> keep going
    }

    // determine new position towards the chosen direction
    let new_yidx = this.status.yidx;
    let new_xidx = this.status.xidx;
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
    if (new_yidx > this.grid.getYlim()[1]) {
      if (this.status.direction == GridDirection.Up) {
        // max y value reached, change direction to right, i.e. keep
        // decreasing difficulty
        new_yidx = this.grid.getYlim()[1];
        this.status.direction = GridDirection.Right;
        this.status.reversal = true;
        this.reversal_counter = this.reversal_counter + 1;
        new_xidx = new_xidx + this.status.stepsize[0];
        if (new_xidx > this.grid.getXlim[1]) {
          throw new Error('Grid: Upper right corner reached.');
        }
      } else {
        throw new Error('Grid: unexpected direction when reaching upper y boundary.');
      }
    } else if (new_yidx < this.grid.getYlim[0]) {
      if (this.status.direction == GridDirection.Down) {
        // min y value reached, change direction to left, i.e. keep
        // increasing difficulty
        new_yidx = this.grid.getYlim()[0];
        this.status.direction = GridDirection.Left;
        this.status.reversal = true;
        this.reversal_counter = this.reversal_counter + 1;
        new_xidx = new_xidx - this.status.stepsize[0];
        if (new_xidx < this.grid.getXlim()[0]) {
          throw new Error('Grid: Lower left corner reached.');
        }
      } else {
        throw new Error('Grid: unexpected direction when reaching lower y boundary.');
      }
    } else if (new_xidx > this.grid.getXlim[1]) {
      if (this.status.direction == GridDirection.Right) {
        // max x value reached, change direction to up, i.e. keep
        // decreasing difficulty
        new_xidx = this.grid.getXlim()[1];
        this.status.direction = GridDirection.Up;
        this.status.reversal = true;
        this.reversal_counter = this.reversal_counter + 1;
        new_yidx = new_yidx + this.status.stepsize[1];
        if (new_yidx > this.grid.getYlim()[1]) {
          throw new Error('Grid: Upper right corner reached.');
        }
      } else {
        throw new Error('Grid: unexpected direction when reaching upper x boundary.');
      }
    } else if (new_xidx < this.grid.getXlim[0]) {
      if (this.status.direction == GridDirection.Left) {
        // min x value reached, change direction to down, i.e. keep
        // increasing difficulty
        new_xidx = this.grid.getXlim()[0];
        this.status.direction = GridDirection.Down;
        this.status.reversal = true;
        this.reversal_counter = this.reversal_counter + 1;
        new_yidx = new_yidx - this.status.stepsize[1];
        if (new_yidx < this.grid.getYlim()[0]) {
          throw new Error('Grid: Lower left corner reached.');
        }
      } else {
        throw new Error('Grid: unexpected direction when reaching lower x boundary.');
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
    let status_clone = Object.assign({}, this.status);
    this.history.push(status_clone);

    // move to new point
    this.status.xidx = new_xidx;
    this.status.yidx = new_yidx;
  }

  getCurrentGridParameters(): [number, number] {
    return this.grid.getGridValues(this.status.xidx, this.status.yidx);
  }

}

export class ParamGrid {
  private xlim: [number, number];
  private x_max_idx: number;
  private ylim: [number, number];
  private y_max_idx: number;
  private xresolution: number;
  private yresolution: number;
  private xvalues: Array<number>;
  private yvalues: Array<number>;

  constructor(params: {xmin: number, xmax: number, ymin: number, ymax: number,
              xres: number, yres: number}) {

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

    let x_size = Math.floor((params.xmax - params.xmin)/params.xres) + 1;
    this.xvalues = new Array(x_size);
    this.x_max_idx = x_size - 1;
    for (let i = 0; i < this.x_max_idx; i++) {
      this.xvalues[i] = params.xmin + i*params.xres;
    }
    this.xvalues[this.x_max_idx] = params.xmax;

    let y_size = Math.floor((params.ymax - params.ymin)/params.yres) + 1;
    this.yvalues = new Array(y_size);
    this.y_max_idx = y_size - 1;
    for (let i = 0; i < this.y_max_idx; i++) {
      this.yvalues[i] = params.ymin + i*params.yres;
    }
    this.yvalues[this.y_max_idx] = params.ymax;

  }

  getXlim(): [number, number] {
    return this.xlim;
  }

  getYlim(): [number, number] {
    return this.ylim;
  }

  getGridValues(xidx, yidx): [number, number] {
    if (xidx > this.x_max_idx) {
      throw new Error('xidx exceeds grid range');
    }
    if (yidx > this.y_max_idx) {
      throw new Error('yidx exceeds grid range');
    }

    return [this.xvalues[xidx], this.yvalues[yidx]];
  }

}
