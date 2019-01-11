const d3 = require('d3-dsv');
const fs = require('fs');
const path = require('path');

const quizDataGatherer = require('./quizDataGatherer.js');
const quizDataReducer = require('./quizDataReducer.js');
const promiseQueueLimit = require('./promiseQUeueLimit.js');

let queueLimit = 50;

/*************************************************************************
 * 
 *************************************************************************/
function getInputs() {
    function getInputViaCsv(file) {
        if (path.extname(file) !== '.csv') {
            throw new Error ('File Input not a CSV!');
        } else {
            let courseListString = fs.readFileSync(file, 'utf8');
            let courseListObject = d3.csvParse(courseListString);
            delete courseListObject.columns;
            return courseListObject;
        }
    }
    // Take whatever is on the command line, else this thing
    let fileLocation = process.argv[2] || path.resolve('./test.csv') || './Winter2019onlineScaledCoursesGroupReport_1547062079627.csv';
    // Get Courses to Search
    let courseListObject = getInputViaCsv(fileLocation);
    // Set Key
    let key1 = process.argv[3] || process.env.CANVAS_SESSION;
    let key2 = process.argv[4] || process.env._CSRF_TOKEN;

    return {
        courseList: courseListObject,
        key1: key1,
        key2: key2
    };
}

/*************************************************************************
 * 
 *************************************************************************/
function output(courseData) {
    var outputData = JSON.stringify(courseData, null, 4);
    fs.writeFileSync('./THEIMPORTANTTHING.json', outputData);
}

function queueLimiterAdapter (key1, key2, queueLength) {
    return async function runner (course) {
        return Promise.resolve(quizDataGatherer(course.id, key1, key2))
            .then( (data) => {
                if (queueLength !== null || queueLength !== undefined)
                    console.log(`${++queueLimiterAdapter.numberCompleted}/${queueLength}, ${course['name']} Completed`);
                return data;
            } );
    };
}
queueLimiterAdapter.numberCompleted = 0;

function queueLimiterCallback(err, data) {
    var reducedQuizData = quizDataReducer(data);
    output(reducedQuizData);
}

/*************************************************************************
 * 
 *************************************************************************/
function main() {
    var input = getInputs();
    promiseQueueLimit ( input.courseList, queueLimiterAdapter(input.key1, input.key2, input.courseList.length), queueLimit, queueLimiterCallback );

}

main();

