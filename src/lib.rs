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
    cells_a: FixedBitSet,
    cells_b: FixedBitSet,
    cells_js: FixedBitSet,
    a_latest: bool,
    to_alive: Vec<u32>,
    to_death: Vec<u32>,
}

fn get_index(row: u32, column: u32, width: u32) -> usize {
    (row * width + column) as usize
}

fn live_neighbor_count(
    row: u32,
    column: u32,
    width: u32,
    height: u32,
    current: &FixedBitSet,
) -> u8 {
    let mut count = 0;

    let north = if row == 0 { height - 1 } else { row - 1 };

    let south = if row == height - 1 { 0 } else { row + 1 };

    let west = if column == 0 { width - 1 } else { column - 1 };

    let east = if column == width - 1 { 0 } else { column + 1 };

    let nw = get_index(north, west, width);
    count += current[nw] as u8;

    let n = get_index(north, column, width);
    count += current[n] as u8;

    let ne = get_index(north, east, width);
    count += current[ne] as u8;

    let w = get_index(row, west, width);
    count += current[w] as u8;

    let e = get_index(row, east, width);
    count += current[e] as u8;

    let sw = get_index(south, west, width);
    count += current[sw] as u8;

    let s = get_index(south, column, width);
    count += current[s] as u8;

    let se = get_index(south, east, width);
    count += current[se] as u8;

    count
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn time(name: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn timeEnd(name: &str);
}

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        time(name);
        Timer { name }
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        timeEnd(self.name);
    }
}

/// Public methods, exported to JavaScript.
#[wasm_bindgen]
impl Universe {
    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn nr_of_births(&self) -> u32 {
        self.to_alive.len() as u32
    }

    pub fn nr_of_deaths(&self) -> u32 {
        self.to_death.len() as u32
    }

    pub fn cells(&self) -> *const u32 {
        if self.a_latest {
            self.cells_a.as_slice().as_ptr()
        } else {
            self.cells_b.as_slice().as_ptr()
        }
    }

    pub fn births(&self) -> *const u32 {
        self.to_alive.as_ptr()
    }

    pub fn deaths(&self) -> *const u32 {
        self.to_death.as_ptr()
    }

    pub fn update_changes(&mut self) {
        self.to_alive.clear();
        self.to_death.clear();
        let (synced, current) = if self.a_latest {
            (&mut self.cells_js, &self.cells_a)
        } else {
            (&mut self.cells_js, &self.cells_b)
        };
        let size = (self.width * self.height) as usize;
        for i in 0..size {
            if current[i] != synced[i] {
                if current[i] {
                    self.to_alive.push(i as u32);
                } else {
                    self.to_death.push(i as u32);
                };
                synced.set(i, current[i]);
            }
        }
    }

    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let (next, current) = if self.a_latest {
            (&mut self.cells_b, &self.cells_a)
        } else {
            (&mut self.cells_a, &self.cells_b)
        };
        let idx = get_index(row, column, self.width);
        let size = (self.width * self.height) as usize;
        for i in 0..size {
            if i == idx {
                next.set(i, !current[i]);
            } else {
                next.set(i, current[i]);
            }
        }
        self.a_latest = !self.a_latest;
    }

    pub fn glider(&mut self, row: u32, column: u32) {
        self.print(row, column, &GLIDER)
    }

    fn print(&mut self, row: u32, column: u32, drawing: &[bool; 25]) {
        let current = if self.a_latest {
            &mut self.cells_a
        } else {
            &mut self.cells_b
        };
        let mut count = 0;
        for delta_row in [self.height - 2, self.height - 1, 0, 1, 2].iter().cloned() {
            for delta_col in [self.width - 2, self.width - 1, 0, 1, 2].iter().cloned() {
                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (column + delta_col) % self.width;
                let idx = get_index(neighbor_row, neighbor_col, self.width);
                current.set(idx, drawing[count]);
                count += 1;
            }
        }
    }

    pub fn tick(&mut self) {
        let _timer = Timer::new("Universe::tick");
        let (next, current) = if self.a_latest {
            (&mut self.cells_b, &self.cells_a)
        } else {
            (&mut self.cells_a, &self.cells_b)
        };

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = get_index(row, col, self.width);
                let cell = current[idx];
                let live_neighbors =
                    live_neighbor_count(row, col, self.width, self.height, current);

                match (cell, live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (true, x) if x < 2 => next.set(idx, false),
                    // Rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (true, x) if x > 3 => next.set(idx, false),
                    // Rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (false, 3) => next.set(idx, true),
                    // All other cells remain in the same state.
                    (enabled, _) => next.set(idx, enabled),
                };
            }
        }
        self.a_latest = !self.a_latest;
    }

    pub fn new(width: u32, height: u32, fill_random: bool) -> Universe {
        let size = (width * height) as usize;
        let mut cells_a = FixedBitSet::with_capacity(size);
        if fill_random {
            for i in 0..size {
                if js_sys::Math::random() < 0.3 {
                    cells_a.put(i as usize);
                }
            }
        };
        let cells_b = FixedBitSet::with_capacity(size);
        let cells_js = FixedBitSet::with_capacity(size);
        let to_alive = Vec::with_capacity(size);
        let to_death = Vec::with_capacity(size);

        Universe {
            width,
            height,
            cells_a,
            cells_b,
            cells_js,
            a_latest: true,
            to_alive,
            to_death,
        }
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
