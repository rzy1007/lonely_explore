import { store } from '../store.js';
import { SCALES, celestialBodies, searchBodies } from '../data/celestial.js';

let sidebar, tree, searchInput;

export function initSidebar() {
  sidebar = document.getElementById('sidebar');
  tree = document.getElementById('celestial-tree');
  searchInput = document.getElementById('search-box');

  // Toggle button
  const toggleBtn = document.getElementById('sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    store.sidebarOpen = !store.sidebarOpen;
    sidebar.classList.toggle('open', store.sidebarOpen);
    store.emit('sidebarToggle', store.sidebarOpen);
  });

  // Search
  searchInput.addEventListener('input', () => {
    renderTree(searchInput.value);
  });

  // Listen for store events
  store.on('sidebarToggle', (open) => {
    sidebar.classList.toggle('open', open);
  });

  renderTree('');
}

function renderTree(query) {
  tree.innerHTML = '';

  const results = query ? searchBodies(query) : null;

  if (results) {
    // Search results
    if (results.length === 0) {
      tree.innerHTML =
        '<div class="tree-category">未找到匹配天体</div>';
      return;
    }
    results.forEach((body) => {
      tree.appendChild(makeNode(body));
    });
  } else {
    // Grouped by scale
    SCALES.forEach((scale) => {
      const catDiv = document.createElement('div');
      catDiv.className = 'tree-category';
      catDiv.textContent = `${scale.icon} ${scale.name}`;
      tree.appendChild(catDiv);

      const bodies = celestialBodies.filter(
        (b) => b.scale === scale.id && !b.parent
      );
      bodies.forEach((body) => {
        tree.appendChild(makeNode(body));
        // Add children
        const children = celestialBodies.filter((b) => b.parent === body.id);
        children.forEach((child) => {
          const childNode = makeNode(child);
          childNode.style.paddingLeft = '2rem';
          childNode.style.fontSize = '0.82rem';
          tree.appendChild(childNode);
        });
      });
    });

    // Add parented bodies without parent in tree (edge case)
    const parented = celestialBodies.filter((b) => b.parent);
    parented.forEach((body) => {
      const parentBodies = celestialBodies.filter(
        (b) => b.scale === body.scale && !b.parent
      );
      const alreadyShown = parentBodies.some((p) => p.id === body.parent);
      if (!alreadyShown) {
        tree.appendChild(makeNode(body));
      }
    });
  }
}

function makeNode(body) {
  const div = document.createElement('div');
  div.className = 'tree-node';
  div.textContent = `${body.name} (${body.nameEn})`;
  div.dataset.bodyId = body.id;

  div.addEventListener('click', () => {
    store.selectBody(body.id);
    // Update selected state
    tree.querySelectorAll('.tree-node').forEach((n) => n.classList.remove('selected'));
    div.classList.add('selected');
  });

  // Restore selected state
  if (body.id === store.selectedBodyId) {
    div.classList.add('selected');
  }

  store.on('bodyDeselected', () => {
    div.classList.remove('selected');
  });

  return div;
}
