/**
 * Created by Josh on 2/23/17.
 */
var tau = 2 * Math.PI;
var innerRadius = 45;
var outerRadius = 75;

d3.csv("js/gradrates/gradrates_allEthnic.csv", type, render);

// Function to appropriately type cast the data
function type(d) {
    d.graduation_rate = +d.graduation_rate;
    d.in_fig = d.in_fig.toLowerCase() == 'true';
    return d;
}

function render(data) {
    // Nest our data based on our filters
    var nested = d3.nest()
        .key(function (d) {
            return d.in_fig;
        })
        .key(function (d) {
            return d.ethnicity;
        })
        .entries(data);

    var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0);

    nested.forEach(function(d, e) {
        d.values.forEach(function(j, i) {
            // Get the SVG container, and apply a transform such that the origin is the
            // center of the canvas. This way, we don’t need to position arcs individually.
            var translateX = (outerRadius * 2) + ((outerRadius + innerRadius * 2) * i);
            var translateY = (outerRadius * 2) + ((outerRadius + innerRadius * 2) * e * 1.3)

            var svg = d3.select("#ratios"),
                width = +svg.attr("width"),
                height = +svg.attr("height"),
                g = svg.append("g").attr("transform", "translate(" + translateX + "," + translateY + ")");

            // Add the background arc, from 0 to 100% (tau).
            var background = g.append("path")
                .datum({endAngle: tau})
                .style("fill", "#ddd")
                .attr("d", arc);

            // Add the foreground arc in orange, currently showing 12.7%.
            var foreground = g.append("path")
                .datum({endAngle: 0.127 * tau})
                .style("fill", "orange")
                .attr("d", arc);

            // Transition to grad rate angle.
            var values = j.values[0];
            var gradRate = values.graduation_rate / 100;
            foreground.transition()
                .duration(750)
                .attrTween("d", arcTween(gradRate * tau));

            var length = values.ethnicity.length;
            var textLength = length + (length / 2);
            var percentOfG = ((width - textLength)/(width));
            var dx = Math.ceil(textLength + Math.ceil((1/(percentOfG * 100)) * width));

            g.append("text")
                .attr("dx", -dx)
                .attr("dy", "-1em")
                .attr("class", "arcLabel")
                .text(values.ethnicity);

            g.append("text")
                .attr("dx", -dx)
                .attr("class", "arcLabel")
                .text(values.in_fig ? "FIG":"No FIG");

            g.append("text")
                .attr("dx", -dx)
                .attr("dy", "1em")
                .attr("class", "arcLabel")
                .text(Math.round(values.graduation_rate) + "%");
        })
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
};