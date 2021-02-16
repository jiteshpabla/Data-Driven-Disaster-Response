var groupData;
var margin;
var svg;
var height;
var width;

/*.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");*/

//Read the data
/*d3.csv(
  "data/sentiment_groupbyhour.csv",

  // When reading the csv, I must format variables:
  function (d) {
    return {
      index: +d.index,
      time: d.time,
      Neg: +d.Neg,
      Pos: +d.Pos,
      Neu: +d.Neu,
    };
  },

  // Now I can use this dataset:
  function (data) {
    console.log("sentiment line");

    // Add X axis --> it is a time format
    /*var x = d3.scaleBand()
        .domain(d3.extent(data, function(d) { return d.time; }))
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
);*/

//on page load
function sentLine() {
  Promise.all([d3.csv("data/sentiment_groupbyhour.csv", d3.autoType)]).then(
    ([svgGroupData]) => {
      groupData = svgGroupData;
      drawSentLine(svgGroupData, $("#sentiment-opts").val().toLowerCase());
    }
  );

  // set the dimensions and margins of the graph
  margin = { top: 5, right: 20, bottom: 20, left: 65 };
  /*width = 800 - margin.left - margin.right;
  height = 300 - margin.top - margin.bottom;*/

  // append the svg object to the body of the page
  svg = d3.select("#sentiment-timeline > svg")
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
  //.attr("height", height + margin.top + margin.bottom);
  height = $("#sentiment-timeline").height()/1.9;//svg.style("height").replace("px", "");
  width = $("#sentiment-timeline").width()- margin.left - margin.right;//svg.style("width").replace("px", "");
  //console.log(height);
}

