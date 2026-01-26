(function () {
  const svg = document.getElementById("graph");
  const sidebarTitle = document.getElementById("sidebar-title");
  const sidebarSummary = document.getElementById("sidebar-summary");
  const sidebarEntry = document.getElementById("sidebar-entry");
  const sidebarLinks = document.getElementById("sidebar-links");
  const searchInput = document.getElementById("search");
  const clearBtn = document.getElementById("clear-search");

  const fallback = window.GRAPH_FALLBACK || null;

  function setSidebar(node) {
    if (!node) {
      sidebarTitle.textContent = "请选择图谱节点";
      sidebarSummary.textContent = "搜索或点击节点查看细节。";
      sidebarEntry.textContent = "";
      sidebarLinks.innerHTML = "";
      return;
    }
    sidebarTitle.textContent = node.label;
    sidebarSummary.textContent = node.summary || "（待补充）";
    sidebarEntry.textContent = node.entry || "（待补充）";
    const mdLink = node.md ? `<a href="${node.md}">打开对应 MD</a>` : "";
    const pageLink = node.slug ? `<a href="pages/${node.slug}.html">打开概念页</a>` : "";
    sidebarLinks.innerHTML = [mdLink, pageLink].filter(Boolean).join(" | ");
  }

  function normalize(text) {
    return (text || "").toLowerCase();
  }

  function matchNode(node, query) {
    if (!query) return true;
    const haystack = [
      node.label,
      node.summary,
      node.entry,
      (node.tags || []).join(" ")
    ].map(normalize).join(" ");
    return haystack.includes(query);
  }

  function computePositions(nodes, width, height) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.max(120, Math.min(width, height) / 2 - 80);
    const step = (Math.PI * 2) / nodes.length;
    return nodes.reduce((acc, node, idx) => {
      const angle = idx * step - Math.PI / 2;
      acc[node.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      };
      return acc;
    }, {});
  }

  function renderGraph(graph) {
    if (!graph) {
      svg.innerHTML = "<text x='20' y='40'>无法加载 graph.json，请检查文件</text>";
      return;
    }

    const { nodes, edges } = graph;
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 520;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";

    const positions = computePositions(nodes, width, height);

    edges.forEach(edge => {
      const from = positions[edge.from];
      const to = positions[edge.to];
      if (!from || !to) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      line.setAttribute("class", "edge");
      svg.appendChild(line);

      if (edge.label) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", (from.x + to.x) / 2);
        label.setAttribute("y", (from.y + to.y) / 2 - 6);
        label.setAttribute("class", "edge-label");
        label.textContent = edge.label;
        svg.appendChild(label);
      }
    });

    const nodeElements = [];

    nodes.forEach(node => {
      const pos = positions[node.id];
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "node");
      g.setAttribute("data-id", node.id);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", pos.x);
      circle.setAttribute("cy", pos.y);
      circle.setAttribute("r", 32);
      g.appendChild(circle);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", pos.x);
      text.setAttribute("y", pos.y + 4);
      text.setAttribute("text-anchor", "middle");
      text.textContent = node.label;
      g.appendChild(text);

      g.addEventListener("click", () => {
        setSidebar(node);
        if (node.slug) {
          window.open(`pages/${node.slug}.html`, "_blank");
        }
      });

      svg.appendChild(g);
      nodeElements.push({ node, element: g });
    });

    setSidebar(nodes[0]);

    function applySearch(query) {
      nodeElements.forEach(({ node, element }) => {
        const matched = matchNode(node, query);
        element.classList.toggle("highlight", matched && query);
      });
      const firstMatch = nodeElements.find(({ node }) => matchNode(node, query));
      if (firstMatch && query) {
        setSidebar(firstMatch.node);
      }
      if (!query) {
        setSidebar(nodes[0]);
      }
    }

    searchInput.addEventListener("input", () => {
      const query = normalize(searchInput.value.trim());
      applySearch(query);
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      applySearch("");
    });

    window.addEventListener("resize", () => renderGraph(graph));
  }

  async function init() {
    try {
      const res = await fetch("graph.json", { cache: "no-store" });
      if (!res.ok) throw new Error("graph.json load failed");
      const data = await res.json();
      renderGraph(data);
    } catch (err) {
      renderGraph(fallback);
    }
  }

  init();
})();
