let wsData;

function rscAreaChart(csvData, zoneData) {
  let wsRawData = [];

  const main = "#resource-timeline > svg";

  const initialOption = "events";
  const colors = [
    "red",
    "blue",
    "teal",
    "green",
    "orange",
    "purple",
    "brown",
    "pink",
  ];
  const categories = [
    {
      id: "events",
      subTopic: false,
    },
    {
      id: "earthquake",
      subTopic: true,
      color: "red",
      parent: "events",
      content: [
        "seismic",
        "earthquake",
        "quake",
        "quaking",
        "shake",
        "shaking",
        "wobble",
        "wobbling",
        "quiver",
        "epicenter",
      ],
    },
    {
      id: "rumble",
      subTopic: true,
      color: "blue",
      parent: "events",
      content: ["rumble"],
    },
    {
      id: "resources",
      subTopic: false,
    },
    {
      id: "water",
      subTopic: true,
      color: "teal",
      parent: "resources",
      content: [
        "sewage",
        "water",
        "discharge",
        "drain",
        "irrigation",
        "sewer",
        "reservoir",
      ],
    },
    {
      id: "energy",
      subTopic: true,
      color: "green",
      parent: "resources",
      content: [
        "blackout",
        "electric",
        "candle",
        "energy",
        "flashlight",
        "fuel",
        "gas",
        "generator",
        "nuclear",
        "power",
        "radiant",
        "radiation",
        "radio rays",
        "valve",
      ],
    },
    {
      id: "medical",
      subTopic: true,
      color: "orange",
      parent: "resources",
      content: [
        "ambulance",
        "blood",
        "bruise",
        "dehydrate",
        "emergency",
        "escape",
        "evacuate",
        "evacuating",
        "evacuation",
        "fatal",
        "first aid",
        "fracture",
        "hurt",
        "illness",
        "infection",
        "injure",
        "lump",
        "medic",
        "red cross",
        "rescue",
        "rescuing",
        "respiratory",
        "suffering",
        "swollen",
        "urgent",
        "victim",
        "wound",
      ],
    },
    {
      id: "shelter",
      subTopic: true,
      color: "purple",
      parent: "resources",
      content: [
        "shelter",
        "housing",
        "building",
        "collapse",
        "construction",
        "house",
      ],
    },
    {
      id: "transportation",
      subTopic: true,
      color: "brown",
      parent: "resources",
      content: [
        "bridge",
        "traffic",
        "congestion",
        "avalanche",
        "highway",
        "lane",
        "logistic",
        "jammed",
        "route",
        "street",
        "transportation",
      ],
    },
    {
      id: "food",
      subTopic: true,
      color: "pink",
      parent: "resources",
      content: ["food"],
    },
  ];
  const stopwords = [];
  const startDate = Date.parse("2020-04-06 00:00:00");
  const endDate = Date.parse("2020-04-10 11:59:00");
  const hourToMilliSeconds = 60 * 60 * 1000;
  const streamStepUnit = 1;
  const formatTimeLegend = d3.timeFormat("%Y-%m-%d, %-I:%M:%S %p");
  const formatTimeWS = d3.timeFormat("%-m/%-d %-I%p");
  const topics = ["message", "location"];
  const margin = { top: 30, right: 20, bottom: 50, left: 50 },
    width = $(main).width() - margin.left - margin.right,
    height = $(main).width() * (1 / 2) - margin.top - margin.bottom;
  const initTimestamp = 1586217315000;
  const bisect = d3.bisector((d) => {
    return d.time;
  }).left;
  const columns = ["time", "location", "account", "message"];
  let data;
  let streamStep = streamStepUnit * hourToMilliSeconds;
  let streamRawData;
  let highestStack;
  let keyList;
  let xScale = d3.scaleTime().range([0, width]);
  let yScale = d3.scaleLinear().range([height, 0]);

  let current;
  let numHourAfter = 5;
  let slidingGroup;
  let slidingWindow;
  let slidingWidth = function (numHourAfter) {
    return d3
      .scaleLinear()
      .domain([0, 31])
      .range([0, (31 / 108) * width])(numHourAfter);
  };
  const stepDash = slidingWidth(31) / 31;
  let vertical;
  let dataOption = [];
  let area = d3
    .area()
    .curve(d3.curveMonotoneX)
    .x((d) => d.data.x)
    .y0((d) => d[0])
    .y1((d) => d[1]);
  let rangedData;

  loadData();

  function countMultiple(d, dataOption, streamData00, wsRawData) {
    let obj = {};
    for (let i = 0; i < dataOption.length; i++) {
      for (let j = 0; j < dataOption[i].content.length; j++) {
        if (d.message.toLowerCase().indexOf(dataOption[i].content[j]) >= 0) {
          streamData00[dataOption[i].id].push(d.time);
          if (!obj[d.time]) {
            wsRawData.push(d);
            obj[d.time] = true;
          }
          break;
        }
      }
    }
  }

  function styleAxis(axisNodes) {
    axisNodes.selectAll(".tick text");
  }

  function updateStream() {
    const stack = d3.stack().keys(keyList).offset(d3.stackOffsetNone);

    const stacks = stack(streamRawData);
    highestStack = stacks[stacks.length - 1].map((d) => {
      return {
        y: d[1],
        time: d.data.time,
      };
    });
    xScale.domain([startDate, endDate]);
    yScale.domain(d3.extent(stacks.flat().flat()));

    if (dataOption.length === 1 && dataOption[0].subTopic) {
      switch (dataOption[0].parent) {
        case "events":
          yScale.domain([0, 125]);
          break;
        case "resources":
          yScale.domain([0, 524]);
          break;
        default:
          yScale.domain([0, 782]);
      }
    }
    const yAxisGroup = d3.select("#yAxis");
    const yAxis = d3.axisLeft(yScale);
    let yAxisNodes = yAxisGroup.transition().duration(1000).call(yAxis);
    styleAxis(yAxisNodes);

    const areaGen = d3
      .area()
      .x((d) => xScale(d.data.time))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    let newchartstack = d3
      .select("#streamG")
      .selectAll("path")
      .data(stacks, (d) => d.key);

    let enterArr = newchartstack._enter[0];
    let enterItem = enterArr.filter((d) => d !== undefined).length;
    let exitArr = newchartstack._exit[0];
    let exitItem = exitArr.filter((d) => d !== undefined).length;
    let updateArr = newchartstack._groups[0];
    let updateItem = updateArr.filter((d) => d !== undefined).length;

    newchartstack
      .exit()
      .attr("opacity", 1)
      .transition()
      .duration(1000)
      .attr("opacity", 0)
      .remove();

    newchartstack
      .transition()
      .delay(exitItem && updateItem ? 1000 : 0)
      .duration(1000)
      .attr("d", areaGen)
      .attr("fill", (d, i) => {
        return categories.find((d) => d.id === keyList[i]).color;
      });

    newchartstack
      .enter()
      .append("path")
      .attr("class", "layer")
      .attr("opacity", 0)
      .transition()
      .delay(enterItem && updateItem ? 1000 : 0)
      .duration(1000)
      .attr("d", areaGen)
      .attr("fill", (d, i) => {
        return categories.find((d) => d.id === keyList[i]).color;
      })
      .attr("opacity", 1);
  }

  function processStreamData(streamData00) {
    let streamData = [];
    let streamData11 = {};
    keyList = d3.keys(streamData00);
    keyList.forEach((d) => {
      streamData11[d] = [];
      for (let i = startDate; i < endDate; i += streamStep) {
        streamData11[d].push({
          timestamp: i,
          count: streamData00[d].slice(
            d3.bisect(streamData00[d], i),
            d3.bisect(streamData00[d], i + streamStep)
          ).length,
        });
      }
    });
    for (let i = 0; i < streamData11[keyList[0]].length; i++) {
      let obj = {};
      obj.time = streamData11[keyList[0]][i].timestamp;
      keyList.forEach((key) => {
        obj[key] = streamData11[key][i].count;
      });
      streamData.push(obj);
    }
    return streamData;
  }

  function getStreamData(data, dataOption) {
    wsRawData = [];
    let streamData00 = {};
    for (let i = 0; i < dataOption.length; i++) {
      streamData00[dataOption[i].id] = [];
    }
    data.forEach((d) => {
      countMultiple(d, dataOption, streamData00, wsRawData);
    });
    return processStreamData(streamData00);
  }

  function updateWindow(current) {
    let thisNearestHour = nearestHour(current);
    rangedData = getRangedData(
      wsRawData,
      thisNearestHour,
      thisNearestHour + numHourAfter * hourToMilliSeconds
    );
    wsData = getWSdata(rangedData);

    let streamRangedData = getRangedDataScratch(
      highestStack,
      thisNearestHour,
      thisNearestHour + numHourAfter * hourToMilliSeconds
    );
    let peak = d3.max(streamRangedData, (d) => d.y);
    peak = peak !== undefined ? peak : 0;
    slidingGroup
      .attr(
        "transform",
        "translate(" + +vertical.attr("x1") + "," + yScale(peak) + ")"
      )
      .select("text")
      .attr("x", +slidingWindow.attr("width") / 2)
      .attr("text-anchor", "middle")
      .text(numHourAfter + (numHourAfter > 1 ? " hours" : " hour"));

    slidingWindow
      .attr("height", height - yScale(peak))
      .attr("width", slidingWidth(numHourAfter));

    drawResorceMap();
  }

  function nearestHour(milliseconds) {
    return Date.parse(d3.timeHour.floor(new Date(milliseconds)));
  }

  function getRangedData(data, start, end) {
    return data.filter((d) => {
      return start < d.time && d.time < end;
    });
  }

  function getRangedDataScratch(data, start, end) {
    return data.filter((d) => {
      return start < d.time && d.time < end;
    });
  }

  function splitText(text) {
    return text
      .toLowerCase()
      .replace(/\.|\,|\(|\)|\;|\:|\[|\]|\&|\!|\’|\?|\#|\"|\d/gi, "")
      .split(" ")
      .filter((e) => {
        return stopwords.indexOf(e) < 0;
      });
  }

  function removeChar(text) {
    return "_" + text.toLowerCase().replace(/\W/gi, "");
  }

  function getWSdata(rangedData) {
    let wsData = {};
    let timeObj = {};
    rangedData.forEach((d) => {
      let thisHour = nearestHour(d.time);
      timeObj[thisHour] = true;
      let date = formatTimeWS(new Date(d.time));

      let wordArray = splitText(d.message);

      if (!wsData[date]) wsData[date] = {};

      wsData[date]["message"] = wsData[date]["message"]
        ? wsData[date]["message"].concat(wordArray)
        : wordArray;
      wsData[date]["location"] = wsData[date]["location"]
        ? wsData[date]["location"].concat(d.location)
        : [d.location];
    });

    wsData = d3.keys(wsData).map(function (date, i) {
      var words = {};
      topics.forEach((topic) => {
        var counts = wsData[date][topic].reduce(function (obj, word) {
          if (!obj[word]) {
            obj[word] = 0;
          }
          obj[word]++;
          return obj;
        }, {});
        words[topic] = d3
          .keys(counts)
          .map(function (d) {
            return {
              text: d,
              frequency: counts[d],
              topic: topic,
              id: removeChar(d) + d3.keys(timeObj)[i],
            };
          })
          .sort(function (a, b) {
            return b.frequency - a.frequency;
          });
      });
      return {
        time: d3.keys(timeObj)[i],
        date: date,
        words: words,
      };
    });
    return wsData;
  }

  function loadData() {
    Promise.all([d3.csv("data/YInt.csv")]).then(function (values) {
      inputData = values[0];
      data = inputData.map((d) => {
        return {
          time: Date.parse(d.time),
          location: d.location,
          account: d.account,
          message: d.message,
        };
      });
      dataOption = categories.filter((d) => d.parent === initialOption);
      streamRawData = getStreamData(data, dataOption);
      current = initTimestamp;

      drawGraph();
      drawPanel();

      let thisNearestHour = nearestHour(current);
      rangedData = getRangedData(
        wsRawData,
        thisNearestHour,
        thisNearestHour + numHourAfter * hourToMilliSeconds
      );
      wsData = getWSdata(rangedData);

      let streamRangedData = getRangedDataScratch(
        highestStack,
        thisNearestHour,
        thisNearestHour + numHourAfter * hourToMilliSeconds
      );
      let peak = d3.max(streamRangedData, (d) => d.y);
      peak = peak !== undefined ? peak : 0;
      slidingGroup
        .attr(
          "transform",
          "translate(" + +vertical.attr("x1") + "," + yScale(peak) + ")"
        )
        .select("text")
        .attr("x", +slidingWindow.attr("width") / 2)
        .attr("text-anchor", "middle")
        .text(numHourAfter + (numHourAfter > 1 ? " hours" : " hour"));

      slidingWindow
        .attr("height", height - yScale(peak))
        .attr("width", slidingWidth(numHourAfter));

      drawResorceMap();
    });

    function drawGraph() {
      d3.select("body").append("div");

      let svg = d3
        .select(main)
        /*.append("div")
        .style("width", width + margin.left + margin.right + "px")
        .attr("id", "mainGraphContainer")
        .append("svg")
        .attr("width", width + margin.left + margin.right)*/
        .attr("height", height + margin.top + margin.bottom);

      let g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      const stack = d3.stack().keys(keyList).offset(d3.stackOffsetNone);

      const stacks = stack(streamRawData);
      highestStack = stacks[stacks.length - 1].map((d) => {
        return {
          y: d[1],
          time: d.data.time,
        };
      });
      xScale.domain([startDate, endDate]);
      yScale.domain(d3.extent(stacks.flat().flat()));

      const xAxisGroup = g
        .append("g")
        .attr("transform", "translate(0," + height + ")");
      const xAxis = d3.axisBottom(xScale);
      let xAxisNodes = xAxisGroup.call(xAxis);
      styleAxis(xAxisNodes);

      const yAxisGroup = g.append("g").attr("id", "yAxis");
      const yAxis = d3.axisLeft(yScale);
      let yAxisNodes = yAxisGroup.call(yAxis);
      styleAxis(yAxisNodes);

      const areaGen = d3
        .area()
        .x((d) => xScale(d.data.time))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(d3.curveMonotoneX);

      g.append("g")
        .attr("id", "streamG")
        .selectAll(".layer")
        .data(stacks)
        .enter()
        .append("path")
        .attr("class", "layer")
        .attr("d", areaGen)
        .attr("fill", (d, i) => {
          return categories.find((d) => d.id === keyList[i]).color;
        });

      let tooltip = d3
        .select(main)
        .append("div")
        .attr("class", "timeSlider")
        .style("top", height + margin.top / 2 + margin.bottom + "px")
        .style("pointer-events", "none")
        .html("<text>" + formatTimeLegend(initTimestamp) + "</text>")
        .style("left", margin.left + xScale(initTimestamp) + "px");

      vertical = g
        .append("line")
        .attr("id", "vertical")
        .style("stroke", "black")
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("x1", xScale(initTimestamp))
        .attr("x2", xScale(initTimestamp))
        .raise();

      let windowSize = {
        height: 287,
        width: slidingWidth(numHourAfter),
      };

      slidingGroup = g.append("g").attr("id", "slidingGroup");
      slidingWindow = slidingGroup
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", slidingWidth(6))
        .attr("height", windowSize.height)
        .attr("fill", "#aaaaaa")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "black");

      let slidingText = slidingGroup
        .append("text")
        .attr("x", +slidingWindow.attr("width") / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(numHourAfter + " hours");

      slidingGroup
        .attr(
          "transform",
          "translate(" +
            xScale(initTimestamp) +
            "," +
            (height - windowSize.height) +
            ")"
        )
        .raise();

      g.append("rect")
        .attr("class", "overlay")
        .attr("id", "overlayStreamG")
        .attr("width", width)
        .attr("height", height)
        .on("mousemove", function () {
          let mouseX = d3.mouse(this)[0];
          current = Date.parse(xScale.invert(mouseX));
          current = Math.min(Math.max(current, startDate), endDate);
          mouseX = Math.min(Math.max(mouseX, 0), width);
          updateMouseDependant(mouseX);
        });

      function updateMouseDependant(mouseX) {
        vertical.attr("x1", mouseX).attr("x2", mouseX);

        slidingGroup.attr(
          "transform",
          "translate(" +
            mouseX +
            "," +
            (height - +slidingWindow.attr("height")) +
            ")"
        );

        tooltip
          .html("<text>" + formatTimeLegend(xScale.invert(mouseX)) + "</text>")
          .style("left", mouseX + margin.left + "px");

        updateWindow(current);
      }
    }
  }

  function createCBoxUl(arr, ulArgs, inputClass) {
    let ul = $("<ul/>", ulArgs);

    arr.forEach((a) => {
      let li = $("<li/>", { id: `${a.id}-li` });
      let label = $("<label/>", { class: "checkbox" }).appendTo(li);
      $("<input/>", {
        type: "checkbox",
        id: `rsc-cb-${a.id}`,
        class: inputClass,
      }).appendTo(label);
      $("<span/>").text(capitalize(a.id)).appendTo(label);

      //li.append(label);
      ul.append(li);
    });

    return ul;
  }

  function drawPanel() {
    /*let checkList = createCBoxUl(
      categories.filter((c) => c.subTopic === false),
      { id: "rsc-controls", class: "no-mark rsc-parent-crtl" },
      "parent-rsc-cb"
    );
    checkList.children("li").each((i, v) => {
      let li = $(v);

      li.append(
        createCBoxUl(
          categories.filter(
            (cat) => cat.parent === li.attr("id").slice(0, -3) //trim '-li'
          ),
          { class: "no-mark rsc-child-crtl" },
          "child-rsc-cb"
        )
      );
    });
    $("#select-controls > ul").replaceWith(checkList);

    $(".rsc-parent-crtl")
      .find("input")
      .change((e) => {
        let thisCb = $(e.target);
        thisCb
          .parent()
          .siblings("ul")
          .find("input[type='checkbox'")
          .prop("checked", thisCb.prop("checked"));
      });

    $("child-rsc-cb").change((e) => {
      dataOption = categories.filter((record) => record.id === d.id);
      streamRawData = getStreamData(data, dataOption);
      updateStream();
      updateWindow(current);
    });*/
    let svgPanel = d3.select("#select-controls > svg").attr("height", 250);

    let legend = svgPanel.append("g");
    legend.attr(
      "transform",
      "translate(" + 10 + "," + (margin.top / 2 - 3) + ")"
    );

    legend
      .selectAll("rect")
      .data(categories)
      .enter()
      .append("rect")
      .attr("id", (d) => "button" + d.id)
      .attr("class", "legendButton")
      .classed("selected", (d) => {
        return dataOption.find((rec) => rec.id === d.id);
      })
      .classed("unselected", (d) => {
        return !dataOption.find((rec) => rec.id === d.id);
      })
      .attr("x", (d) => (d.subTopic ? 20 : 0))
      .attr("y", (d, i) => 20 * i)
      .attr("width", 15)
      .attr("height", 15)
      .attr("stroke", "black")
      .style("fill", (d) => d.color)
      .on("click", function (d) {
        d3.selectAll(".legendButton")
          .classed("unselected", true)
          .classed("selected", false);

        d3.select(this).classed("unselected", false).classed("selected", true);

        dataOption = categories.filter((record) => record.id === d.id);
        streamRawData = getStreamData(data, dataOption);
        updateStream();
        updateWindow(current);
      });

    categories
      .filter((d) => !d.subTopic)
      .forEach((main) => {
        let thisData = categories.filter((d) => d.parent === main.id);
        thisData = thisData.length
          ? thisData
          : colors.map((d) => {
              return { color: d };
            });
        let categoryGroup = legend
          .append("g")
          .attr("class", "legendButton")
          .attr("id", "group" + main.id)
          .classed("selected", () => {
            return main.id === initialOption;
          })
          .classed("unselected", (d) => {
            return !(main.id === initialOption);
          })
          .attr("transform", () => {
            return (
              "translate(0," +
              20 * +categories.findIndex((d) => d.id === main.id) +
              ")"
            );
          });

        categoryGroup
          .append("rect")
          .attr("id", "rect" + main.id)
          .attr("class", "newButton")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 15)
          .attr("height", 15)
          .on("click", function () {
            d3.selectAll(".legendButton")
              .classed("unselected", true)
              .classed("selected", false);

            d3.select("#group" + main.id)
              .classed("unselected", false)
              .classed("selected", true);

            thisData.forEach((rec) => {
              d3.select("#button" + rec.id).attr(
                "class",
                "legendButton selected"
              );
            });
            dataOption = categories.filter((d) => d.parent === main.id);
            streamRawData = getStreamData(data, dataOption);
            updateStream();
            updateWindow(current);
          });
      });

    legend
      .selectAll("text")
      .data(categories)
      .enter()
      .append("text")
      .attr("id", (d) => "legendText")
      .html((d) => {
        return capitalize(d.id);
      })
      .style("fill", (d) => d.color)
      .attr("x", (d) => (d.subTopic ? 40 : 20))
      .attr("y", (d, i) => 12.5 + 20 * i);
  }

  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

let opacityMap = d3.scaleLinear().domain([0, 200]).range([0, 1]);

function drawResorceMap() {
  if (wsData === undefined) {
    return;
  }

  colorMapData = [...zoneData];

  wsData.forEach((d) => {
    d.words.location.forEach((location) => {
      str1 = location.text; //.replace(/ /g, "");
      //str1 = str1.toLowerCase();
      let dat = colorMapData.find((z) => z.Name === str1);

      if (dat === undefined) {
        return;
      }

      if (!dat.hasOwnProperty("freq")) {
        dat.freq = 0;
      }
      dat.freq = location.frequency;
    });
  });

  let maxCount = d3.max(colorMapData, (d) => d.freq);

  opacityMap.domain([0, maxCount]);
  d3.selectAll("#zones > path")
    .data(colorMapData, (d) => {
      return d.ZoneId;
    })
    .style("fill", "pink")
    .style("fill-opacity", function (d) {
      return opacityMap(d.freq);
    });

  mapOver = function (d, i) {
    tipText = `Frequency: ${d.freq}`;
  };

  mapOff = function (d, i) {
    tooltipDiv.select("t").text("");
    tooltipDiv.select("h4").text("");
  };
}
