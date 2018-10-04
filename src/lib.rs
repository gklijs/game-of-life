extern crate cfg_if;
extern crate wasm_bindgen;
extern crate js_sys;
extern crate fixedbitset;

mod utils;

use wasm_bindgen::prelude::*;
use fixedbitset::FixedBitSet;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(msg: &str);
}

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
}

impl Universe {
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }
    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;
        for delta_row in [self.height - 1, 0, 1].iter().cloned() {
            for delta_col in [self.width - 1, 0, 1].iter().cloned() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }
                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (column + delta_col) % self.width;
                let idx = self.get_index(neighbor_row, neighbor_col);
                count += self.cells.contains(idx) as u8;
            }
        }
        count
    }
}

const GLIDER: [bool; 25] = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    false,
    false,
    false,
    false,
    false,
    true,
    false,
    false,
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
];

/// Public methods, exported to JavaScript.
#[wasm_bindgen]
impl Universe {
    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr()
    }

    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        let mut next = self.cells.clone();
        let new_cell = !self.cells[idx];
        next.set(idx, new_cell);
        self.cells = next;
    }

    pub fn glider(&mut self, row: u32, column: u32) {
        self.print(row, column, &GLIDER)
    }

    fn print(&mut self, row: u32, column: u32, drawing: &[bool; 25]) {
        let mut next = self.cells.clone();
        let mut count = 0;
        for delta_row in [self.height - 2, self.height - 1, 0, 1, 2].iter().cloned() {
            for delta_col in [self.width - 2, self.width - 1, 0, 1, 2].iter().cloned() {
                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (column + delta_col) % self.width;
                let idx = self.get_index(neighbor_row, neighbor_col);
                next.set(idx, drawing[count]);
                count += 1;
            }
        }
        self.cells = next;
    }

    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);

                let next_cell = match (cell, live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (true, x) if x < 2 => false,
                    // Rule 2: Any live cell with two or three live neighbours
                    // lives on to the next generation.
                    (true, 2) | (true, 3) => true,
                    // Rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (true, x) if x > 3 => false,
                    // Rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (false, 3) => true,
                    // All other cells remain in the same state.
                    (otherwise, _) => otherwise,
                };
                next.set(idx, next_cell);
            }
        }
        self.cells = next;
    }

    pub fn new(width: u32, height: u32, fill_random: bool) -> Universe {
        let size = (width * height) as usize;
        let mut cells = FixedBitSet::with_capacity(size);
        if fill_random {
            for i in 0..size {
                if js_sys::Math::random() < 0.3 {
                    cells.put(i as usize);
                }
            }
        };

        Universe {
            width,
            height,
            cells,
        }
    }
}
