$(function() {
    // *************************** Viz Set Up ***************************
    var margin = {top: 20, right: 50, bottom: 30, left: 30},
        width = $("#viz").width(),
        height = 500,
        innerHeight = height - margin.top - margin.bottom,
        innerWidth =  width - margin.left - margin.right;

    var parseTime = d3.timeParse("%Y");

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

    // These are the groups for the axis SVGs
    var xAxisG = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")")
    var yAxisG = g.append("g")
        .attr("class", "y axis");

    // Setup axes, don't append them yet. Need to set domain below first.
    var xAxis = d3.axisBottom()
        .scale(xScale);
    var yAxis = d3.axisLeft()
        .scale(yScale);

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

    function render(data) {
        // Change the domain of our scales based on the values we get
        xScale.domain(d3.extent(data, function (d){ return d.tran_yr; }));
        yScale.domain(d3.extent (data, function (d){ return d.graduation_rate; }));

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

        // Define two path groups, figs and non figs
        // Loop through each symbol / key
        var legendSpace = innerWidth/nested.length;

        nested.forEach(function(d,i) {                           // ******
            g.append("path")
                .attr("class", "line")
                .style("stroke", function() { // Add the colours dynamically
                    return d.colorScale = colorScale(d.key); })
                .attr("id", d.key) // assign ID
                .attr("d",  line(d.values));

            // Add the Legend
            g.append("text")                                    // *******
                .attr("x", (legendSpace/2)+i*legendSpace) // spacing // ****
                .attr("y", innerHeight + (margin.bottom/2) - 25)         // *******
                .attr("class", "legend")    // style the legend   // *******
                .style("fill", function() { // dynamic colours    // *******
                    return d.colorScale = colorScale(d.key); })             // *******
                .text(d.key);                                     // *******

        });

        var path = g.selectAll(".line");
        path.attr("stroke-dasharray", function(d) { return this.getTotalLength() + " " + this.getTotalLength(); })
            .attr("stroke-dashoffset", function(d) { return this.getTotalLength(); })
            .transition()
            .duration(2000)
            .ease(d3.easePolyInOut)
            .attr("stroke-dashoffset", 0);
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
        hoverLine.style('stroke-opacity', 0);
        toolTip.style('visibility', 'hidden');
    }

    // Mouse move handler
    function mouseMove() {
        var mouse   = d3.mouse(this),
            mouseX  = mouse[0],
            mouseY  = mouse[1],
            timeStamp   = xScale.invert(mouseX);

        var figVal = getGraduationRateForYear(curData[1], timeStamp);
        var nonFigVal = getGraduationRateForYear(curData[0], timeStamp);

        // Display Hover line
        hoverLine
            .attr('x1', mouseX)
            .attr('x2', mouseX)
            .style('stroke-opacity', 1);

        //** Display tool tip
        toolTip
            .style('visibility', 'visible')
            .style("left", (mouseX + 60 + "px"))
            .style("top", (mouseY + "px"))
            .html(String(timeStamp).split(" ")[3] + "<br/>"
                + "FIG: " + figVal + "<br/>"
                + "Non-FIG: " + nonFigVal);
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
    $("form").on("submit", function(event) {
        event.preventDefault(); // Prevent default action of refreshing page.

        // Grab Values from form
        var gender = $(this).find('[id=genderInput]').val();
        upperCaseGender = gender.charAt(0).toUpperCase() + gender.slice(1);
        var ethnicity = $(this).find('[id=ethnicityInput]').val();
        upperCaseEthnicity = ethnicity.charAt(0).toUpperCase() + ethnicity.slice(1);

        // Set text in tag box
        $('#genderVal').text(upperCaseGender);
        $('#ethnicityVal').text(upperCaseEthnicity);

        // Reset chart
        gender = gender == 'all' ? '' : '_' + gender;
        ethnicity = ethnicity == 'all' ? '' : '_' + ethnicity;

        var file = 'js/gradrates/gradrates' + gender + ethnicity + ".csv";
        updateData(file);
        $('#myModal').fadeOut(100);
    });

    function updateData(file) {
        d3.csv(file, type, function (error, data) {
            // Nest our data based on our filters
            var nested = d3.nest()
                .key(function (d) { return d.in_fig; })
                .entries(data);
            curData = nested;

            // Change the domain of our scales based on the values we get
            xScale.domain(d3.extent(data, function (d) { return d.tran_yr;}));
            yScale.domain(d3.extent(data, function (d) { return d.graduation_rate; }));

            g.select(".x.axis")// change the x axis
                .transition()
                .duration(750)
                .call(xAxis);

            g.select(".y.axis")// change the y axis
                .transition()
                .duration(750)
                .call(yAxis);

            // Change the two paths.
            nested.forEach(function(d,i) {
                console.log(d.values);
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