extern crate cfg_if;
extern crate wasm_bindgen;
extern crate js_sys;
extern crate fixedbitset;

mod utils;

use wasm_bindgen::prelude::*;
use fixedbitset::FixedBitSet;

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    depth: u32,
    cells_a: FixedBitSet,
    cells_b: FixedBitSet,
    cells_js: FixedBitSet,
    a_latest: bool,
    to_alive: Vec<u32>,
    to_death: Vec<u32>,
}

fn get_index(column: u32, row: u32, layer: u32, width: u32, height: u32) -> usize {
    (column + row * width + layer * width * height ) as usize
}

fn live_neighbor_count(
    column: u32,
    row: u32,
    layer: u32,
    width: u32,
    height: u32,
    depth: u32,
    current: &FixedBitSet,
) -> u8 {
    let mut count = 0;

    let west = if column == 0 { width - 1 } else { column - 1 };

    let east = if column == width - 1 { 0 } else { column + 1 };

    let north = if row == 0 { height - 1 } else { row - 1 };

    let south = if row == height - 1 { 0 } else { row + 1 };

    let up = if layer == 0 { depth - 1 } else { layer - 1 };

    let down = if layer == depth - 1 { 0 } else { layer + 1 };

    let unw = get_index(west, north, up, width, height);
    count += current[unw] as u8;

    let un = get_index(column, north, up, width, height);
    count += current[un] as u8;

    let une = get_index(east, north, up, width, height);
    count += current[une] as u8;

    let uw = get_index(west, row, up, width, height);
    count += current[uw] as u8;

    let ue = get_index(east, row, up, width, height);
    count += current[ue] as u8;

    let usw = get_index(west, south, up, width, height);
    count += current[usw] as u8;

    let us = get_index(column, south, up, width, height);
    count += current[us] as u8;

    let qse = get_index(east, south, up, width, height);
    count += current[qse] as u8;

    let upp = get_index(column, row, up, width, height);
    count += current[upp] as u8;

    let nw = get_index(west, north, layer, width, height);
    count += current[nw] as u8;

    let no = get_index(column, north, layer, width, height);
    count += current[no] as u8;

    let ne = get_index(east, north, layer, width, height);
    count += current[ne] as u8;

    let we = get_index(west, row, layer, width, height);
    count += current[we] as u8;

    let ea = get_index(east, row, layer, width, height);
    count += current[ea] as u8;

    let sw = get_index(west, south, layer, width, height);
    count += current[sw] as u8;

    let so = get_index(column, south, layer, width, height);
    count += current[so] as u8;

    let se = get_index(east, south, layer, width, height);
    count += current[se] as u8;

    let dnw = get_index(west, north, down, width, height);
    count += current[dnw] as u8;

    let dn = get_index(column, north, down, width, height);
    count += current[dn] as u8;

    let dne = get_index(east, north, down, width, height);
    count += current[dne] as u8;

    let dw = get_index(west, row, down, width, height);
    count += current[dw] as u8;

    let de = get_index(east, row, down, width, height);
    count += current[de] as u8;

    let dsw = get_index(west, south, down, width, height);
    count += current[dsw] as u8;

    let ds = get_index(column, south, down, width, height);
    count += current[ds] as u8;

    let dse = get_index(east, south, down, width, height);
    count += current[dse] as u8;

    let dow = get_index(column, row, down, width, height);
    count += current[dow] as u8;

    count
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn time(name: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn timeEnd(name: &str);
}

#[wasm_bindgen]
pub fn get_memory() -> JsValue {
    return wasm_bindgen::memory();
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
        let size = (self.width * self.height * self.depth) as usize;
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

    pub fn toggle_cell(&mut self, column: u32, row: u32, layer: u32) {
        let (next, current) = if self.a_latest {
            (&mut self.cells_b, &self.cells_a)
        } else {
            (&mut self.cells_a, &self.cells_b)
        };
        let idx = get_index(column, row, layer, self.width, self.height);
        let size = (self.width * self.height * self.depth) as usize;
        for i in 0..size {
            if i == idx {
                next.set(i, !current[i]);
            } else {
                next.set(i, current[i]);
            }
        }
        self.a_latest = !self.a_latest;
    }

    pub fn glider(&mut self, column: u32, row: u32, layer: u32) {
        let first_layer = if layer <= 1 { self.depth - 2 + layer } else { layer - 2 };
        let second_layer = if layer == 0 { self.depth - 1 } else { layer - 1 };
        let last_layer = if layer == self.depth - 1 { 0 } else { layer + 1 };
        self.print(column, row, first_layer, &CLEAN);
        self.print(column, row, second_layer, &GLIDER);
        self.print(column, row, layer, &GLIDER);
        self.print(column, row, last_layer, &CLEAN);
    }

    pub fn pulse(&mut self, column: u32, row: u32, layer: u32) {
        let first_layer = if layer <= 1 { self.depth - 2 + layer } else { layer - 2 };
        let second_layer = if layer == 0 { self.depth - 1 } else { layer - 1 };
        let last_layer = if layer == self.depth - 1 { 0 } else { layer + 1 };
        self.print(column, row, first_layer, &CLEAN);
        self.print(column, row, second_layer, &PULSE_ONE);
        self.print(column, row, layer, &PULSE_TWO);
        self.print(column, row, last_layer, &CLEAN);
    }

    fn print(&mut self, column: u32, row: u32, layer: u32, drawing: &[bool; 25]) {
        let current = if self.a_latest {
            &mut self.cells_a
        } else {
            &mut self.cells_b
        };
        let mut count = 0;
        for delta_col in [self.width - 2, self.width - 1, 0, 1, 2].iter().cloned() {
            let neighbor_column = (column + delta_col) % self.width;
            for delta_row in [self.height - 2, self.height - 1, 0, 1, 2].iter().cloned() {
                let neighbor_row = (row + delta_row) % self.height;
                let idx = get_index(neighbor_column, neighbor_row, layer, self.width, self.height);
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
            for column in 0..self.width {
                for layer in 0..self.depth {
                    let idx = get_index(column, row, layer, self.width, self.height);
                    let cell = current[idx];
                    let live_neighbors =
                        live_neighbor_count(column, row, layer, self.width, self.height, self.depth, current);

                    match (cell, live_neighbors) {
                        // Rule 1: Any live cell with fewer than five live neighbours
                        // dies, as if caused by underpopulation.
                        (true, x) if x < 5 => next.set(idx, false),
                        // Rule 3: Any live cell with more than 7 live
                        // neighbours dies, as if by overpopulation.
                        (true, x) if x > 7 => next.set(idx, false),
                        // Rule 4: Any dead cell with exactly 6 live neighbours
                        // becomes a live cell, as if by reproduction.
                        (false, 6) => next.set(idx, true),
                        // All other cells remain in the same state.
                        (enabled, _) => next.set(idx, enabled),
                    };
                }
            }
        }
        self.a_latest = !self.a_latest;
    }

    pub fn new(width: u32, height: u32, depth: u32, fill_random: bool) -> Universe {
        let size = (width * height * depth) as usize;
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
            depth,
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

const PULSE_ONE: [bool; 25] = [
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    false,
    false,
    false,
    true,
    false,
    true,
    false,
    false,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
];

const PULSE_TWO: [bool; 25] = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
];

const CLEAN: [bool; 25] = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
];
