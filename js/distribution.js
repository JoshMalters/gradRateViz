/**
 * Created by Josh on 3/6/17.
 */
$(function() {
    var margin = {top: 20, right: 20, bottom: 40, left: 55},
        width = $("#distributionViz").width(),
        height = 310,
        innerHeight = height - margin.top - margin.bottom,
        innerWidth =  width - margin.left - margin.right;

    var parseTime = d3.timeParse("%Y");
    var formatValue = d3.format(".2s");

    // Add SVG and the group where the viz is going to be contained
    var svg = d3.select("#distributionViz").append("svg")
        .attr("width", width)
        .attr("height", height);
    var g = svg.append("g")
        .attr("id", "distGroup")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Setup the scaling functions
    var xScale = d3.scaleTime().range([0, innerWidth]);
    var yScale = d3.scaleLinear().range([innerHeight, 0]);
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);


    // These are the groups for the axis SVGs
    var xAxisG = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")")
    var yAxisG = g.append("g")
        .attr("class", "y axis");

    // Setup axes, don't append them yet. Need to set domain below first.
    var xAxis = d3.axisBottom()
        .scale(xScale);
    // text label for the x axis
    svg.append("text")
        .attr("font-size", ".8em")
        .attr("transform",
            "translate(" + (width/2) + " ," +
            (innerHeight + margin.bottom + 10) + ")")
        .style("text-anchor", "middle")
        .text("Date");

    var yAxis = d3.axisLeft()
        .tickFormat(function(d) { return formatValue(d)})
        .scale(yScale);
    // text label for the y axis
    svg.append("text")
        .attr("font-size", ".8em")
        .attr("transform", "rotate(-90)")
        .attr("y", (margin.left / 5))
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Freshman");


    // Function for line object
    // define the area
    var area = d3.area()
        .x(function(d) { return xScale(d.tranYr); })
        .y0(height)
        .y1(function(d) { return yScale(d.numSum); });

    // Function for line object
    var line = d3.line()
        .x(function(d) { return xScale(d.tranYr); })
        .y(function(d) { return yScale(d.numSum); });

    // *************************** Viz Rendering ***************************
    d3.csv("js/gradrates/gradrates_allEthnicNumbers.csv", type, render);

    // Function to appropriately type cast the data
    function type(d) {
        d.tran_yr = parseTime(d.tran_yr);
        d.graduation_rate = +d.graduation_rate;
        d.num = +d.num;
        d.total = +d.total;
        d.in_fig = d.in_fig.toLowerCase() == 'true';
        return d;
    }

    var allData;
    function render(data) {
        // Change the domain of our scales based on the values we get
        allData = data;
        xScale.domain(d3.extent(data, function (d){ return d.tran_yr; }));
        // draw them axes
        xAxisG.call(xAxis);

        var nested = filteredAndFormatted(data);

        nested.forEach(function(d,i) {
            g.append("path")
                .attr("class", "line")
                .style("stroke", function() { // Add the colors dynamically
                    return d.colorScale = colorScale(d.key); })
                .attr("id", d.key + "dist") // assign ID
                .attr("d",  line(d.values));
        });

        var path = g.selectAll(".line");
        path.attr("stroke-dasharray", function(d) { return this.getTotalLength() + " " + this.getTotalLength(); })
            .attr("stroke-dashoffset", function(d) { return this.getTotalLength(); })
            .transition()
            .duration(2000)
            .ease(d3.easePolyInOut)
            .attr("stroke-dashoffset", 0);
    }

    function filteredAndFormatted(data) {
        // Grab chart
        var gender = $('#genderInput').val().toUpperCase()[0];
        var ethnicity = $('#ethnicityInput').val();

        // Filter Data
        var data = data.filter(function(d) {
            if (ethnicity == 'all' && gender == 'A') { return true; }
            if (d.ethnicity != ethnicity && ethnicity != 'all') {
                return false;
            }
            if (d.gender != gender &&  gender != 'A') {
                return false;
            }
            return true;
        });

        // Nest our data based on our filters
        var nested = d3.nest()
            .key(function (d) { return d.in_fig; })
            .key(function (d) { return d.tran_yr; })
            .entries(data);

        // Add a color scale after nesting
        colorScale.domain(nested.map(function (d) { return d.key; }));
        var sums = [];
        nested.forEach(function(d) {
            var years = d.values;
            years.forEach(function(year) {
                var elasticities = year.values;
                var numSum = 0;
                elasticities.forEach(function (e) {
                    numSum += e.num;
                });
                year.numSum = numSum;
                sums.push(numSum);
                year.tranYr = parseTime(year.key.split(" ")[3]);
            });
        });

        yScale.domain(d3.extent(sums));
        yAxisG.call(yAxis);
        return nested;
    }

    $(".filterInput").on("change", function() {
        var nested = filteredAndFormatted(allData);

        nested.forEach(function(d,i) {
            g.select("#" + d.key + "dist")
                .transition()
                .ease(d3.easePolyInOut)
                .duration(750)
                .attr("d", line(d.values))
                .attr("stroke-dasharray", 0);
        });
    });
});