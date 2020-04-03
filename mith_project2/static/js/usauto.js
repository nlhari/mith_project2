//# dc.js Getting Started and How-To Guide
'use strict';

// ### Create Chart Objects

// Create chart objects associated with the container elements identified by the css selector.
// Note: It is often a good idea to have these objects accessible at the global scope so that they can be modified or
// filtered by other page controls.
// const gainOrLossChart = new dc.PieChart('#gain-loss-chart');
// const fluctuationChart = new dc.BarChart('#fluctuation-chart');
// const quarterChart = new dc.PieChart('#quarter-chart');
// const dayOfWeekChart = new dc.RowChart('#day-of-week-chart');
// const moveChart = new dc.LineChart('#monthly-move-chart');

const yearlyCO2BubbleChart = new dc.BubbleChart('#yearlyCO2-bubble-chart');
const moveChart = new dc.LineChart('#yearly-move-chart');
const yearlyVolumeChart = new dc.BarChart('#yearly-volume-chart');
const vehiclesCount = new dc.DataCount('.dc-data-count');
const vehiclesTable = new dc.DataTable('.dc-data-table');

// const volumeChart = new dc.BarChart('#monthly-volume-chart');
// const yearlyBubbleChart = new dc.BubbleChart('#yearly-bubble-chart');
// const nasdaqCount = new dc.DataCount('.dc-data-count');
// const nasdaqTable = new dc.DataTable('.dc-data-table');

const url = "/api/usauto";

