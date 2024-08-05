//const { selectAll } = require("d3-selection");

const freedmanDiaconisRule = function (currentGraph, attribute) {
    let IQRValue = IQR(nodes, attribute);
    if (IQRValue === 0) {
        IQRValue = IQRValue + 1;
    }

    return Math.ceil(2 * IQRValue * Math.pow(nodes.length, (-1.0 / 3)));
}

const sigmaG1 = function (n){
    return Math.sqrt(((6.0 * (n - 2))) / ((n + 1) * (n + 3)));
}

const dormanFormula = function (attributeValues) {
    const nodeCount = attributeValues.length;
    const attributeSkewness = skewness(attributeValues);
    const attributeSigmaG1 = sigmaG1(nodeCount)
    const k = 1 + Math.log2(nodeCount) + Math.log2(1 + (Math.abs(attributeSkewness) / attributeSigmaG1));
    return k;
}

const hist = function (containerDivId, currentGraph, attribute, svgWidth, svgHeight) {
    const attributeValues = currentGraph.getAllAttributeValues(attribute);
    const nBins = dormanFormula(attributeValues);
    const histogramMargin = { top: 10, right: 10, bottom: 20, left: 25 },
        histogramWidth = svgWidth - (histogramMargin.left + histogramMargin.right),
        histogramHeight = svgHeight - (histogramMargin.top + histogramMargin.bottom);


    const xMin = d3.min(attributeValues);
    const xMax = d3.max(attributeValues);
    const xAxis = createLinearAxis(xMin, xMax, 0, histogramWidth);


    const histogram = d3
        .histogram()
        .domain(xAxis.domain())
        .thresholds(xAxis.ticks(nBins));

    const bins = histogram(attributeValues);

    const yMin = 0;
    const yMax = d3.max(bins, function (d) {
        return d.length;
    });
    const yAxis = createLinearAxis(yMin, yMax, histogramHeight, 0);

    const plotContainer = getPlotContainer(containerDivId);
    const histogramSvg =
        createGraphSvg(plotContainer, svgWidth,
            svgHeight, histogramMargin, attribute);

    
    appendGraphXAxis(histogramSvg, xAxis, 0, histogramHeight);
    appendGraphYAxis(histogramSvg, yAxis, 0, 0);
    appendHistogramBins(histogramSvg, bins, histogramHeight, xAxis, yAxis);
}



const appendHistogramBins = function (svg, bins, height, xAxis, yAxis) {
    svg
        .selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", 1)
        .attr("data-max-value", function (d) {
            return d.x1;
        })
        .attr("transform", function (d) {
            return "translate(" + xAxis(d.x0) + "," + yAxis(d.length) + ")";
        })
        .attr("width", function (d) {
            return xAxis(d.x1) - xAxis(d.x0) - 1;
        })
        .attr("height", function (d) {
            return height - yAxis(d.length);
        })
        .style("fill", "#ffeead");

    return svg;
}



const barplot = function (containerDivId, data, yMin, yMax, svgWidth, svgHeight, cluster) {
    const barplotMargin = { top: 10, right: 10, bottom: 30, left: 25 },
        barplotWidth = svgWidth - (barplotMargin.left + barplotMargin.right),
        barplotHeight = svgHeight - (barplotMargin.top + barplotMargin.bottom);

    const xAxis = createBandAxis(data.map((d) => { return d.className }), 0, barplotWidth);
    const yAxis = createLinearAxis(yMin, yMax, barplotHeight, 0);

    const plotContainer = getPlotContainer(containerDivId);
    const barplotSvg = createGraphSvg(plotContainer, svgWidth, svgHeight, barplotMargin, cluster)

    const axisColour = "white";
    appendGraphXAxis(barplotSvg, xAxis, 0, barplotHeight, axisColour, true);
    appendGraphYAxis(barplotSvg, yAxis, 0, 0, axisColour);
    appendLine(barplotSvg, 0, barplotWidth, yAxis(0), yAxis(0), axisColour);
    const tooltip = createTooltip(plotContainer, cluster);
    const mouseenter = createBarplotTooltipMouseEnter(tooltip);
    const mousemove = createTooltipMousemove(tooltip);
    const mouseleave = createTooltipMouseleave(tooltip);
    createBars(barplotSvg, data, xAxis, yAxis, barplotHeight, "#ffeead", mouseenter, mousemove, mouseleave);

}

const createBars = function (svg, data, xAxis, yAxis, height, fillColor,
    mouseenter = null, mousemove = null, mouseleave = null) {

    gBars = svg
        .selectAll("mybar")
        .data(data)
        .enter()
        .append("g");

    gBars
        .append("rect")
        .attr("x", (d) => { return xAxis(d.className); })
        .attr("y", (d) => { return yAxis(1); })
        .attr("width", xAxis.bandwidth())
        .attr("height", (d) => { return Math.abs(yAxis(1) - yAxis(-1)); })
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .attr("stroke", "black")
        .on("mouseenter", mouseenter)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    gBars
        .append("rect")
        .attr("x", (d) => { return xAxis(d.className); })
        .attr("y", (d) => { return yAxis(Math.max(0, d.value)); })
        .attr("width", xAxis.bandwidth())
        .attr("height", (d) => { return Math.abs(yAxis(d.value) - yAxis(0)); })
        .attr("fill", fillColor)
        .attr("pointer-events", "none");
        

    

    return svg;
}

