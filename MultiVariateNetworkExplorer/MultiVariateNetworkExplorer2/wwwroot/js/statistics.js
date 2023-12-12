const getAttributeValueList = function (nodes, attribute) {
    const attributeValueList = [];
    for (const node of nodes) {
        const { [attribute]: attributeValue } = node;
        if (attributeValue !== null) {
            attributeValueList.push(attributeValue);
        }
    }
    return attributeValueList;
}

const Q1 = function (attributeValueList) {
    const attributeValueListCount = attributeValueList.length;
    const Q1Index = Math.floor(attributeValueListCount / 4.0);
    if (Q1Index % 2 == 0) {
        const Q1Index2 = Q1Index - 1;
        const Q1 = (attributeValueList[Q1Index] + attributeValueList[Q1Index2]) / 2.0;
        return Q1;
    }

    const Q1 = attributeValueList[Q1Index];
    return Q1;
}

const Q3 = function (attributeValueList) {
    const attributeValueListCount = attributeValueList.length;
    const Q3Index = Math.floor(attributeValueListCount * (3.0 / 4.0));
    if (Q3Index % 2 == 0) {
        const Q3Index2 = Q3Index - 1;
        const Q3 = (attributeValueList[Q3Index] + attributeValueList[Q3Index2]) / 2.0;
        return Q3;
    }
    const Q3 = attributeValueList[Q3Index];

    return Q3;
}


const IQR = function (nodes, attribute) {
    const attributeValueList = getAttributeValueList(nodes, attribute);
    if (attributeValueList.length <= 2) {
        return -1;
    }
    attributeValueList.sort();

    return Q3(attributeValueList) - Q1(attributeValueList);
}

const mean = function (nodes, attribute) {
    let result = 0;
    for (const node of nodes) {
        result += node[attribute];
    }
    result /= nodes.length;
    return result;
}

const standardDeviation = function (nodes, attribute, iMean = null) {
    let result = 0;
    let attributeMean = iMean === null ? mean(nodes, attribute) : iMean;
    for (const node of nodes) {
        const difference = node[attribute] - attributeMean;
        result += Math.pow(difference, 2);
    }

    result /= (nodes.length - 1);
    return result;
}

const skewness = function (nodes, attribute) {
    let result = 0;
    const attributeMean = mean(nodes, attribute);
    const attributeStd = standardDeviation(nodes, attribute, attributeMean);

    for (const node of nodes) {
        const difference = node[attribute] - attributeMean;
        result += Math.pow(difference, 3);
    }
    result /= ((nodes.length - 1) * Math.pow(attributeStd, 3));
    return result;
}