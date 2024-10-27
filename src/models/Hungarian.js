class Hungarian {
    constructor() {
        this.cost = new Array(31);
        for(let i = 0; i < 31; i++) {
            this.cost[i] = new Array(31).fill(0);
        }
        this.n = 0;
        this.max_match = 0;
        this.lx = new Array(31).fill(0);
        this.ly = new Array(31).fill(0);
        this.xy = new Array(31).fill(-1);
        this.yx = new Array(31).fill(-1);
        this.S = new Array(31).fill(false);
        this.T = new Array(31).fill(false);
        this.slack = new Array(31).fill(0);
        this.slackx = new Array(31).fill(0);
        this.prev_ious = new Array(31).fill(0);
    }

    init_labels() {
        for(let i = 0; i < this.n; i++) this.lx[i] = Math.max(...this.cost[i]);
    }

    update_labels() {
        let delta = Infinity;
        for (let y = 0; y < this.n; y++) {
            if (!this.T[y]) delta = Math.min(delta, this.slack[y]);
        }
        for (let x = 0; x < this.n; x++) {
            if (this.S[x]) this.lx[x] -= delta;
        }
        for (let y = 0; y < this.n; y++) {
            if (this.T[y]) this.ly[y] += delta;
            if (!this.T[y]) this.slack[y] -= delta;
        }
    }

    add_to_tree(x, prev_iousx) {
        this.S[x] = true;
        this.prev_ious[x] = prev_iousx;
        for (let y = 0; y < this.n; y++) {
            if (this.lx[x] + this.ly[y] - this.cost[x][y] < this.slack[y]) {
                this.slack[y] = this.lx[x] + this.ly[y] - this.cost[x][y];
                this.slackx[y] = x;
            }
        }
    }

    augment() {
        if (this.max_match == this.n) return;
        let root = -1;
        let q = [];
        this.S.fill(false);
        this.T.fill(false);
        this.prev_ious.fill(-1);

        for (let x = 0; x < this.n; x++) {
            if (this.xy[x] == -1) {
                q.push(root = x);
                this.prev_ious[x] = -2;
                this.S[x] = true;
                break;
            }
        }

        for (let y = 0; y < this.n; y++) {
            this.slack[y] = this.lx[root] + this.ly[y] - this.cost[root][y];
            this.slackx[y] = root;
        }

        while (true) {
            let found = false;
            while (q.length && !found) {
                let x = q.shift();
                for (let y = 0; y < this.n; y++) {
                    if (this.cost[x][y] == this.lx[x] + this.ly[y] && !this.T[y]) {
                        if (this.yx[y] == -1) {
                            found = true;
                            root = x;
                            break;
                        }
                        this.T[y] = true;
                        q.push(this.yx[y]);
                        this.add_to_tree(this.yx[y], x);
                    }
                }
                if (found) break;
            }
            if (found) break;
            this.update_labels();
            q = [];
            for (let y = 0; y < this.n; y++) {
                if (!this.T[y] && this.slack[y] == 0) {
                    if (this.yx[y] == -1) {
                        found = true;
                        root = this.slackx[y];
                        break;
                    }
                    this.T[y] = true;
                    if (!this.S[this.yx[y]]) {
                        q.push(this.yx[y]);
                        this.add_to_tree(this.yx[y], this.slackx[y]);
                    }
                }
            }
            if (found) break;
        }
        
        this.max_match++;
        for (let cx = root, cy = this.slackx[root], ty; cx != -2; cx = this.prev_ious[cx], cy = ty) {
            ty = this.xy[cx];
            this.yx[cy] = cx;
            this.xy[cx] = cy;
        }
        this.augment();
    }

    hungarian() {
        this.max_match = 0;
        this.xy.fill(-1);
        this.yx.fill(-1);
        this.init_labels();
        this.augment();
        return this.xy.reduce((sum, y, x) => sum + this.cost[x][y], 0);
    }

    assignmentProblem(Arr, n) {
        this.n = n;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                this.cost[i][j] = -Arr[i * n + j];
            }
        }
        return -this.hungarian();
    }
}

module.exports = {
    Hungarian
}