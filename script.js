document.addEventListener('DOMContentLoaded', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]);  // Centering the graph

    // Create a tooltip element
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");


    d3.json("https://raw.githubusercontent.com/DealPete/forceDirected/master/countries.json").then(data => {
        console.log(data); // Keep this for debugging until you're sure it's working

        // 1. Create a MAP of nodes by ID (for efficient lookup)
        const nodeMap = new Map();
        data.nodes.forEach(node => {
            nodeMap.set(node.code.toLowerCase(), { ...node, id: node.code.toLowerCase() }); // Consistent ID
        });

        // 2. Filter the links: Check if source and target are numbers or strings
        const validLinks = data.links.filter(link => {
            const source = typeof link.source === 'number' ? String(link.source) : link.source.toLowerCase();
            const target = typeof link.target === 'number' ? String(link.target) : link.target.toLowerCase();
            const sourceExists = nodeMap.has(source);
            const targetExists = nodeMap.has(target);
            return sourceExists && targetExists;
        });

        // 3. Get the nodes and (filtered) links
        const nodes = Array.from(nodeMap.values());
        const links = validLinks;


        // --- Force Simulation Setup ---
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(50))  // Use d.id
            .force("charge", d3.forceManyBody().strength(-50)) // Repulsion
            .force("center", d3.forceCenter(0, 0));  // Center the graph


        // --- Create the links (lines) ---
        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link");

        // --- Create the nodes (images) ---
        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("image") // Use <image> for flag icons
            .data(nodes)
            .enter().append("image")
            .attr("class", "node")
            .attr("xlink:href", d => `https://flagcdn.com/24x18/${d.id}.png`) // Using flagcdn.com
            .attr("width", 24)
            .attr("height", 18)
            .attr("x", -12) // Center the image horizontally
            .attr("y", -9)  // Center the image vertically
            .call(d3.drag()  // Make nodes draggable
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`${d.country}<br><img src="https://flagcdn.com/24x18/${d.id}.png" class="flag-icon">`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });


        // --- Tick function (updates node and link positions) ---
        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x}, ${d.y})`);  // Position nodes
        }

        simulation.on("tick", ticked);

        // --- Dragging functions ---
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

    }).catch(error => {
        console.error("Error loading data:", error);
    });
});
