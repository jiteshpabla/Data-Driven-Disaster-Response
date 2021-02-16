let chatFreq = [];

const barXScale = d3.scaleLinear();
const barYScale = d3.scaleBand().padding(0.1);

const barMargin = {
  top: 20,
  right: 25,
  bottom: 20,
  left: 65,
};

const barChartHeight = "15vh";
const barChartWidth = "25vw";

function prepareMiniBar(msgData) {
  // group messages by location and then by account

  chatFreq = d3
    .nest()
    .key((d) => d.location)
    .sortKeys(d3.ascending)
    .key((d) => d.account)
    .rollup((d) => d.length)
    .entries(msgData);

  // sort by number of messages
  chatFreq.forEach((loc) => {
    loc.values.sort((a, b) => d3.descending(a.value, b.value));
  });

  barXScale.domain([0, d3.max(chatFreq, (d) => d.values[0].value)]);

  let maxName = d3.max(msgData, (d) => d.account.length);
  barMargin.left = maxName * 5;
}

function drawBars(dest, zoneName, topN) {
  let svg = dest.select("svg");

  if (svg.empty()) {
    svg = dest.append("svg");
  }

  svg
    .attr("id", "minibar")
    .attr("width", barChartWidth)
    .attr("height", barChartHeight);

  let sel = $(dest.node());

  const w = sel.width();
  const h = sel.height();

  svg.attr("viewbox", [0, 0, w, h]);

  let data = [
    ...chatFreq.find((c) => c.key === zoneName.location).values,
  ].splice(0, topN);

  barXScale.range([barMargin.left, w - barMargin.right]);
  barYScale
    .domain(d3.range(topN))
    .rangeRound([barMargin.top, h - barMargin.bottom * 2]);

  let x = barXScale;
  let y = barYScale;

  let format = x.tickFormat(20, data.format);
  xAxis = (g) =>
    g
      .attr("transform", `translate(0,${barMargin.top})`)
      .call(d3.axisTop(x).ticks(width / 80, data.format))
      .call((g) => g.select(".domain").remove());

  yAxis = (g) =>
    g
      .attr("transform", `translate(${barMargin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .tickFormat((i) => data[i].key)
          .tickSizeOuter(0)
      )
      .attr("id", "minibar-yaxis");

  svg
    .append("g")
    .style("fill", (d, i) => {
      return BUBBLE_COLOR(zoneName.location);
    })
    .attr("class", "bar")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d, i) => y(i))
    .attr("width", (d) => {
      let fatnes = x(d.value) - x(0);
      return fatnes;
    })
    .attr("height", y.bandwidth());

  svg
    .append("g")
    .attr("fill", "white")
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", (d) => x(d.value))
    .attr("y", (d, i) => y(i) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text((d) => format(d.value))
    .call((text) =>
      text
        .filter((d) => x(d.value) - x(0) < 20) // short bars
        .attr("dx", +4)
        .attr("fill", "black")
        .attr("text-anchor", "start")
    );

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  return svg.node();
}
