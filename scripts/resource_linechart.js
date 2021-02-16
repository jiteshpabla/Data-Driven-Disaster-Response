function rscLineChart(lda, loc, labels) {
  // Set the dimensions of the canvas / graph

  const margin = { top: 20, right: 100, bottom: 60, left: 75 };
  const width = $("#line-chart1").width();
  const height = 385;
  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width - margin.left - margin.right;

  // set the ranges
  const xScale = d3.scaleTime().range([0, innerWidth]);
  const yScale = d3.scaleLinear().range([innerHeight, 0]);
  const colorScale = d3.scaleOrdinal().range(d3.schemeCategory10);

  var res_data;

  res_data = lda;
  loc_msg_data = loc;

  nested_loc_data = d3
    .nest()
    .key((d) => d["Dominant_Topic"]) // group by the dominat topic
    .sortKeys(d3.ascending)
    .key((d) => {
      // shed the minutes & group by remaining date
      let t = new Date(d.time);
      let hourGroup = 12;

      t.setHours(Math.floor(t.getHours() / hourGroup) * hourGroup);
      t.setMinutes(0);
      return t.toString();
    })
    .sortKeys((a, b) => d3.ascending(new Date(a), new Date(b)))

    .key((d) => d.location)

    .rollup((d) => {
      return d.length;
    })
    .entries(res_data);

  nested_loc_data.forEach((topic) => {
    topic.values.forEach((time) => {
      time.total = d3.sum(time.values, (z) => z.value);
    });

    topic.total = d3.sum(topic.values, (t) => t.total);
  });

  xScale.domain(timeRange).nice();
  yScale
    .domain([
      0,
      d3.max(nested_loc_data, (d) => d3.max(d.values, (v) => v.total)),
    ])
    .nice();

  let topics = [];
  [...new Set(res_data.map((item) => item["Dominant_Topic"]))]
    .sort()
    .forEach((d, i) =>
      topics.push({
        id: d,
        name: labels.find((l) => l.Topic === d).Name,
      })
    ); // Derefrence Domain topics here!!!

  var lineSvg = d3
    .select("#line-chart1 > svg")
    //.attr("width", width + margin.left + margin.right)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("perserveAspectRatio", "xMinYMid");

  drawLegend(topics, "ldaLegend", lineSvg);
  drawAxis(lineSvg);
  plotLines(nested_loc_data, lineSvg);

  var pieSvg = d3
    .select("#pie-chart > svg")
    //.attr("width", width + margin.left + margin.right)
    .attr("height", "15vh"); //height + margin.top + margin.bottom);
  drawWholePieChart(nested_loc_data, pieSvg);

  function drawLegend(data, id, dest) {
    var legend = selectCreate(dest, id);

    legend
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        (d, i) => `translate(${innerWidth + margin.left}, ${i * 20})`
      )
      .on("mouseover", (d, i) => {
        // Change Line chart
        $(`#lda-topic-${d.id} > path`).addClass("focus-line");
        $(`.lda-topic-line:not(#lda-topic-${d.id})`).addClass("fade-line");

        // Tooltip
        let t = labels.find((l) => l.Topic === d.id).Desc;

        if (t === null) {
          return;
        }
        tooltipDiv.select("t").text(t);
        tooltipDiv
          .style("display", null)
          .style(
            "left",
            d3.event.pageX -
              tooltipDiv.node().getBoundingClientRect().width +
              "px"
          )
          .style("top", d3.event.pageY - 15 + "px");
      })
      .on("mousemove", (d, i) => {
        tooltipDiv
          .style(
            "left",
            d3.event.pageX -
              tooltipDiv.node().getBoundingClientRect().width +
              "px"
          )
          .style("top", d3.event.pageY - 15 + "px");
      })
      .on("mouseout", (d, i) => {
        // Revert line
        $(`.lda-topic-line > path`).removeClass("focus-line");
        $(`.lda-topic-line`).removeClass("fade-line");

        // Tooltip
        tooltipDiv.select("t").text("");
        tooltipDiv.style("display", "none");
      });

    legend
      .selectAll("g")
      .append("rect")
      .attr("width", squar_size)
      .attr("height", squar_size)
      .style("fill", function (d) {
        return colorScale(d.id);
      });
    legend
      .selectAll("g")
      .append("text")
      .attr("text-anchor", "front")
      .attr("text-align", "left")
      .attr("dx", squar_size + 3)
      .attr("dy", squar_size * 0.75) // not sure why it's not 0.5, but .75 ends up more centered
      .text(function (d) {
        return d.name;
      })
      .attr("font-size", "12px");

    return legend;
  }

  function drawAxis(dest) {
    var axis = selectCreate(dest, "ldaGraph");
    axis.attr("transform", `translate(${margin.left} ${0})`);

    // X axis
    axis
      .append("g")
      .attr("transform", `translate(${0},${innerHeight + margin.top})`)
      .call(d3.axisBottom(xScale))
      .attr("class", "axis");

    // Y axis
    axis
      .append("g")
      .attr("transform", `translate(${0},${margin.top})`)
      .call(d3.axisLeft(yScale))
      .attr("class", "axis");

    // X Label
    axis
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.top + 50)
      .attr("class", "axis label")
      .text("Time");

    // Y Label
    axis
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -1 * (innerHeight / 2)) //behaves like y because of the rotate
      .attr("y", -50)
      .attr("class", "axis label")
      .text("Frequency of Messages");
  }

  function plotLines(data, dest) {
    var plot = selectCreate(dest, "ldaPlot");
    plot.attr("transform", `translate(${margin.left} ${0})`);

    var valueline = d3
      .line()
      .x(function (d) {
        return xScale(new Date(d.key));
      })
      .y(function (d) {
        return yScale(d.total);
      });

    //data.forEach((type) => {
    plot
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "lda-topic-line")
      .attr("id", (d) => {
        let f = `lda-topic-${d.key}`;
        return f;
      });

    plot
      .selectAll("g")
      .append("path")
      .attr("class", "line")
      .style("stroke", (d) => colorScale(parseInt(d.key)))
      .attr("d", (d, i) => valueline(d.values));

    data.forEach((topic) => {
      plot
        .select(`#lda-topic-${topic.key}`)
        .selectAll("circle")
        .data(topic.values)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(new Date(d.key)))
        .attr("cy", (d) => yScale(d.total))
        .style("fill", (d) => {
          return colorScale(parseInt(topic.key));
        })
        .attr("r", 3);
    });

    plot.selectAll("g").append("circle");
  }

  //--------------------------------------------------
  //Donut Pie chart Code from here
  //--------------------------------------------------
  function drawWholePieChart(data, dest) {
    slim_data = [];

    pieW = parseFloat(dest.style("width").replace("px", ""));
    pieH = parseFloat(dest.style("height").replace("px", ""));

    var pie_rad = pieH / 2;

    data.forEach((d) => {
      slim_data.push({
        topicId: d.key,
        count: d3.sum(d.values, (v) => v.total),
      });
    });

    var pie = d3
      .pie()
      .sort(null)
      .value(function (d) {
        return d.count;
      });
    var data_ready = pie(slim_data);

    // The arc generator
    var arc = d3
      .arc()
      .innerRadius(pie_rad * 0.45)
      .outerRadius(pie_rad * 0.8);

    var arc2 = d3
      .arc()
      .innerRadius(pie_rad * 0.45)
      .outerRadius(pie_rad * 0.95);

    let slices = selectCreate(dest, "allSlices");
    slices.attr("transform", `translate(${pieW / 2} ${pieH / 2})`); // swap width /2 for /3 for second graph
    slices
      .selectAll("path")
      .data(data_ready)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", function (d) {
        return colorScale(parseInt(d.data.topicId));
      })
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0.7)
      .on("mouseover", function (d, i) {
        // Embiggen
        d3.select(this).style("opacity", 1).attr("d", arc2);

        // Change Line chart
        $(`#lda-topic-${d.data.topicId} > path`).addClass("focus-line");
        $(`.lda-topic-line:not(#lda-topic-${d.data.topicId})`).addClass(
          "fade-line"
        );

        // Tooltip
        let t = labels.find((l) => l.Topic === parseInt(d.data.topicId)).Name;

        if (t === null) {
          return;
        }
        tooltipDiv.select("h4").text(t);
        tooltipDiv.select("t").text(`Count: ${d.data.count}`);

        tooltipDiv
          .style("display", null)
          .style("left", d3.event.pageX + 15 + "px")
          .style("top", d3.event.pageY - 15 + "px");
      })
      .on("mousemove", function (d, i) {
        tooltipDiv
          .style("left", d3.event.pageX + 15 + "px")
          .style("top", d3.event.pageY - 15 + "px");
      })
      .on("mouseout", function (d, i) {
        // Shrink
        d3.select(this).style("opacity", 0.7).attr("d", arc);

        // Revert line
        $(`.lda-topic-line > path`).removeClass("focus-line");
        $(`.lda-topic-line`).removeClass("fade-line");

        // Tooltip
        tooltipDiv.select("t").text("");
        tooltipDiv.select("h4").text("");
        tooltipDiv.style("display", "none");
      });
  }
}
