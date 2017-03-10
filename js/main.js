$(function() {
    // *************************** Viz Set Up ***************************
    var margin = {top: 20, right: 50, bottom: 50, left: 60},
        width = $("#viz").width(),
        height = 500,
        innerHeight = height - margin.top - margin.bottom,
        innerWidth =  width - margin.left - margin.right;

    var parseTime = d3.timeParse("%Y");
    var formatValue = d3.format(".4s");

    // Add SVG and the group where the viz is going to be contained
    var svg = d3.select("#viz").append("svg")
        .attr("width", width)
        .attr("height", height);
    var g = svg.append("g")
        .attr("class", "vizGroups")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Setup the scaling functions
    var xScale = d3.scaleTime().range([0, innerWidth]);
    var yScale = d3.scaleLinear().range([innerHeight, 0]);
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    var hoverLineXScale = d3.scaleLinear()
        .range([0, $("#distributionViz").width() - 75])
        .domain([0, innerWidth]);

    // These are the groups for the axis SVGs
    var xAxisG = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")");
    var yAxisG = g.append("g")
        .attr("class", "y axis");

    // Setup axes, don't append them yet. Need to set domain below first.
    var xAxis = d3.axisBottom()
        .scale(xScale);
    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + (width/2) + " ," +
            (innerHeight + margin.bottom + 20) + ")")
        .style("text-anchor", "middle")
        .text("Date");

    var yAxis = d3.axisLeft()
        .scale(yScale);
    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", (margin.left / 5))
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Graduation Rate (%)");


    // Function for line object
    var line = d3.line()
        .x(function(d) { return xScale(d.tran_yr); })
        .y(function(d) { return yScale(d.graduation_rate); });

    // *************************** Viz Rendering ***************************
    d3.csv("js/gradrates/gradrates.csv", type, render);

    // Function to appropriately type cast the data
    function type(d) {
        d.tran_yr = parseTime(d.tran_yr);
        d.graduation_rate = +d.graduation_rate;
        d.in_fig = d.in_fig.toLowerCase() == 'true';
        return d;
    }

    var curData;
    function render(data) {
        // Change the domain of our scales based on the values we get
        xScale.domain(d3.extent(data, function (d){ return d.tran_yr; }));
        yScale.domain([30, 100]);

        // draw them axes
        xAxisG.call(xAxis);
        yAxisG.call(yAxis);

        // Nest our data based on our filters
        var nested = d3.nest()
            .key(function (d) { return d.in_fig; })
            .entries(data);

        // Add a color scale after nesting
        curData = nested;
        colorScale.domain(nested.map(function (d) { return d.key; }));


        nested.forEach(function(d,i) {
            g.append("path")
                .attr("class", "line")
                .style("stroke", function() { // Add the colors dynamically
                    return d.colorScale = colorScale(d.key); })
                .attr("id", d.key) // assign ID
                .attr("d",  line(d.values));

            var yPosition = (innerHeight - 30) - (i * 20);
           // Add the Legend
            g.append("text")
                .attr("transform", "translate("+(xScale(parseTime('2006')))+","+yPosition+")")
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .attr("id", "legend" + d.key)
                .style("fill", function() { // dynamic colours
                    return d.colorScale = colorScale(d.key); })
                .transition()
                .delay(2000)
                .text(figLabel(d.key));
        });

        var path = g.selectAll(".line");
        path.attr("stroke-dasharray", function(d) { return this.getTotalLength() + " " + this.getTotalLength(); })
            .attr("stroke-dashoffset", function(d) { return this.getTotalLength(); })
            .transition()
            .duration(2000)
            .ease(d3.easePolyInOut)
            .attr("stroke-dashoffset", 0);
    }

    function figLabel(val) {
        val = val.toLocaleLowerCase() == 'true';
        return val ? "Took FIG" : "Did Not Take FIG";
    }

    // *************************** All Hover Over Code ***************************
    var bisectDate = d3.bisector(function(d) { return d.tran_yr; }).left;

    //** Hover line & invisible rect
    var hoverLineGroup = g.append('g')
        .attr('class', 'hover-line');

    //** Add the line to the group
    var hoverLine = hoverLineGroup.append('line')
        .attr('id', 'hover-line')
        .attr('x1', 0).attr('x2', 0)
        .attr('y1', 0).attr('y2', innerHeight)
        .style('stroke-opacity', 0);

    // Hover line for distribution chart
    var distHoverLineGroup = d3.select('#distGroup').append('g')
        .attr('class', 'hover-line');


    //** Add the line to the group
    var distHoverLine = distHoverLineGroup.append('line')
        .attr('id', 'dist-hover-line')
        .attr('x1', 0).attr('x2', 0)
        .attr('y1', 0).attr('y2', $('#distributionViz').height() - 65)
        .style('stroke-opacity', 0);

    // Create a invisible rect for mouse tracking
    g.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseout', mouseOut)
        .on('mousemove', mouseMove);

    var toolTip = d3.select('body').append('div')
        .attr('class', 'chart-tooltip');

    // Mouse out handler, makes tooltip and line invisible
    function mouseOut() {
        // Hide Hover line
        distHoverLine.style('stroke-opacity', 0);
        hoverLine.style('stroke-opacity', 0);
        toolTip.style('visibility', 'hidden');
    }

    // Mouse move handler
    function mouseMove() {
        var mouse   = d3.mouse(this),
            mouseX  = mouse[0],
            distMouseX = hoverLineXScale(mouse[0]),
            mouseY  = mouse[1],
            timeStamp   = xScale.invert(mouseX);

        var figVal = getGraduationRateForYear(curData[1], timeStamp);
        var nonFigVal = getGraduationRateForYear(curData[0], timeStamp);

        // Display Hover line
        hoverLine
            .attr('x1', mouseX)
            .attr('x2', mouseX)
            .style('stroke-opacity', 1);

        distHoverLine
            .attr('x1', distMouseX)
            .attr('x2', distMouseX)
            .style('stroke-opacity', 1);

        //** Display tool tip
        toolTip
            .style('visibility', 'visible')
            .style("left", (mouseX + 60 + "px"))
            .style("top", mouseY  + 100 + "px")
            .html(String(timeStamp).split(" ")[3] + "<br/>"
                + "FIG: " + formatValue(figVal) + "%<br/>"
                + "Non-FIG: " + formatValue(nonFigVal) + "%");
    }

    function getGraduationRateForYear(data, timeStamp) {
        var arr = data.values;
        arr.sort(function (a, b) {
            return a.tran_yr - b.tran_yr;
        });
        var idx = bisectDate(arr, new Date(timeStamp));
        return arr[idx - 1].graduation_rate;
    }

    // *************************** Applying Tags ***************************
    $(".nice-select").on("change", function() {
        // Grab Values from form
        var gender = $('#genderInput').val();
        var ethnicity = $('#ethnicityInput').val();

        // Reset chart
        gender = gender == 'all' ? '' : '_' + gender;
        ethnicity = ethnicity == 'all' ? '' : '_' + ethnicity;

        var file = 'js/gradrates/gradrates' + gender + ethnicity + ".csv";
        updateData(file);
    });

    function updateData(file) {
        d3.csv(file, type, function (error, data) {
            // Nest our data based on our filters
            var nested = d3.nest()
                .key(function (d) { return d.in_fig; })
                .entries(data);
            curData = nested;

            // Change the two paths.
            nested.forEach(function(d,i) {
                g.select("#" + d.key)
                    .transition()
                    .ease(d3.easePolyInOut)
                    .duration(750)
                    .attr("d", line(d.values))
                    .attr("stroke-dasharray", 0);
            });
        });
    }
});