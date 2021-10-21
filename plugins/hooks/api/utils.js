const common = require('../../../api/utils/common.js');
const utils = {};

utils.updateRuleTriggerTime = function updateRuleTriggerTime(hookID) {
    const db = common.db;
    console.log("update rule trigger time,", hookID);
    if (!hookID) {
        return;
    }
    db && db.collection('hooks').findAndModify(
        {_id: common.db.ObjectID(hookID)},
        {},
        {$set: {lastTriggerTimestamp: new Date().getTime()}, $inc: { triggerCount: 1}},
        function(err, result) {
            console.log(err, result, "update triggerCountresult");
        }
    );
};

utils.addErrorRecord = function addErrorRecord(hookId, error) {
    if (!hookId) {
        return;
    }
    let errorString = error;
    if (typeof error === 'object') {
        errorString = `
            message:${error.message}
            stack: ${JSON.stringify(error.stack)}
        `
    }
    const updateOperation = {
        $push: {
            error_logs: {
                $each: [ {e:errorString, timestamp: new Date().getTime()} ],
                $slice: -10
            }
        }
    };
    console.log(hookId, updateOperation,"#fffd333");
    common.writeBatcher.add("hooks", hookId, updateOperation);
}


utils.parseStringTemplate = function(str, data, httpMethod) {
    const parseData = function(obj) {
        let d = "";
        if (typeof obj === 'object') {
            d = JSON.stringify(obj);
        }
        else {
            d = obj;
        }
        if (httpMethod === 'get') {
            return encodeURIComponent(d);
        }
        return d;
    };

    return str.replace(/\{\{(.*?)}\}/g, (sub, path) => {
        path = path.trim();
        path = path.replace(/\[(\w+)\]/g, '.$1');

        const props = path.split('.');
        let obj = data;
        if (props.length === 1 && props[0] === 'payload_json') {
            return parseData(obj);
        }

        if (props.length === 1 && props[0] === 'payload_string') {
            let jsonStr = parseData(obj);
            return jsonStr.replace(/"|\\"/g, '\\"');
        }
        props.forEach(prop => {
            obj = obj[prop] || undefined;
        });
        return parseData(obj);
    });
};


let a = `{{name}} is name. {{v}} is v, {{ e.l[1] }} is ll`;
utils.parseStringTemplate(a, {name: 2, v: 3, e: {l: [0, 1, 2]}});

module.exports = utils;