function drawSentLine(data, curr_emotion) {

    // line tooltip div
  var tooltip_line_div = d3.select("#sentiment-timeline").append("div")
    .attr("class", "tooltip-line")
    .style("display", "none");
  tooltip_line_div.append("text")
    .attr("id", "tooltip-line-text1");
  tooltip_line_div.append("br");
  tooltip_line_div.append("text")
    .attr("id", "tooltip-line-text2");
  tooltip_line_div.append("br");
  tooltip_line_div.append("text")
    .attr("id", "tooltip-line-text3");
  tooltip_line_div.append("br");
  tooltip_line_div.append("text")
    .attr("id", "tooltip-line-text4");

  custom_ticks = [];
  for (i = 0; i < 108; i++) {
    custom_ticks.push(i);
  }

  // Add X axis
  var x = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return +d.index;
      }),
    ])
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)); //.tickValues( custom_ticks ));

   
  //x.tickValues( custom_ticks );

  // remove text from every alternate tick
  /*var ticks = d3.selectAll(".tick text");
  ticks.each(function(year_val,i){
    if(year_val%2 !== 0) d3.select(this).remove();
  });*/


  // Add Y axis
  var y = d3
    .scaleLinear()
    .domain([
      0,
      Math.max(
        d3.max(data, function (d) {
          return +d.Neu;
        }),
        d3.max(data, function (d) {
          return +d.Pos;
        }),
        d3.max(data, function (d) {
          return +d.Neg;
        })
      ),
    ])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // X axis label
  svg.append("text")             
        .attr("transform",
              "translate(" + (width/2) + " ," + (height + margin.bottom + 15 ) + ")")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        //.style("fill", "gray")
        .style("text-anchor", "middle")
        .text("hours (since 06-04-2020 00:00)");

  // Y axis label
  svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -11 - margin.left + 40)
        .attr("x", -10 - (height / 2))
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        //.style("fill", "gray")
        .style("text-anchor", "middle")
        .text("Frequency (of messages)");

    // legend

  //legend
  var keys_vals = ["Positive", "Negative", "Neutral"];
  var emotions = {"Positive": "green", "Negative": "red", "Neutral": "blue"};
  svg.selectAll("myrects")
      .data(keys_vals)
      .enter()
      .append("rect")
      .attr("x", width - 55)
      .attr("y",  function(d,i){ return i*(15) - (margin.top / 2)} )
      .attr("width", 12)
      .attr("height", 12)
      .style("fill", function(d) { return emotions[d]; } );

  svg.selectAll("myrects")
      .data(keys_vals)
      .enter()
      .append("text")
      .attr("x", width -40)
      .attr("y",  function(d,i){ return 8 + i*(15) - (margin.top / 2)} )
      .text( function(d) { return d } )
      .style("font-size", "11px")
      .style("font-family", "sans-serif")
      .attr("alignment-baseline","middle");




  // Add the line

  function redraw(data, curr_emotion) {
    if (curr_emotion == "all" || curr_emotion == "neutral"){
    svg
      .append("path")
      .datum(data)
      .attr("class", "actual-lines")
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(+d.index);
          }) //d.time) })
          .y(function (d) {
            return y(+d.Neu);
          })
      );

    var focus3 = svg
      .append('g')
      .append('circle')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr('r', 4)
        .style("opacity", 0)

    };
    
    if (curr_emotion == "all" || curr_emotion == "positive"){
    svg
      .append("path")
      .datum(data)
      .attr("class", "actual-lines")
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(+d.index);
          }) //d.time) })
          .y(function (d) {
            return y(+d.Pos);
          })
      );
              // Create the circle that travels along the curve of chart
    var focus1 = svg
      .append('g')
      .append('circle')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr('r', 4)
        .style("opacity", 0)
    };

    if (curr_emotion == "all" || curr_emotion == "negative"){
    svg
      .append("path")
      .datum(data)
      .attr("class", "actual-lines")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(+d.index);
          }) //d.time) })
          .y(function (d) {
            return y(+d.Neg);
          })
      );
      var focus2 = svg
      .append('g')
      .append('circle')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr('r', 4)
        .style("opacity", 0)
    };


    // This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function(d) { return +d.index; }).left;

    // vertical line for interactive focus
    /*var verticalLine = svg
      .append('line')
      .attr('transform', 'translate(50, 0)')
      .attr("stroke", "steelblue")
      .attr('class', 'verticalLine')
      .attr({
          'x1': 0,
          'y1': 0,
          'x2': 0,
          'y2': height
      });*/

    // Create the text that travels along the curve of chart
    var focusText = svg
      .append('g')
      .append('text')
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle")

      // Create a rect on top of the svg area: this rectangle recovers mouse position
    svg//.selectAll("chart-rect")
      .append('rect')
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr('width',width)
      .attr('height', height)
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseout', mouseout);


     // line tooltip div
    var tooltip_line_div = d3.select(".tooltip-line"); //(".hoover-tip");//

    // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover() {
      if (curr_emotion == "all" || curr_emotion == "positive"){ focus1.style("opacity", 1) };
      if (curr_emotion == "all" || curr_emotion == "negative"){ focus2.style("opacity", 1) };
      if (curr_emotion == "all" || curr_emotion == "neutral"){ focus3.style("opacity", 1) };
      focusText.style("opacity",1)
      tooltip_line_div
        .style("display", "inline");
    }

    function mousemove() {
      // recover coordinate we need
      var x0 = x.invert(d3.mouse(this)[0]);
      var i = bisect(data, x0, 1);
      selectedData = data[i]
      //console.log(x0, i, selectedData)
      if (curr_emotion == "all" || curr_emotion == "positive"){  
      focus1
        .attr("cx", x(selectedData.index))
        .attr("cy", y(selectedData.Pos))
       };
      if (curr_emotion == "all" || curr_emotion == "negative"){
      focus2
        .attr("cx", x(selectedData.index))
        .attr("cy", y(selectedData.Neg))
       };
      if (curr_emotion == "all" || curr_emotion == "neutral"){
      focus3
        .attr("cx", x(selectedData.index))
        .attr("cy", y(selectedData.Neu))
       };
      focusText
        //.html("index:" + selectedData.index + " <br>  " + "Neu:" + selectedData.Neu)
        .attr("x", x(selectedData.index)+15)
        .attr("y", y(selectedData.Neu))

      tooltip_line_div
        //.text("Country: " + d.properties.name)// + "<br />" + "Neu: " + indexData[d.properties.name])
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 10) + "px");
      tooltip_line_div.select("#tooltip-line-text1")
        .text("hour:" + selectedData.index);
      tooltip_line_div.select("#tooltip-line-text2")
        .text("Postive:" + selectedData.Neu);
      tooltip_line_div.select("#tooltip-line-text3")
        .text("Negative:" + selectedData.Neu);
      tooltip_line_div.select("#tooltip-line-text4")
        .text("Neutral:" + selectedData.Neu);
      }
    function mouseout() {
      if (curr_emotion == "all" || curr_emotion == "positive"){ focus1.style("opacity", 0) };
      if (curr_emotion == "all" || curr_emotion == "negative"){ focus2.style("opacity", 0) };
      if (curr_emotion == "all" || curr_emotion == "neutral"){ focus3.style("opacity", 0) };
      focusText.style("opacity", 0)
      tooltip_line_div
        .style("display", "none");
    }
  }
  redraw(data, curr_emotion);

  // resize chart
  // need to remove the height and width variable for this to work
  // see https://stackoverflow.com/questions/9400615/whats-the-best-way-to-make-a-d3-js-visualisation-layout-responsive
  /*
  $(window).on("resize", function() {
    var targetWidth = $("#sentiment-timeline").width()- margin.left - margin.right;
    var targetHeight = $("#sentiment-timeline").height();
    svg.attr("width", targetWidth);
    svg.attr("height", targetHeight/1.8);

  }).trigger("resize");*/


  function sentimentOptCheck(){
    if($("#emotions-cb").is(':checked') == false) {
      $("#sentiment-opts").change(function () {
        svg.selectAll(".actual-lines").remove();
        svg.selectAll("circle").remove();
        //svg.selectAll("chart-rect").remove();
        //console.log("sentiment changed");
        curr_emotion = $("#sentiment-opts").val().toLowerCase();
        $("#emotions-cb").prop("checked", false);
        redraw(data, curr_emotion);
      });
    }
    /*else {

    };*/
  };
  sentimentOptCheck();

  $("#emotions-cb").change(function () {
    //svg.selectAll("*").remove();
    //console.log($("#emotions-cb").is(":checked"));
    if($("#emotions-cb").is(':checked')) {
        svg.selectAll(".actual-lines").remove();
        svg.selectAll("circle").remove();
        redraw(data, "all");
    }
    else {
      svg.selectAll(".actual-lines").remove();
        svg.selectAll("circle").remove();
      //console.log("sentiment changed");
      curr_emotion = $("#sentiment-opts").val().toLowerCase();
      //$("#emotions-cb").prop("checked", false);
      redraw(data, curr_emotion);
    };
  });
}