const boxplot = function (plotContainer, data, svgWidth, svgHeight, id) {
    const boxplotMargin = { top: 10, right: 25, bottom: 50, left: 25 },
        boxplotWidth = svgWidth - (boxplotMargin.left + boxplotMargin.right),
        boxplotHeight = svgHeight - (boxplotMargin.top + boxplotMargin.bottom);

    let yMin = d3.min(data, function (d) { return d.value.min; });
    let yMax = d3.max(data, function (d) { return d.value.max; });

    const attributeRangePortion = (yMax - yMin) * 0.05;

    yMin -= attributeRangePortion;
    yMax += attributeRangePortion;

    const xAxis = createBandAxis(data.map(d => d.key), 0, boxplotWidth, 0.5);
    const yAxis = createLinearAxis(yMin, yMax, boxplotHeight, 0);

    const boxplotSvgId = `partition-metric-boxplot-svg-${id}`;

    const tooltipId = `${boxplotSvgId}-tooltip`;
    const tooltip = createTooltip(plotContainer, tooltipId);
    const mouseenter = createBoxplotTooltipMouseEnter(tooltip);
    const mousemove = createTooltipMousemove(tooltip);
    const mouseleave = createBoxplotTooltipMouseleave(tooltip);

    

    const boxplotSvg = createGraphSvg(plotContainer, svgWidth, svgHeight, boxplotMargin, boxplotSvgId)

    const axisColour = "white";
    appendGraphXAxis(boxplotSvg, xAxis, 0, boxplotHeight, axisColour, false);
    appendGraphYAxis(boxplotSvg, yAxis, 0, 0, axisColour);
    appendGraphYAxis(boxplotSvg, yAxis, boxplotWidth, 0, axisColour);


    const boxContainers = boxplotSvg.selectAll("boxesG")
        .data(data)
        .enter()
        .append("g")
        .on("mouseenter", mouseenter)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);



    

    //boxes
    appendBoxplotRects(boxContainers, xAxis,
        yAxis, data, axisColour);
    //medianLine
    appendMedianBoxplotLine(boxContainers, "median", xAxis, yAxis, axisColour);
    //verticalLine
    appendVerticalBoxplotLines(boxContainers, xAxis, yAxis, axisColour);
    //MinLine
    appendMinBoxplotLine(boxContainers, xAxis, yAxis, axisColour);
    //MaxLine
    appendMaxBoxplotLine(boxContainers, xAxis, yAxis, axisColour);
        

    

}

const appendBoxplotRects = function (svg, xAxis, yAxis, fillColour, strokeColour) {
    svg
        .append("rect")
        .attr("x", function (d) {
            return xAxis(d.key);
        })
        .attr("y", function (d) {
            return yAxis(d.value.q3);
        })
        .attr("width", xAxis.bandwidth())
        .attr("height", function (d) {
            return (yAxis(d.value.q1) - yAxis(d.value.q3));
        })
        .style("fill", function (d) {
            return fillColour;
        })
        .style("stroke", strokeColour);
}

const updateBoxplotColour = function (boxplots, colourObject) {
    boxplots.selectAll("rect")
        .style("fill", function (d) {
            return colourObject[d.key];
        })
}

const createTooltip = function (plotContainer, id) {
    return plotContainer
        .append("div")
        .attr("class", "plot-tooltip")
        .attr("id", `${id}-tooltip`);
}

const createBarplotTooltipMouseEnter = function (tooltip) {
    const mouseenter = function (d) {
        const { className, value } = d;
        d3.select(this).style("stroke-opacity", 1);
        tooltip
            .html("Class: " + className + "<br>" + "Value: " + value.toFixed(2))
            .style("opacity", 1);
    }
    return mouseenter;
}

const createTooltipMousemove = function (tooltip) {
    const mousemove = function (d) {
        tooltip
            .style("left", (d3.mouse(this)[0]+ 20) + "px")
            .style("top", (d3.mouse(this)[1] + 11) + "px");
    }
    return mousemove;
}

const createTooltipMouseleave = function (tooltip) {
    const mouseleave = function (d) {
        d3.select(this).style("stroke-opacity", 0);
        tooltip
            .style("opacity", 0);
    }
    return mouseleave;
}

const createBoxplotTooltipMouseEnter = function (tooltip) {
    const mouseenter = function (d) {
        const { className, value } = d;
        d3.select(this).selectAll("*").style("stroke", "black");
        const text = `Median: ${d.value.median.toFixed(2)} <br>
                      Q1: ${d.value.q1.toFixed(2)} <br>
                      Q3: ${d.value.q3.toFixed(2)} <br>
                      IQR: ${d.value.IQR.toFixed(2)} <br>
                      min: ${d.value.min.toFixed(2)} <br>
                      max: ${d.value.max.toFixed(2)}`;
        tooltip
            .html(text)
            .style("opacity", 1);
    }
    return mouseenter;
}

