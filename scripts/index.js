var mapSvg;
var mapZones;

var mapClick = (d, i) => {}; //null function
var mapOver = (d, i) => {};
var mapMove = (d, i) => {};
var mapOff = (d, i) => {};

var tooltipDiv;
var tipText;

var zoneData;

var timeRange = [];

var sentimentData;
var sentimentScales;

var ldaData;

const PCT_FORMAT = ".2%"; // format percents to two decmials

function computePercents(values) {
  values.forEach((loc) => {
    loc.positivePct = loc.positive / loc.total;
    loc.negativePct = loc.negative / loc.total;
    loc.neutralPct = loc.neutral / loc.total;

    let zone = zoneData.find((z) => z.Name === loc.location);

    if (zone !== undefined) {
      loc.ZoneId = zone.ZoneId;
    }
  });

  sentimentData = values;

  sentimentScales = {
    positive: d3
      .scaleSequential(d3.interpolateGreens)
      .domain(d3.extent(values, (v) => v.positivePct)),
    negative: d3
      .scaleSequential(d3.interpolateReds)
      .domain(d3.extent(values, (v) => v.negativePct)),
    neutral: d3
      .scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(values, (v) => v.neutralPct)),
  };
}

//on page load
$(document).ready(function () {
  Promise.all([
    d3.xml("resources/map.svg"),
    d3.csv("data/Neighborhoods.csv", d3.autoType),
    d3.csv("data/sentiment_loc_lte.csv", d3.autoType),
    d3.csv("data/YInt_LDA_1_0.csv", d3.autoType),
    d3.csv("data/lda_dref.csv", d3.autoType),
  ])
    .then(([map, zones, sentiment, lda, ldaLbl]) => {
      // Draw map loaded from file
      let mapAlt = map.documentElement;
      mapAlt.id = "map";
      d3.select("#map-card").node().append(mapAlt);

      mapSvg = d3.select("#map");
      mapZones = mapSvg.select("#zones");

      mapZones
        .selectAll("path")
        .each(function () {
          this.__data__ = {
            ZoneId: parseInt(this.getAttribute("data-name")),
            location: this.getAttribute("altId"),
          };
        })
        .on("mouseover", function (d, i) {
          d3.select(this).classed("hilight", true);

          tooltipDiv
            .style("display", null)
            .style("left", d3.event.pageX + 20 + "px")
            .style("top", d3.event.pageY - 15 + "px");

          try {
            mapOver(d, i);
          } catch (e) {}

          tooltipDiv.select("h4").text(d.location || d.Name);
          tooltipDiv.select("t").text(tipText);
        })
        .on("mousemove", function (d, i) {
          tooltipDiv
            .style("left", d3.event.pageX + 20 + "px")
            .style("top", d3.event.pageY - 15 + "px");

          try {
            mapMove(d, i);
          } catch (e) {}
        })
        .on("mouseout", function (d, i) {
          d3.select(this).classed("hilight", false);
          tooltipDiv.style("display", "none");

          try {
            mapOff(d, i);
          } catch (e) {}

          tooltipDiv.select("t").text("");
        })
        .on("click", function (d, i) {
          try {
            mapClick(d, i);
          } catch (e) {}
        });

      //zoneData
      zoneData = zones;

      // LDA data prep
      ldaData = lda;
      timeRange = d3.extent(ldaData, (d) => d.time);

      // Prepare bar chart tooltip
      prepareMiniBar(ldaData);

      // Draw LDA line chart
      rscLineChart(ldaData, sentimentData, ldaLbl);

      // Resource Area chart
      rscAreaChart(ldaData, zones);

      // Sentiment percentages (Sen)
      computePercents(sentiment);
      bubbles(sentimentData);
      d3.select("#st\\.himark-bubble").dispatch("click"); // default to city wide lollipop

      // Draw sentiment over time
      sentLine();

      $("#resources-btn").click(); //default to resources tab
    })
    .catch(function (err) {
      console.log("error: ", err);
    });

  tooltipDiv = d3.select(".hover-tip");

  //On click of any li's children of #nav-tab
  $("#nav-tab > li").click(function () {
    // Declare all variables
    let i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = $(".tab-content").hide();

    // Remove active class from all li's in #nav-tab
    tablinks = $("#nav-tab > li").removeClass("active");

    // Clear the map of any modifications
    try {
      // Prevents/ handles clearing before the Promises have been loaded
      clearMap();
    } catch (e) {}

    // Empty out the tooltip
    tipText = "";

    // Show the current tab, and add an "active" class to the button that opened the tab
    $("#map-col").show();

    switch ($(this).attr("id")) {
      case "resources-btn":
        $(".resources").show();
        // Sentiment line charts
        drawResorceMap();
        break;
      case "sentiment-btn":
        $(".sentiment").show();
        drawSentimentMap();
        break;
      case "communications-btn":
        $(".communications").show();
        break;
      default:
        break;
    }

    $(this).addClass("active"); // add the active class to the clicked elemnt
  });

  $("#roads-cb").change(function () {
    $("#map > g#roads").toggle();
  });

  $("#landmarks-cb").change(function () {
    $("#map > g#legend").toggle();
  });

  $("#sentiment-opts").change(function () {
    drawSentimentMap();
  });
});

