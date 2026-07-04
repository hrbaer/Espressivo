/*
 *
 * About this code
 *
 * See:
 * npm view cubic-spline-interpolate
 *
 * This code seems to be unpublished.
 *
 */

export default function cubicSplineInterpolate(x_array, y_array) {
    let k_array = getNaturalKs(x_array, y_array)
    return function (x) {
        var i = 1
        while (x_array[i] < x) i++
        var t = (x - x_array[i - 1]) / (x_array[i] - x_array[i - 1])
        var a = k_array[i - 1] * (x_array[i] - x_array[i - 1]) - (y_array[i] - y_array[i - 1])
        var b = -1 * k_array[i] * (x_array[i] - x_array[i - 1]) + (y_array[i] - y_array[i - 1])
        var q = (1 - t) * y_array[i - 1] + t * y_array[i] + t * (1 - t) * (a * (1 - t) + b * t)
        return q
    }
}

function getNaturalKs(x_array, y_array) {
    var n = x_array.length - 1
    var A = zerosMat(n + 1, n + 2)

    for (
        var i = 1;
        i < n;
        i++ // rows
    ) {
        A[i][i - 1] = 1 / (x_array[i] - x_array[i - 1])
        A[i][i] = 2 * (1 / (x_array[i] - x_array[i - 1]) + 1 / (x_array[i + 1] - x_array[i]))
        A[i][i + 1] = 1 / (x_array[i + 1] - x_array[i])
        A[i][n + 1] =
            3 *
            ((y_array[i] - y_array[i - 1]) /
                ((x_array[i] - x_array[i - 1]) * (x_array[i] - x_array[i - 1])) +
                (y_array[i + 1] - y_array[i]) /
                    ((x_array[i + 1] - x_array[i]) * (x_array[i + 1] - x_array[i])))
    }

    A[0][0] = 2 / (x_array[1] - x_array[0])
    A[0][1] = 1 / (x_array[1] - x_array[0])
    A[0][n + 1] =
        (3 * (y_array[1] - y_array[0])) / ((x_array[1] - x_array[0]) * (x_array[1] - x_array[0]))

    A[n][n - 1] = 1 / (x_array[n] - x_array[n - 1])
    A[n][n] = 2 / (x_array[n] - x_array[n - 1])
    A[n][n + 1] =
        (3 * (y_array[n] - y_array[n - 1])) /
        ((x_array[n] - x_array[n - 1]) * (x_array[n] - x_array[n - 1]))

    return solve(A)
}

function solve(A) {
    var m = A.length
    var res = Array.from({ length: m })
    var i, j, k
    for (
        k = 0;
        k < m;
        k++ // column
    ) {
        // pivot for column
        var i_max = 0
        var vali = Number.NEGATIVE_INFINITY
        for (i = k; i < m; i++)
            if (A[i][k] > vali) {
                i_max = i
                vali = A[i][k]
            }
        swapRows(A, k, i_max)

        // for all rows below pivot
        for (i = k + 1; i < m; i++) {
            for (j = k + 1; j < m + 1; j++) A[i][j] = A[i][j] - A[k][j] * (A[i][k] / A[k][k])
            A[i][k] = 0
        }
    }
    for (
        i = m - 1;
        i >= 0;
        i-- // rows = columns
    ) {
        var v = A[i][m] / A[i][i]
        res[i] = v
        for (
            j = i - 1;
            j >= 0;
            j-- // rows
        ) {
            A[j][m] -= A[j][i] * v
            A[j][i] = 0
        }
    }
    return res
}

function zerosMat(r, c) {
    var A = []
    for (var i = 0; i < r; i++) {
        A.push([])
        for (var j = 0; j < c; j++) A[i].push(0)
    }
    return A
}

function swapRows(m, k, l) {
    var p = m[k]
    m[k] = m[l]
    m[l] = p
}
