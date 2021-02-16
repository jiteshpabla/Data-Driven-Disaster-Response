var nested;
var root;
var nodes;

const squar_size = 15;
const INNER_PAD_SIZE = 5;
const BUBBLE_COLOR = d3.scaleOrdinal().range(d3.schemeSet3); // we could use a scheme that has bins for each node (~22)

function bubbles(data) {
  nested = d3
    .nest()
    .key((d) => d.parent)
    .key((d) => d.location)
    .rollup((d) => d) // not totally sure what rollup does, but we'll drag the data around so that we can pull the id later
    .entries(data);

  root = d3.hierarchy(makeRoot(nested, false)).sum((d) => d.data.total);
  nodes = d3.pack()(root).descendants();

  let h = (nodes.length + 1) * (squar_size + INNER_PAD_SIZE); // height of legend will related to number of nodes
  let w = h;

  const chart = d3
    .select("#sentiment-bubbles > svg")
    .attr("viewBox", `0 0 ${w} ${h}`);
  //.attr("perserveAspectRatio", "xMinYMid");

  BUBBLE_COLOR.domain(d3.extent(nodes, (n) => n.b_chart_height));
  let legend = drawLegend(chart, nodes);

  let pack = d3
    .pack()
    .size([
      w - legend.node().getBBox().width - INNER_PAD_SIZE,
      Math.min(h, legend.node().getBBox().height) - INNER_PAD_SIZE,
    ])
    .padding(1);

  draw(chart, pack(root).descendants());
}

function draw(chart, data) {
  var legend = chart.select("#bubbleLegend");

  if (legend.empty()) {
    legend = drawLegend(chart, data);
  }

  var c = chart.select("#bubbles");

  if (c.empty()) {
    c = chart
      .append("g")
      .attr("id", "bubbles")
      .attr(
        "transform",
        (d, i) =>
          `translate(${legend.node().getBBox().width + INNER_PAD_SIZE}, ${0})`
      );
  }
  packCircles(c, data);
  //drawText(chart, data);
}

function drawLegend(dest, data) {
  var legend = selectCreate(dest, "bubbleLegend");
  // I think the legend is self explanitory and doesn't need a header
  /*legend
      .append("text")
      .attr("dy", "-.2em")
      .text("Neighborhood")
      .attr("font-size", "20px");*/

  legend
    .selectAll("g")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      (d, i) => `translate(${0}, ${i * (squar_size + INNER_PAD_SIZE)})`
    );

  legend
    .selectAll("g")
    .append("rect")
    .attr("width", squar_size)
    .attr("height", squar_size)
    .style("fill", function (d) {
      return BUBBLE_COLOR(d.data.id);
    });
  legend
    .selectAll("g")
    .append("text")
    .attr("text-anchor", "front")
    .attr("text-align", "left")
    .attr("dx", squar_size + 3)
    .attr("dy", squar_size * 0.75) // not sure why it's not 0.5, but .75 ends up more centered
    .text(function (d) {
      return d.data.id;
    })
    .attr("font-size", "12px");

  return legend;
}

function packCircles(g, data) {
  g.selectAll("g") // create a group for each data element
    .data(data)
    .enter()
    .append("g")
    .attr("class", "bubble")
    .attr("id", (d) => {
      if (d.data.data.hasOwnProperty("ZoneId")) {
        // I think the packing function is causing the data.data- not ideal, but for now this works
        return `zone-${d.data.data.ZoneId}-bubble`;
      } else {
        return `${d.data.id.toLowerCase().replace(" ", "")}-bubble`;
      }
    })
    .attr("transform", (d) => `translate(${[d.x, d.y]})`)
    .on("click", (d) => {
      clickaDaDot(d, BUBBLE_COLOR(d.data.id));
    })
    .on("mouseover", (d) => {
      if (d.depth === 0) {
        // root element(s)
        $(".outline-path").addClass("hilight");
      }

      if (!d.data.data.hasOwnProperty("ZoneId")) {
        return;
      }
      $(`#_${d.data.data.ZoneId}`).addClass("hilight");
    })
    .on("mouseout", (d) => {
      $("path.hilight, .outline-path").removeClass("hilight");
    });

  g.selectAll("g") // add a circle to each group
    .append("circle")
    .attr("r", (d) => d.r)
    .attr("fill", function (d) {
      return BUBBLE_COLOR(d.data.id);
    })
    .attr("stroke", "black");

  g.selectAll("g") // add text to the group (done second to draw on top of circle)
    .append("text")
    .style("text-anchor", "middle") // in code rather than css so that the element centers correctly
    .style("alignment-baseline", "middle")
    .text((d) => `${d.data.data.total}`) // I don't think we need the zone name, it makes the text smaller plus it can be an on hover thing
    .style("font-size", function (d) {
      const size = Math.min(
        2 * d.r,
        ((2 * d.r - 8) / this.getComputedTextLength()) * 9
      );
      if (size > 5) {
        return size + "px";
      }
      return 0;
    })
    .attr("y", function (d) {
      return +this.style.fontSize.split("px")[0] / 4;
    })
    .attr("opacity", (d) => (d.r > 11 && !d.children ? 1 : 0));
}

