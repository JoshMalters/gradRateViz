$(function() {
    /**
     * Created by Josh on 2/23/17.
     */
    $('select').niceSelect();

    var tau = 2 * Math.PI;
    var innerRadius = 45;
    var outerRadius = 75;

    var svg = d3.select("#ratios"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var parseTime = d3.timeParse("%Y");
    var formatValue = d3.format(".2s");
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(['trueF', 'falseF', 'trueM', 'falseM']);

    var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0);

    var allData;
    var scrollFromTop = $("#ratios").offset().top + 100;
    var loaded = true;
    $(document).scroll(function () {
        if ($(this).scrollTop() + $(window).height()  > scrollFromTop && loaded) {
            loaded = !loaded;
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

            function render(data) {
                allData = data;

                var data = data.filter(function (d) {
                    return "" + d.tran_yr == "" + parseTime($("#yearInput").val());
                });

                // Nest our data based on our filters
                var nested = d3.nest()
                    .key(function (d) {
                        return d.in_fig;
                    })
                    .key(function (d) {
                        return d.ethnicity;
                    })
                    .key(function (d) {
                        return d.gender;
                    })
                    .entries(data);

                nested = nested.reverse()

                nested.forEach(function (d, e) {
                    var title = d3.select("#ratios").append("g")
                        .attr("transform", "translate(10, " + (60 + (e * 260)) + ")");

                    title.append("text")
                        .text(d.key.toLowerCase() == 'true' ? "Students who took a FIG" : "Students who did NOT take a FIG")
                        .attr("fill", "#888");

                    title.append('g').append("line")
                        .attr("x1", 0)
                        .attr("x2", $("#ratios").width())
                        .attr("y1", 5)
                        .attr("y2", 5)
                        .style('stroke', '#eee')
                        .style("stroke-opacity", 1);


                    d.values.forEach(function (j, i) {
                        // Get the SVG container, and apply a transform such that the origin is the
                        // center of the canvas. This way, we don’t need to position arcs individually.
                        var translateX = (outerRadius) + ((outerRadius + innerRadius * 2) * i);
                        var translateY = (outerRadius * 2) + ((outerRadius + innerRadius * 2) * e * 1.6)

                        var g = svg.append("g").attr("transform", "translate(" + translateX + "," + translateY + ")");

                        // Add the background arc, from 0 to 100% (tau).
                        var background = g.append("path")
                            .datum({endAngle: tau})
                            .style("fill", "#ddd")
                            .attr("d", arc);

                        // Order the data so the highest graduation rate is drawn first
                        var data = _.orderBy(j.values, function (d) {
                            return d.values[0].graduation_rate;
                        }, ['desc']);

                        // Transition to grad rate angle.
                        data.forEach(function (k, l) {
                            // Add the foreground arc in orange, currently showing 12.7%.
                            var foreground = g.append("path")
                                .attr("id", "" + d.key + j.key + k.key)
                                .datum({endAngle: 0.127 * tau})
                                .style("fill", colorScale('' + d.key + k.key))
                                .attr("d", arc);

                            var values = k.values[0];
                            var gradRate = values.graduation_rate / 100;
                            foreground.transition()
                                .delay(500 * l)
                                .duration(750)
                                .attrTween("d", arcTween(gradRate * tau));

                            var length = values.ethnicity.length;
                            var textLength = length + (length / 2);
                            var percentOfG = ((width - textLength) / (width));
                            var dx = Math.ceil(textLength + Math.ceil((1 / (percentOfG * 100)) * width));

                            g.append("text")
                                .attr("id", "" + d.key + j.key + k.key + "ethnicText")
                                .attr("dx", -dx)
                                .attr("dy", "-1em")
                                .attr("class", "arcLabel")
                                .text(values.ethnicity);

                            g.append("text")
                                .attr("dx", -dx)
                                .attr("class", "arcLabel")
                                .text(d.key.toLowerCase() == 'true' ? "FIG" : "No FIG");

                            g.append("text")
                                .attr("id", "" + d.key + j.key + k.key + l + "gradRateText")
                                .attr("dx", -dx)
                                .attr("dy", 1 + l + "em")
                                .attr("class", "arcLabel")
                                .text(Math.round(values.graduation_rate) + "%");
                        });
                    })
                });
            };
        }
    });

    // Returns a tween for a transition’s "d" attribute, transitioning any selected
    // arcs from their current angle to the specified new angle.
    function arcTween(newAngle) {
        return function (d) {
            var interpolate = d3.interpolate(d.endAngle, newAngle);
            return function (t) {
                d.endAngle = interpolate(t);
                return arc(d);
            };
        };
    };

    $("#yearInput").on("change", function() {
        d3.selectAll("#ratios > *").remove();

        var data = allData.filter(function (d) {
            return "" + d.tran_yr == "" + parseTime($("#yearInput").val());
        });

        // Nest our data based on our filters
        var nested = d3.nest()
            .key(function (d) {
                return d.in_fig;
            })
            .key(function (d) {
                return d.ethnicity;
            })
            .key(function (d) {
                return d.gender;
            })
            .entries(data);

        nested = nested.reverse()

        nested.forEach(function (d, e) {
            var title = d3.select("#ratios").append("g")
                .attr("transform", "translate(10, " + (60 + (e * 260)) + ")");

            title.append("text")
                .text(d.key.toLowerCase() == 'true' ? "Students who took a FIG" : "Students who did NOT take a FIG")
                .attr("fill", "#888");

            title.append('g').append("line")
                .attr("x1", 0)
                .attr("x2", $("#ratios").width())
                .attr("y1", 5)
                .attr("y2", 5)
                .style('stroke', '#eee')
                .style("stroke-opacity", 1);


            d.values.forEach(function (j, i) {
                // Get the SVG container, and apply a transform such that the origin is the
                // center of the canvas. This way, we don’t need to position arcs individually.
                var translateX = (outerRadius) + ((outerRadius + innerRadius * 2) * i);
                var translateY = (outerRadius * 2) + ((outerRadius + innerRadius * 2) * e * 1.6)

                var g = svg.append("g").attr("transform", "translate(" + translateX + "," + translateY + ")");

                // Add the background arc, from 0 to 100% (tau).
                var background = g.append("path")
                    .datum({endAngle: tau})
                    .style("fill", "#ddd")
                    .attr("d", arc);

                // Order the data so the highest graduation rate is drawn first
                var data = _.orderBy(j.values, function (d) {
                    return d.values[0].graduation_rate;
                }, ['desc']);

                // Transition to grad rate angle.
                data.forEach(function (k, l) {
                    // Add the foreground arc in orange, currently showing 12.7%.
                    var foreground = g.append("path")
                        .attr("id", "" + d.key + j.key + k.key)
                        .datum({endAngle: 0.127 * tau})
                        .style("fill", colorScale('' + d.key + k.key))
                        .attr("d", arc);

                    var values = k.values[0];
                    var gradRate = values.graduation_rate / 100;
                    foreground.transition()
                        .delay(500 * l)
                        .duration(750)
                        .attrTween("d", arcTween(gradRate * tau));

                    var length = values.ethnicity.length;
                    var textLength = length + (length / 2);
                    var percentOfG = ((width - textLength) / (width));
                    var dx = Math.ceil(textLength + Math.ceil((1 / (percentOfG * 100)) * width));

                    g.append("text")
                        .attr("id", "" + d.key + j.key + k.key + "ethnicText")
                        .attr("dx", -dx)
                        .attr("dy", "-1em")
                        .attr("class", "arcLabel")
                        .text(values.ethnicity);

                    g.append("text")
                        .attr("dx", -dx)
                        .attr("class", "arcLabel")
                        .text(d.key.toLowerCase() == 'true' ? "FIG" : "No FIG");

                    g.append("text")
                        .attr("id", "" + d.key + j.key + k.key + l + "gradRateText")
                        .attr("dx", -dx)
                        .attr("dy", 1 + l + "em")
                        .attr("class", "arcLabel")
                        .text(Math.round(values.graduation_rate) + "%");
                });
            })
        });
    });
});