export type BingoPattern =
  | "row"
  | "column"
  | "diagonal"
  | "four_corners"
  | "x"
  | "blackout";

export const isPatternMatched = (
  numbers: number[][],
  calledNumbers: number[],
  pattern: BingoPattern
): boolean => {
  const called = new Set(calledNumbers);

  // FREE center
  const isMarked = (
    row: number,
    col: number
  ) => {
    if (row === 2 && col === 2) {
      return true;
    }

    return called.has(
      numbers[row][col]
    );
  };

  // ROW
  if (pattern === "row") {
    return numbers.some(
      (_, row) =>
        [0, 1, 2, 3, 4].every(
          (col) =>
            isMarked(row, col)
        )
    );
  }

  // COLUMN
  if (pattern === "column") {
    return [0, 1, 2, 3, 4].some(
      (col) =>
        [0, 1, 2, 3, 4].every(
          (row) =>
            isMarked(row, col)
        )
    );
  }

  // DIAGONAL
  if (pattern === "diagonal") {
    const mainDiagonal =
      [0, 1, 2, 3, 4].every(
        (i) =>
          isMarked(i, i)
      );

    const reverseDiagonal =
      [0, 1, 2, 3, 4].every(
        (i) =>
          isMarked(
            i,
            4 - i
          )
      );

    return (
      mainDiagonal ||
      reverseDiagonal
    );
  }

  // FOUR CORNERS
  if (
    pattern === "four_corners"
  ) {
    return (
      isMarked(0, 0) &&
      isMarked(0, 4) &&
      isMarked(4, 0) &&
      isMarked(4, 4)
    );
  }

  // X
  if (pattern === "x") {
    const mainDiagonal =
      [0, 1, 2, 3, 4].every(
        (i) =>
          isMarked(i, i)
      );

    const reverseDiagonal =
      [0, 1, 2, 3, 4].every(
        (i) =>
          isMarked(
            i,
            4 - i
          )
      );

    return (
      mainDiagonal &&
      reverseDiagonal
    );
  }

  // BLACKOUT
  if (pattern === "blackout") {
    return [0, 1, 2, 3, 4].every(
      (row) =>
        [0, 1, 2, 3, 4].every(
          (col) =>
            isMarked(row, col)
        )
    );
  }

  return false;
};