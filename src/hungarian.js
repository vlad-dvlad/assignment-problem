let MAX_SIZE = parseInt(Number.MAX_SAFE_INTEGER / 2) || ((1 << 26) * (1 << 26));
let DEFAULT_PAD_VALUE = 0;

function pad_matrix(matrix, pad_value = DEFAULT_PAD_VALUE) {
  let max_columns = 0;
  let total_rows = matrix.length;
  for (let i = 0; i < total_rows; ++i) {
    if (matrix[i].length > max_columns) {
      max_columns = matrix[i].length;
    }
  }
  total_rows = Math.max(max_columns, total_rows);
  let new_matrix = [];
  for (let i = 0; i < total_rows; ++i) {
    let row = matrix[i] || [];
    let new_row = row.slice();
    while (total_rows > new_row.length) {
      new_row.push(pad_value);
    }
    new_matrix.push(new_row);
  }
  return new_matrix;
}

function make_matrix(n, val) {
  return Array.from({ length: n }, () => Array(n).fill(val));
}

function computeHungarian(cost_matrix) {
  let C = pad_matrix(cost_matrix, DEFAULT_PAD_VALUE);
  let n = C.length;
  let original_length = cost_matrix.length;
  let original_width = cost_matrix[0].length;

  let row_covered = Array(n).fill(false);
  let col_covered = Array(n).fill(false);
  let Z0_r = 0;
  let Z0_c = 0;
  let path = make_matrix(n * 2, 0);
  let marked = make_matrix(n, 0);

  let steps = { 1: step1, 2: step2, 3: step3, 4: step4, 5: step5, 6: step6 };

  function step1() {
    for (let i = 0; i < n; ++i) {
      let minval = Math.min(...C[i]);
      for (let j = 0; j < n; ++j) {
        C[i][j] -= minval;
      }
    }
    return 2;
  }

  function step2() {
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        if (C[i][j] === 0 && !col_covered[j] && !row_covered[i]) {
          marked[i][j] = 1;
          col_covered[j] = true;
          row_covered[i] = true;
          break;
        }
      }
    }
    clear_covers();
    return 3;
  }

  function step3() {
    let count = 0;
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        if (marked[i][j] === 1 && !col_covered[j]) {
          col_covered[j] = true;
          count++;
        }
      }
    }
    return count >= n ? 7 : 4;
  }

  function step4() {
    while (true) {
      let [row, col] = find_a_zero();
      if (row === -1) return 6;
      marked[row][col] = 2;
      let star_col = find_star_in_row(row);
      if (star_col >= 0) {
        col = star_col;
        row_covered[row] = true;
        col_covered[col] = false;
      } else {
        Z0_r = row;
        Z0_c = col;
        return 5;
      }
    }
  }

  function step5() {
    let count = 0;
    path[count][0] = Z0_r;
    path[count][1] = Z0_c;
    let done = false;
    while (!done) {
      let row = find_star_in_col(path[count][1]);
      if (row >= 0) {
        count++;
        path[count][0] = row;
        path[count][1] = path[count - 1][1];
      } else done = true;

      if (!done) {
        let col = find_prime_in_row(path[count][0]);
        count++;
        path[count][0] = path[count - 1][0];
        path[count][1] = col;
      }
    }
    convert_path(path, count);
    clear_covers();
    erase_primes();
    return 3;
  }

  function step6() {
    let minval = find_smallest();
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        if (row_covered[i]) C[i][j] += minval;
        if (!col_covered[j]) C[i][j] -= minval;
      }
    }
    return 4;
  }

  function find_smallest() {
    let minval = MAX_SIZE;
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        if (!row_covered[i] && !col_covered[j]) {
          minval = Math.min(minval, C[i][j]);
        }
      }
    }
    return minval;
  }

  function find_a_zero() {
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        if (C[i][j] === 0 && !row_covered[i] && !col_covered[j]) {
          return [i, j];
        }
      }
    }
    return [-1, -1];
  }

  function find_star_in_row(row) {
    return marked[row].indexOf(1);
  }

  function find_star_in_col(col) {
    for (let i = 0; i < n; ++i) {
      if (marked[i][col] === 1) return i;
    }
    return -1;
  }

  function find_prime_in_row(row) {
    return marked[row].indexOf(2);
  }

  function convert_path(path, count) {
    for (let i = 0; i <= count; ++i) {
      marked[path[i][0]][path[i][1]] = marked[path[i][0]][path[i][1]] === 1 ? 0 : 1;
    }
  }

  function clear_covers() {
    row_covered.fill(false);
    col_covered.fill(false);
  }

  function erase_primes() {
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        if (marked[i][j] === 2) marked[i][j] = 0;
      }
    }
  }

  let step = 1;
  while (step !== 7) {
    step = steps[step]();
  }

  let results = [];
  for (let i = 0; i < original_length; ++i) {
    for (let j = 0; j < original_width; ++j) {
      if (marked[i][j] === 1) results.push([i, j]);
    }
  }

  return results;
}

function make_cost_matrix(profit_matrix) {
  let maximum = Math.max(...profit_matrix.flat());
  return profit_matrix.map(row => row.map(x => maximum - x));
}

function format_matrix(matrix) {
  let columnWidths = matrix[0].map((_, colIndex) => Math.max(...matrix.map(row => String(row[colIndex]).length)));

  return matrix
    .map(row => row.map((val, colIndex) => String(val).padStart(columnWidths[colIndex])).join(" "))
    .join("\n");
}

module.exports = { computeHungarian, make_cost_matrix, format_matrix };