const createBoxplotTooltipMouseleave = function (tooltip) {
    const mouseleave = function (d) {
        d3.select(this).selectAll("*").style("stroke", "white");
        tooltip
            .style("opacity", 0);
    }
    return mouseleave;
}

const getPlotContainer = function (containerDivId) {
    return d3.select(`#${containerDivId}`);
}

const createGraphSvg = function (plotContainer, width, height, margin, attribute, id) {
    const histogramSvg = plotContainer
        .append("svg")
        .attr("width", "100%"/*width + margin.left + margin.right*/)
        .attr("height", height + margin.top + margin.bottom)
        .attr("data-attribute", attribute)
        .attr("id", id)
        .attr("viewBox", [0, 0, width, height])
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    return histogramSvg;
}



const appendGraphXAxis = function (svg, axis, translateX, translateY, colour = "black", hideLabels = false) {

    const axisBot = d3.axisBottom(axis);
    if (hideLabels) {
        axisBot.tickFormat("");
    }

    const resultAxis = svg
        .append("g")
        .attr("transform", "translate(" + translateX + "," + translateY + ")")
        .call(axisBot);

    

    resultAxis.selectAll(".domain,.tick line")
        .attr("stroke", colour);

    resultAxis.selectAll(".tick text")
        .attr("fill", colour);

    

    return resultAxis;
}

const tiltAxisText = function (axisGElement) {
    axisGElement.selectAll("text")
        .attr("transform", "translate(-10, 0) rotate(-90)")
        .style("text-anchor", "end");

    return axisGElement;
}

const appendGraphYAxis = function (svg, axis, translateX, translateY, colour = "black") {
    const resultAxis = svg
        .append("g")
        .attr("transform", "translate(" + translateX + "," + translateY + ")")
        .call(d3.axisLeft(axis));

    resultAxis.selectAll(".domain,.tick line")
        .attr("stroke", colour);

    resultAxis.selectAll(".tick text")
        .attr("fill", colour);

    return resultAxis;
}

const appendLine = function(svg, x1, x2, y1, y2, colour = "black"){
    svg.append("g")
        .style("stroke", colour)
        .append("line")
            .attr("x1", x1)
            .attr("x2", x2)
            .attr("y1", y1)
            .attr("y2", y2);
}

const appendMedianBoxplotLine = function (svg, attributeName, xAxis, yAxis, colour = "black") {
    return svg
        .append("line")
        .attr("x1", function (d) { return xAxis(d.key); })
        .attr("x2", function (d) { return xAxis(d.key) + (xAxis.bandwidth()); })
        .attr("y1", function (d) { return yAxis(d.value[attributeName]); })
        .attr("y2", function (d) { return yAxis(d.value[attributeName]); })
        .style("stroke", colour)
}

const appendMinBoxplotLine = function (svg, xAxis, yAxis, colour = "black") {
    return svg
        .append("line")
        .attr("x1", function (d) { return xAxis(d.key) + (xAxis.bandwidth() / 3); })
        .attr("x2", function (d) { return (xAxis(d.key) + xAxis.bandwidth()) - (xAxis.bandwidth() / 3); })
        .attr("y1", function (d) { return yAxis(d.value.min); })
        .attr("y2", function (d) { return yAxis(d.value.min); })
        .style("stroke", colour);
        
}

const appendMaxBoxplotLine = function (svg, xAxis, yAxis, colour = "black") {
    return svg
        .append("line")
        .attr("x1", function (d) { return xAxis(d.key) + (xAxis.bandwidth() / 3); })
        .attr("x2", function (d) { return (xAxis(d.key) + xAxis.bandwidth()) - (xAxis.bandwidth() / 3); })
        .attr("y1", function (d) { return yAxis(d.value.max); })
        .attr("y2", function (d) { return yAxis(d.value.max); })
        .style("stroke", colour);
        
}

const appendVerticalBoxplotLines = function (svg, xAxis, yAxis, colour = "black") {
    return svg
        .append("line")
        .attr("x1", function (d) {
            return xAxis(d.key) + (xAxis.bandwidth() / 2);
        })
        .attr("x2", function (d) {
            return xAxis(d.key) + (xAxis.bandwidth() / 2);
        })
        .attr("y1", function (d) {
            return yAxis(d.value.max);
        })
        .attr("y2", function (d) {
            return yAxis(d.value.min);
        })
        .style("stroke", colour);
}




const createLinearAxis = function (domainMin, domainMax, rangeMin, rangeMax) {
    const axis = d3
        .scaleLinear()
        .domain([domainMin, domainMax])
        .range([rangeMin, rangeMax]);
    return axis;
}

const createBandAxis = function (domainValues, rangeMin, rangeMax, padding = 0.2) {
    const axis = d3
        .scaleBand()
        .range([rangeMin, rangeMax])
        .domain(domainValues)
        .padding(padding);
    return axis;
}