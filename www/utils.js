export const isBitSet = (number, bitPosition) => {
    return (number & (1 << bitPosition)) !== 0;
};

export const getIndex = (column, row, layer, size) => {
    return column + row * size + layer * size * size;
};