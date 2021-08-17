/* global countlyVue, countlyAllEvents, countlyCompareEvents, countlyCommon, CV,app*/
var EventsTable = countlyVue.views.BaseView.extend({
    mixins: [countlyVue.mixins.i18n],
    data: function() {
        return {
            scoreTableExportSettings: {
                title: "AllEvents",
                timeDependent: true
            }
        };
    },
    computed: {
        eventsTableRows: function() {
            return this.$store.getters["countlyAllEvents/tableRows"];
        },
    },
    methods: {
        isColumnAllowed: function(column) {
            var events = this.$store.getters["countlyAllEvents/allEventsProcessed"];
            if (events && events.tableColumns && events.tableColumns.indexOf(column) !== -1) {
                return true;
            }
            return false;
        }
    },
    template: '#tables-events'
});

var CompareEventsTable = countlyVue.views.BaseView.extend({
    mixins: [countlyVue.mixins.i18n],
    data: function() {
        return {
            scoreTableExportSettings: {
                title: "CompareEvents",
                timeDependent: true,
            }
        };
    },
    updated: function() {
        this.$refs.compareEvents.$refs.elTable.clearSelection();
        var self = this;
        this.$store.getters["countlyCompareEvents/tableRows"]
            .map(function(row) {
                if (row.checked) {
                    self.$refs.compareEvents.$refs.elTable.toggleRowSelection(row, true);
                }
                else {
                    self.$refs.compareEvents.$refs.elTable.toggleRowSelection(row, false);
                }
            });
    },
    computed: {
        eventsTableRows: function() {
            return this.$store.getters["countlyCompareEvents/tableRows"];
        },
    },
    methods: {
        handleCurrentChange: function(selection) {
            var selectedEvents = [];
            selection.forEach(function(item) {
                selectedEvents.push(item.name);
            });
            this.$store.dispatch('countlyCompareEvents/fetchLineChartData', selectedEvents);
            this.$store.dispatch('countlyCompareEvents/fetchLegendData', selectedEvents);
        },
        handleAllChange: function(selection) {
            var selectedEvents = [];
            selection.forEach(function(item) {
                selectedEvents.push(item.name);
            });
            this.$store.dispatch('countlyCompareEvents/fetchLineChartData', selectedEvents);
            this.$store.dispatch('countlyCompareEvents/fetchLegendData', selectedEvents);
        }
    },
    template: '#compare-events-table'
});

var EventsPages = countlyVue.views.BaseView.extend({
    template: "#events-pages",
    data: function() {
        return {
            dynamicTab: (this.$route.params && this.$route.params.tab) || "allEvents",
            tabs: [
                {
                    title: "Event Stats",
                    name: "allEvents",
                    component: AllEventsView,
                    route: "#/" + countlyCommon.ACTIVE_APP_ID + "/analytics/events/key/" + this.$store.getters["countlyAllEvents/selectedEventName"]
                },
                {
                    title: "Compare Events",
                    name: "compareEvents",
                    component: compareEvents,
                    route: "#/" + countlyCommon.ACTIVE_APP_ID + "/analytics/events/compare"
                }
            ],
        };
    }
});

var compareEvents = countlyVue.views.BaseView.extend({
    template: "#compare-events",
    components: {
        "detail-tables": CompareEventsTable,
    },
    methods: {
        compareEvents: function() {
            this.$store.dispatch('countlyCompareEvents/fetchSelectedEvents', this.value);
            this.$store.dispatch('countlyCompareEvents/fetchCompareEventsData');
        }
    },
    computed: {
        allEvents: function() {
            return this.$store.getters["countlyCompareEvents/allEvents"].list;
        },
        lineChartData: function() {
            return this.$store.getters["countlyCompareEvents/lineChartData"];
        },
        lineLegend: function() {
            return this.$store.getters["countlyCompareEvents/lineLegend"];
        },
        selectedDatePeriod: {
            get: function() {
                return this.$store.getters["countlyCompareEvents/selectedDatePeriod"];
            },
            set: function(period) {
                this.$store.dispatch('countlyCompareEvents/fetchSelectedDatePeriod', period);
                countlyCommon.setPeriod(period);
                this.$store.dispatch('countlyCompareEvents/fetchCompareEventsData', this.value);
            }
        },
        selectedGraph: {
            get: function() {
                var self = this;
                if (self.selectedMetric === "Sum") {
                    return this.i18n("events.compare.results.by.sum");
                }
                else if (self.selectedMetric === "Duration") {
                    return this.i18n("events.compare.results.by.duration");
                }
                return this.i18n("events.compare.results.by.count");
            },
            set: function(selectedItem) {
                var self = this;
                if (selectedItem === this.i18n("events.compare.results.by.sum")) {
                    self.selectedMetric = "Sum";
                    this.$store.dispatch('countlyCompareEvents/fetchSelectedGraphMetric', "s");
                    this.$store.dispatch('countlyCompareEvents/fetchLineChartData');
                }
                else if (selectedItem === this.i18n("events.compare.results.by.duration")) {
                    self.selectedMetric = "Duration";
                    this.$store.dispatch('countlyCompareEvents/fetchSelectedGraphMetric', "dur");
                    this.$store.dispatch('countlyCompareEvents/fetchLineChartData');
                }
                else {
                    self.selectedMetric = "Count";
                    this.$store.dispatch('countlyCompareEvents/fetchSelectedGraphMetric', "c");
                    this.$store.dispatch('countlyCompareEvents/fetchLineChartData');
                }
            }
        },
    },
    data: function() {
        return {
            value: "",
            maxLimit: 20,
            availableMetrics: [
                this.i18n("events.compare.results.by.count"),
                this.i18n("events.compare.results.by.sum"),
                this.i18n("events.compare.results.by.duration")
            ],
            selectedMetric: "Count"
        };
    },
    beforeCreate: function() {
        countlyCommon.setPeriod("30days");
        this.$store.dispatch('countlyCompareEvents/fetchAllEventsData');
    }

});

