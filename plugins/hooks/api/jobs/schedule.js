'use strict';
const job = require('../../../../api/parts/jobs/job.js'),
    plugins = require('../../../pluginManager.js'),
    log = require('../../../../api/utils/log.js')('hooks:monitor'),
    Promise = require("bluebird");
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const common = require('../../../../api/utils/common.js');

/**
 * @class
 * @classdesc Class MonitorJob is Hooks Monitor Job extend from Countly Job
 * @extends Job
 */
class ScheduleJob extends job.Job {
    /**
    * run task
    * @param {object} db - db object
    * @param {function} done - callback function
    */
    run(db, done) {
        log.d("[hooks schedule]", this._json);
        plugins.dispatch("/hooks/schedule");
        done();
    }
}

module.exports = ScheduleJob;