var x;
var y;
function clickaDaDot(circ_info, fill) {
  lp_svg = d3
    .select("#flow-diagram > svg")
    .attr("viewBox", "0 0 960 300")
    .attr("perserveAspectRatio", "xMinYMid");
  lp_svg.selectAll("*").remove();

  data = sentimentData.find((sd) => sd.location === circ_info.data.id);
  var margin = { top: 10, right: 80, bottom: 40, left: 100 },
    width = 960 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

  // append the lp_svg object to the body of the page

  // Parse the Data
  data_list = [
    { sentiment: "Positive", percentage: data.positivePct },
    { sentiment: "Negative", percentage: data.negativePct },
    { sentiment: "Neutral", percentage: data.neutralPct },
  ];

  /*for (const property in data) {
    if (property !== "Total") {
      console.log(`${property}: ${data[property]}`);
      data_list.push({
        sentiment: property,
        percentage: data[property],
      });
    }
  }
  console.log(data_list);*/

  // append tool tip
  const tooltip = lp_svg
    .append("g")
    .attr("class", "tooltip")
    .attr("opacity", 1);
  // tooltip.append("rect")
  //     .attr("width", 80)
  //     .attr("height", 50)
  //     .attr()
  //     .attr("x", -3).attr("y", -10);

  tooltip.append("text").attr("class", "Percent").attr("y", 5);

  // var array = data.map(function(d) { return [ d["Country"], +d["Value"] ]; });
  // console.log(array)
  // console.log(data)

  // // Add X axis
  x = d3.scaleLinear().domain([0, 1]).range([0, width]);
  lp_svg
    .append("g")
    .attr("transform", "translate(" + margin.right + "," + height + ")")
    .call(
      d3.axisBottom(x).tickFormat(function (d) {
        return d3.format(".0%")(d);
      })
    )
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Y axis
  y = d3
    .scaleBand()
    .range([0, height])
    .domain(data_list.map((d) => d.sentiment))
    .padding(1);

  lp_svg
    .append("g")
    .attr("transform", "translate(" + margin.right + ",0)")
    .call(d3.axisLeft(y));

  // Lines
  d_line = lp_svg.selectAll("myline").data(data_list).enter();

  d_line
    .append("line")
    .attr("x1", x(0) + margin.right)
    .attr("x2", x(0) + margin.right)
    .attr("y1", function (d) {
      return y(d["sentiment"]);
    })
    .attr("y2", function (d) {
      return y(d["sentiment"]);
    })
    .attr("stroke", "grey");
  // Circles -> start at X=0
  c_sel = lp_svg.selectAll("mycircle").data(data_list).enter();

  c_sel
    .append("circle")
    .attr("cx", 0 + margin.right)
    .attr("cy", (d) => y(d.sentiment))
    .attr("r", "25")
    .style("fill", (d) => {
      let colorScale = sentimentScales[d.sentiment.toLowerCase()];
      return colorScale(d.percentage);
    })
    .attr("stroke", "black")
    .on("mouseover", showDetails)
    .on("mouseleave", hideDetails);

  // Change the X coordinates of line and circle
  lp_svg
    .selectAll("circle")
    .transition()
    .duration(2000)
    .attr("cx", function (d) {
      new_x = x(d.percentage) + margin.right;
      return new_x;
    });

  lp_svg
    .selectAll("line")
    .transition()
    .duration(2000)
    .attr("x1", function (d) {
      new_x = x(d.percentage) + margin.right;
      if (isNaN(new_x)) {
        return 0;
      }
      return new_x;
    });

  /*lp_svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2 + 25)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "underline")
    .text(`Sentiment Breakdown of ${circ_info.data.id}`);*/

  $("#flow-diagram > h2").text(`Sentiment Breakdown of ${circ_info.data.id}`);
  // X axis label:
  lp_svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 30)
    .text("Percent");

  // Y axis label:
  lp_svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 120)
    .attr("x", -(height / 3))
    .text("Sentiment");
}
function showDetails(d) {
  y_pos = d3.select(this).attr("cy");
  x_pos = d3.select(this).attr("cx");
  x_pos = +x_pos + 30;
  d3.select(".tooltip")
    .attr("opacity", 1)
    .attr("transform", `translate(${[x_pos, y_pos]})`)
    .raise();

  const text1 = d3
    .select(".tooltip .Percent")
    .text(d3.format(PCT_FORMAT)(d.percentage));

  // const boxWidth = 6 + d3.max([text1.node().getComputedTextLength()]);

  // d3.selectAll(".tooltip text").raise().raise()
  // d3.select(".tooltip rect").attr("width", boxWidth);
}
function hideDetails(d) {
  d3.select(".tooltip").attr("opacity", 0);
}
