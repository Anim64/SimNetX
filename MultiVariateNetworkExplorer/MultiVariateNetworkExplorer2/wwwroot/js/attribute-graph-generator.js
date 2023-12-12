const freedmanDiaconisRule = function (nodes, attribute) {
    let IQRValue = IQR(nodes, attribute);
    if (IQRValue === 0) {
        IQRValue = IQRValue + 1;
    }

    return Math.ceil(2 * IQRValue * Math.pow(nodes.length, (-1.0 / 3)));
}

const sigmaG1 = function (n){
    return Math.sqrt(((6.0 * (n - 2))) / ((n + 1) * (n + 3)));
}

const dormanFormula = function (nodes, attribute) {
    const nodeCount = nodes.length;
    const attributeSkewness = skewness(nodes, attribute);
    const attributeSigmaG1 = sigmaG1(nodeCount)
    const k = 1 + Math.log2(nodeCount) + Math.log2(1 + (Math.abs(attributeSkewness) / attributeSigmaG1));
    return k;
}

const createHistogram = function (containerDivId, nodes, attribute) {
    const nBins = dormanFormula(nodes, attribute);
    const histogramMargin = { top: 10, right: 10, bottom: 20, left: 25 },
        histogramWidth = 300 - (histogramMargin.left + histogramMargin.right),
        histogramHeight = 250 - (histogramMargin.top + histogramMargin.bottom);


    const attributeValueList = getAttributeValueList(nodes, attribute);
    const xMin = d3.min(attributeValueList);
    const xMax = d3.max(attributeValueList);
    const xAxis = createAxis(xMin, xMax, 0, histogramWidth);


    const histogram = d3
        .histogram()
        .domain(xAxis.domain())
        .thresholds(xAxis.ticks(nBins));

    const bins = histogram(attributeValueList);

    const yMin = 0;
    const yMax = d3.max(bins, function (d) {
        return d.length;
    });
    const yAxis = createAxis(yMin, yMax, histogramHeight, 0);

    const histogramSvg =
        createHistogramSvg(containerDivId, histogramWidth,
            histogramHeight, histogramMargin, attribute);

    
    appendHistogramXAxis(histogramSvg, xAxis, 0, histogramHeight);
    appendHistogramYAxis(histogramSvg, yAxis, 0, 0);
    appendHistogramBins(histogramSvg, bins, histogramHeight, xAxis, yAxis);
}

const createHistogramSvg = function (containerDivId, width, height, margin, attribute) {
    const selectorString = '[id=\"' + containerDivId + '\"]';
    const histogramSvg = d3
        .select(selectorString)
        .append("svg")
        .attr("width", "100%"/*width + margin.left + margin.right*/)
        .attr("height", height + margin.top + margin.bottom)
        .attr("data-attribute", attribute)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    return histogramSvg;
}

const appendHistogramXAxis = function (svg, axis, translateX, translateY) {
    svg
        .append("g")
        .attr("transform", "translate(" + translateX + "," + translateY + ")")
        .call(d3.axisBottom(axis));

    return svg;
}

const appendHistogramYAxis = function (svg, axis, translateX, translateY) {
    svg
        .append("g")
        .attr("transform", "translate(" + translateX + "," + translateY + ")")
        .call(d3.axisLeft(axis));

    return svg;
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


const createAxis = function (domainMin, domainMax, rangeMin, rangeMax) {
    const axis = d3
        .scaleLinear()
        .domain([domainMin, domainMax])
        .range([rangeMin, rangeMax]);
    return axis;
}