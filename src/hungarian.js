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

function make_cost_matrix(profit_matrix, is_maximization = false) {
  let matrix;
  if (is_maximization) {
    const maximum = Math.max(...profit_matrix.flat());
    matrix = profit_matrix.map(row => row.map(x => maximum - x));
  } else {
    matrix = profit_matrix; // залишаємо без змін для мінімізації
  }
  return matrix;
}

function split_into_submatrices(matrix, submatrix_size) {
  const submatrices = [];
  const n = matrix.length;

  for (let i = 0; i < n; i += submatrix_size) {
    for (let j = 0; j < n; j += submatrix_size) {
      const submatrix = [];
      for (let k = 0; k < submatrix_size; k++) {
        submatrix.push(matrix[i + k].slice(j, j + submatrix_size));
      }
      submatrices.push(submatrix);
    }
  }
  return submatrices;
}

function format_results(matrix, assignments) {
  let totalCost = 0;
  const selectedElements = assignments.map(([row, col]) => {
    const value = matrix[row][col];
    totalCost += value;
    return value;
  });
  return { selectedElements, totalCost };
}

function aggregateResults(submatrixSize, submatrixAssignments, originalMatrix) {
  let selectedElements = [];
  let totalCost = 0;

  submatrixAssignments.forEach(({ assignments, offsetRow, offsetCol }) => {
    assignments.forEach(([localRow, localCol]) => {
      // Перетворюємо локальні координати на глобальні
      const globalRow = offsetRow + localRow;
      const globalCol = offsetCol + localCol;
      const value = originalMatrix[globalRow][globalCol];
      selectedElements.push(value);
      totalCost += value;
    });
  });

  return { selectedElements, totalCost };
}

// function main(matrix, is_maximization = false) {
//   const matrixSize = matrix.length;

//   if (matrixSize <= 20) {
//     // Пряме використання угорського методу без розбиття
//     const cost_matrix = make_cost_matrix(matrix, is_maximization);
//     const assignments = computeHungarian(cost_matrix);
//     const { selectedElements, totalCost } = format_results(matrix, assignments);
//     selectedElements.forEach((element, index) => {
//         console.log(`Agent ${index + 1} -> Cost: ${element}`)
//     })
//     console.log("Total cost for small matrix:", totalCost);
//   } else {
//     // Розбивка на підматриці
//     const submatrixSize = 10;
//     const submatrices = split_into_submatrices(matrix, submatrixSize);

//     let submatrixAssignments = [];
//     submatrices.forEach((submatrix, index) => {
//       // Обчислюємо початковий рядок і стовпець підматриці в глобальній матриці
//       const offsetRow = Math.floor(index / (matrixSize / submatrixSize)) * submatrixSize;
//       const offsetCol = (index % (matrixSize / submatrixSize)) * submatrixSize;

//       // Виконуємо угорський метод для підматриці
//       const cost_matrix = make_cost_matrix(submatrix, is_maximization);
//       const assignments = computeHungarian(cost_matrix);

//       // Зберігаємо призначення та їх зсуви
//       submatrixAssignments.push({ assignments, offsetRow, offsetCol });
//     });

//     // Агрегуємо результати з усіх підматриць
//     const { selectedElements, totalCost } = aggregateResults(submatrixSize, submatrixAssignments, matrix);
//     selectedElements.forEach((element, index) => {
//         console.log(`Agent ${index + 1} -> Cost: ${element}`)
//     })
//     console.log("Total cost for global assignments:", totalCost);
//   }
// }

module.exports = {
  make_cost_matrix,
  computeHungarian,
  format_results
}
