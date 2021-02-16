function makeRoot(items, nesting) {
  return makeSubtree(items[0], nesting);
}

/**
 *
 * @param item
 * @param nesting If true, preserves cluster nesting (all leaves at same level)
 * @returns {{id: *, data: {population: number, area: number}}}
 */
function makeSubtree(item, nesting) {
  let object = {
    id: item.key,
    data: { name: 0, count: 0 },
  };
  if (item.values) {
    if (nesting) {
      if (item.values.length == 1) {
        // remove unnecessary nesting
        object = makeSubtree(item.values[0], nesting);
      } else {
        object.children = [];
        item.values.forEach(function (value) {
          const subtree = makeSubtree(value, nesting);
          object.children.push(subtree);
          object.data.name += subtree.data.name;
          object.data.count += subtree.data.count;
        });
      }
    } else {
      object.children = [];
      item.values.forEach(function (value) {
        const subtree = makeSubtree(value, nesting);
        object.children.push(subtree);
        object.data.name += subtree.data.name;
        object.data.count += subtree.data.count;
      });
    }
  } else if (item.value) {
    object.data = item.value[0];
  }
  return object;
}
// un_regions referenced from book Learn D3.js: Create interactive data-driven visualizations for the web with the D3.js library 