d3.json(url).then(data => {
    const dtFormatSpecifier = '%Y';
    const dtFormat = d3.timeFormat(dtFormatSpecifier);
    const dtFormatParser = d3.timeParse(dtFormatSpecifier);
    const numFormat = d3.format('.2f');

    data.forEach(d => {
        d.dd = dtFormatParser(d.ModelYear);
        d.mon = d3.timeMonth(d.dd);
        d.RealWorldCO2_City = +d.RealWorldCO2_City;
        d.Horsepower = +d.Horsepower;
    })

    const cars = crossfilter(data);
    const all = cars.groupAll();

    var dimensionMfrClass = cars.dimension(d => {return d.Manufacturer + '-' + d.RegulatoryClass});
    dimensionMfrClass.filter(d => {return d === 'All-Car'});

    // var yearCount = dimensionMfrClassVehicle.group().reduceCount(function (d) { return d.RealWorldCO2_City; }).all();
    // console.log(yearCount);

    // const yearlyCityCO2Dimension = cars.dimension(d => d3.timeYear(d.dd).getFullYear())
    const yearlyCityCO2Dimension = cars.dimension(d => d.ModelYear)

    const yearlyCityCO2Group = yearlyCityCO2Dimension.group().reduce(
        /* callback for when data is added to the current filter results */
        (p, v) => {
            if(v.RealWorldCO2_City){
                ++p.count;
                p.co2 = v.RealWorldCO2_City;
                p.sum += v.RealWorldCO2_City;
                p.co2Change = v.prevYearCO2_City - v.RealWorldCO2_City;
                p.avg = p.count ? p.sum / p.count : 0;
                p.pctGain = p.co2Change ? (p.co2Change / p.co2) * 100 : 0;
                // console.log(p.co2, numFormat(p.co2Change), p.count, p.avg, p.sum, p.pctGain);
            }

            return p;
        },
        /* callback for when data is removed from the current filter results */
        (p, v) => {
            if(v.RealWorldCO2_City){
                --p.count;
                p.co2 = v.RealWorldCO2_City;
                p.sum -= v.RealWorldCO2_City;
                p.co2Change = v.prevYearCO2_City - v.RealWorldCO2_City;
                p.avg = p.count ? p.sum / p.count : 0;
                // console.log(p.co2, numFormat(p.co2Change), p.count, p.avg, p.sum);
            }
            // console.log(p.co2, numFormat(p.co2Change), p.count, p.avg, p.sum);
            // console.log(p.avg);
            return p;
        },
        /* initialize p */
        () => ({
            count: 0,
            sum: 0,
            avg: 0,
            co2: 0,
            co2Change: 0,
            pctGain: 0
        })
    )
    // console.log(yearlyCityCO2Group.top(10))
    // console.log(yearlyCityCO2Group.top(Number.POSITIVE_INFINITY).length)

    const moveYear = cars.dimension(d => d.mon);

    const moveYearGroup = moveYear.group().reduceSum(d => d.Horsepower);

    const HorsepowerDim  = moveYear.group().reduce(
        (p,v) => {
            ++p.years;
            p.Horsepower = v.Horsepower;
            // console.log(v.ModelYear + v.Manufacturer + v.RegulatoryClass);
            // console.log(v.Horsepower);
            return p; 
        },
        (p,v) => {
            --p.years;
            p.Horsepower = v.Horsepower;
            return p;
        },
        () => ({years: 0, Horsepower: 0})
    );
    yearlyCO2BubbleChart /* dc.bubbleChart('#yearly-bubble-chart', 'chartGroup') */
        // (_optional_) define chart width, `default = 200`
        .width(990)
        // (_optional_) define chart height, `default = 200`
        .height(400)
        // (_optional_) define chart transition duration, `default = 750`
        .transitionDuration(1500)
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .dimension(yearlyCityCO2Dimension)
        //The bubble chart expects the groups are reduced to multiple values which are used
        //to generate x, y, and radius for each key (bubble) in the group
        .group(yearlyCityCO2Group)
        // (_optional_) define color function or array for bubbles: [ColorBrewer](http://colorbrewer2.org/)
        .colors(d3.schemeRdYlGn[9])
        //(optional) define color domain to match your data domain if you want to bind data or color
        .colorDomain([-20, 20])
    //##### Accessors

    //Accessor functions are applied to each value returned by the grouping

        // `.colorAccessor` - the returned value will be passed to the `.colors()` scale to determine a fill color
        .colorAccessor(d => d.value.co2Change)
        // `.keyAccessor` - the `X` value will be passed to the `.x()` scale to determine pixel location
        .keyAccessor(p => p.value.co2Change)
        // `.valueAccessor` - the `Y` value will be passed to the `.y()` scale to determine pixel location
        .valueAccessor(p => p.value.pctGain)
        // `.radiusValueAccessor` - the value will be passed to the `.r()` scale to determine radius size;
        //   by default this maps linearly to [0,100]
        .radiusValueAccessor(p => p.value.avg)
        .maxBubbleRelativeSize(0.3)
        .x(d3.scaleLinear().domain([-20, 100]))
        .y(d3.scaleLinear().domain([-100, 100]))
        .r(d3.scaleLinear().domain([0, 4000]))

        //##### Elastic Scaling

        //`.elasticY` and `.elasticX` determine whether the chart should rescale each axis to fit the data.
        .elasticY(true)
        .elasticX(true)
        //`.yAxisPadding` and `.xAxisPadding` add padding to data above and below their max values in the same unit
        //domains as the Accessors.
        .yAxisPadding(10)
        .xAxisPadding(6)
        // (_optional_) render horizontal grid lines, `default=false`
        .renderHorizontalGridLines(true)
        // (_optional_) render vertical grid lines, `default=false`
        .renderVerticalGridLines(true)
        // (_optional_) render an axis label below the x axis
        .xAxisLabel('CO2 Change (g/mi)')
        // (_optional_) render a vertical axis lable left of the y axis
        .yAxisLabel('CO2 Change %')
        //##### Labels and  Titles

        //Labels are displayed on the chart for each bubble. Titles displayed on mouseover.
        // (_optional_) whether chart should render labels, `default = true`
        .renderLabel(true)
        .label(p => p.key)
        // (_optional_) whether chart should render titles, `default = false`
        .renderTitle(true)
        .title(p => [
            p.key,
            `CO2 Change: ${numFormat(p.value.co2Change)}`,
            `CO2 Change in Percentage: ${numFormat(p.value.pctGain)}%`,
            `Avg Real World CO2 (City): ${numFormat(p.value.avg)}(g/mi)`
        ].join('\n'))
        //#### Customize Axes

        // Set a custom tick format. Both `.yAxis()` and `.xAxis()` return an axis object,
        // so any additional method chaining applies to the axis, not the chart.
        .yAxis().tickFormat(v => `${v}%`);

    moveChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
        .renderArea(true)
        .renderDataPoints(true)
        .width(990)
        .height(200)
        .transitionDuration(1000)
        .margins({top: 30, right: 50, bottom: 25, left: 40})
        .dimension(moveYear)
        .mouseZoomable(true)
    // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
        .rangeChart(yearlyVolumeChart)
        .x(d3.scaleTime().domain([new Date(1976, 0, 1), new Date(2019, 11, 31)]))
        .round(d3.timeMonth.round)
        .xUnits(d3.timeMonths)
        .elasticY(true)
        .renderHorizontalGridLines(true)
    //##### Legend

        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(new dc.Legend().x(800).y(10).itemHeight(13).gap(5))
        .brushOn(false)
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer
        .group(HorsepowerDim, 'Horsepower by Year')
        .valueAccessor(d => d.value.Horsepower)
        // Stack additional layers with `.stack`. The first paramenter is a new group.
        // The second parameter is the series name. The third is a value accessor.
        // .stack(monthlyMoveGroup, 'Monthly Index Move', d => d.value)
        // // Title can be called by any stack layer.
        // .title(d => {
        //     let value = d.value.avg ? d.value.avg : d.value;
        //     if (isNaN(value)) {
        //         value = 0;
        //     }
        //     return `${dateFormat(d.key)}\n${numberFormat(value)}`;
        // });
        .title(p => [
            p.key.getFullYear(),
            `Average Horsepower: ${numFormat(p.value.Horsepower)}`
        ].join('\n'))


    yearlyVolumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .height(40)
        .margins({top: 0, right: 50, bottom: 20, left: 40})
        .dimension(moveYear)
        .group(moveYearGroup)
        .centerBar(true)
        .gap(1)
        .x(d3.scaleTime().domain([new Date(1976, 0, 1), new Date(2019, 11, 31)]))
        .round(d3.timeMonth.round)
        .alwaysUseRounding(true)
        .xUnits(d3.timeMonths);

    vehiclesCount /* dc.dataCount('.dc-data-count', 'chartGroup'); */
        .crossfilter(cars)
        .groupAll(all)
        // (_optional_) `.html` sets different html when some records or all records are selected.
        // `.html` replaces everything in the anchor with the html given using the following function.
        // `%filter-count` and `%total-count` are replaced with the values obtained.
        .html({
            some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'>Reset All</a>',
            all: 'All records selected. Please click on the graph to apply filters.'
        });

    vehiclesTable /* dc.dataTable('.dc-data-table', 'chartGroup') */
        .dimension(yearlyCityCO2Dimension) // or moveYear
        // Specify a section function to nest rows of the table
        // .section(d => {
        //     const format = d3.format('02d');
        //     return `${d.dd.getFullYear()}/${format((d.dd.getFullYear() + 4))}`;
        // })
        // (_optional_) max number of records to be shown, `default = 25`
        .size(10)
        // There are several ways to specify the columns; see the data-table documentation.
        // This code demonstrates generating the column header automatically based on the columns.
        .columns([
            'ModelYear',
            'VehicleType',
            'RealWorldCO2_City',
            'prevYearCO2_City',
            {
                // Specify a custom format for column 'Change' by using a label with a function.
                label: 'CO2 Change',
                format: function (d) {
                    return numFormat(d.prevYearCO2_City - d.RealWorldCO2_City);
                }
            },
            'Horsepower'
        ])

        // (_optional_) sort using the given field, `default = function(d){return d;}`
        .sortBy(d => d.dd)
        // (_optional_) sort order, `default = d3.ascending`
        .order(d3.ascending)
        // (_optional_) custom renderlet to post-process chart using [D3](http://d3js.org)
        .on('renderlet', table => {
            table.selectAll('.dc-table-group').classed('info', true);
        });

    //#### Rendering

    //simply call `.renderAll()` to render all charts on the page
    dc.renderAll();

});

//#### Versions

//Determine the current version of dc with `dc.version`
d3.selectAll('#version').text(dc.version);

// Determine latest stable version in the repo via Github API
d3.json('https://api.github.com/repos/dc-js/dc.js/releases/latest').then(latestRelease => {
    /* eslint camelcase: 0 */
    d3.selectAll('#latest').text(latestRelease.tag_name);
});