function drawSentimentMap() {
  // it's going to be
  // wait for it ...
  colVal = $("#sentiment-opts").val().toLowerCase();

  //let zones = mapSvg.select("#zones");
  colorScale = sentimentScales[colVal];

  mapZones
    .selectAll("path")
    .data(sentimentData, (d) => {
      return d.ZoneId;
    })
    .style("fill", function (d) {
      return colorScale(d[`${colVal}Pct`]);
    });

  //////// ... Legendary ///////////////
  mapSvg.select("#legendary").remove();
  mapSvg.select("#linear-gradient").remove();
  mapSvg.select("#axis-rose").remove();

  var legendWidth = 250;
  var legenedHeight = 20;
  var xpos = 10;
  var ypos = 400;

  var defs = mapSvg.append("defs");
  // append a linearGradient element to the defs and give it a unique id
  var linearGradient = defs
    .append("linearGradient")
    .attr("id", "linear-gradient");
  // append multiple color stops by using D3's data/enter step
  linearGradient
    .selectAll("stop")
    .data(
      colorScale.ticks().map((t, i, n) => ({
        offset: `${(100 * i) / n.length}%`,
        color: colorScale(t),
      }))
    )
    .enter()
    .append("stop")
    .attr("offset", function (d) {
      return d.offset;
    })
    .attr("stop-color", function (d) {
      return d.color;
    });
  // draw the rectangle and fill with gradient
  mapSvg
    .append("rect")
    .attr("id", "legendary")
    .attr("x", xpos)
    .attr("y", ypos)
    .attr("width", legendWidth)
    .attr("height", legenedHeight)
    .style("fill", "url(#linear-gradient)")
    .attr("transform", "translate(0, 40)");

  var xLeg = d3
    .scaleLinear()
    .domain(colorScale.domain())
    .range([xpos, xpos + legendWidth]);

  scale = d3.select("#scale");
  //console.log(scale);
  scale.attr("transform", "translate(0, -50)");

  // console.log("x", scale.attr("x"))
  // console.log("y", scale.attr("y"))
  var axisLeg = d3
    .axisBottom(xLeg)
    .ticks(legendWidth / 50)
    .tickSize((legenedHeight * -1) / 2)
    .tickFormat(function (d) {
      return d3.format(".0%")(d);
    });

  mapSvg
    .attr("class", "axis")
    .append("g")
    .attr("id", "axis-rose")
    .attr("transform", "translate(0, 460)")
    .call(axisLeg);

  mapOver = function (d, i) {
    // update tooltip
    //tipText = miniBar()

    // hilight bubble
    $(`#zone-${d.ZoneId}-bubble > circle`).addClass("hilight");
    tooltipDiv.selectAll("svg > *").remove();
    $("#minibar").show();
    drawBars(tooltipDiv, d, 5);
  };

  mapOff = function (d, i) {
    $(`#zone-${d.ZoneId}-bubble > circle`).removeClass("hilight");
  };

  mapClick = function (d, i) {
    d3.select(`#zone-${d.ZoneId}-bubble`).dispatch("click");
  };
}

function clearMap() {
  mapZones.selectAll("path").style("fill", null).style("fill-opacity", null);
  mapSvg.select("#legendary").remove();
  mapSvg.select("#linear-gradient").remove();
  mapSvg.select("#axis-rose").remove();

  // Clear on functions
  mapOver = (d, i) => {};
  mapMove = (d, i) => {};
  mapOff = (d, i) => {};
  mapClick = (d, i) => {};

  tooltipDiv.selectAll("svg > *").remove();
  $("#minibar").hide();
}

function selectCreate(src, id) {
  var obj = src.select(`#${id}`);

  if (obj.empty()) {
    obj = src.append("g").attr("id", id);
  }

  return obj;
}