var eventsWrapper = countlyVue.views.BaseView.extend({
    template: "#events-wrapper",
    components: {
        "events-pages": EventsPages,
    }
});

var AllEventsView = countlyVue.views.BaseView.extend({
    template: "#all-events",
    components: {
        "detail-tables": EventsTable,
    },
    computed: {
        selectedDatePeriod: {
            get: function() {
                return this.$store.getters["countlyAllEvents/selectedDatePeriod"];
            },
            set: function(value) {
                this.$store.dispatch('countlyAllEvents/fetchSelectedDatePeriod', value);
                countlyCommon.setPeriod(value);
                this.$store.dispatch('countlyAllEvents/fetchAllEventsData');
                this.$store.dispatch('countlyAllEvents/fetchAllEventsGroupData');
            }
        },
        selectedSegment: {
            get: function() {
                return this.$store.getters["countlyAllEvents/currentActiveSegmentation"];
            },
            set: function(selectedItem) {
                if (selectedItem === "segment") {
                    this.$store.dispatch("countlyAllEvents/fetchCurrentActiveSegmentation", "segment");
                }
                else {
                    this.$store.dispatch("countlyAllEvents/fetchCurrentActiveSegmentation", selectedItem);
                }
                this.$store.dispatch("countlyAllEvents/fetchSelectedEventsData");
            }
        },
        hasSegments: function() {
            return this.$store.getters["countlyAllEvents/hasSegments"];
        },
        availableSegments: function() {
            return this.$store.getters["countlyAllEvents/availableSegments"];
        },
        selectedEventName: function() {
            return this.$store.getters["countlyAllEvents/selectedEventName"];
        },
        isGroup: function() {
            return this.$store.getters["countlyAllEvents/isGroup"];
        },
        selectedEventDescription: function() {
            return this.$store.getters["countlyAllEvents/description"];
        },
        currentActiveSegmentation: function() {
            return this.$store.getters["countlyAllEvents/currentActiveSegmentation"];
        },
        chartData: function() {
            return this.$store.getters["countlyAllEvents/lineChartData"];
        },
        barData: function() {
            return this.$store.getters["countlyAllEvents/barData"];
        },
        selectedEventsOverview: function() {
            return this.$store.getters["countlyAllEvents/selectedEventsOverview"];
        },
        lineLegend: function() {
            return this.$store.getters["countlyAllEvents/legendData"];
        },
        allEvents: function() {
            return this.$store.getters["countlyAllEvents/allEvents"].list;
        },
    },
    data: function() {
        return {
            description: CV.i18n('events.all.title.new')
        };
    },
    beforeCreate: function() {
        countlyCommon.setPeriod("30days");
        if (this.$route.params) {
            this.$store.dispatch('countlyAllEvents/fetchSelectedEventName', this.$route.params.eventKey);
        }
        this.$store.dispatch('countlyAllEvents/fetchAllEventsData');
        this.$store.dispatch('countlyAllEvents/fetchAllEventsGroupData');
    }
});

var allEventsVuex = [{
    clyModel: countlyAllEvents
}];

var compareEventsVuex = [{
    clyModel: countlyCompareEvents
}];

var AllEventsViewWrapper = new countlyVue.views.BackboneWrapper({
    component: eventsWrapper,
    vuex: allEventsVuex,
    templates: [
        "/core/events/templates/allEvents.html",
        "/core/events/templates/compareEvents.html"
    ]
});

var CompareEventsViewWrapper = new countlyVue.views.BackboneWrapper({
    component: eventsWrapper,
    vuex: compareEventsVuex,
    templates: [
        "/core/events/templates/allEvents.html",
        "/core/events/templates/compareEvents.html"
    ]
});

app.route("/analytics/events/key/:eventKey", "all-events", function(eventKey) {
    var params = {
        eventKey: eventKey ? eventKey : ""
    };
    AllEventsViewWrapper.params = params;
    this.renderWhenReady(AllEventsViewWrapper);
});

app.route("/analytics/events/compare", "compare-events", function() {
    var params = {
        tab: "compareEvents"
    };
    CompareEventsViewWrapper.params = params;
    this.renderWhenReady(CompareEventsViewWrapper);
});