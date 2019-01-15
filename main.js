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
    // Set Cookies / Keys
    let canvasSessionKey = process.argv[3] || process.env.CANVAS_SESSION || null;
    let csrfTokenKey = process.argv[4] || process.env._CSRF_TOKEN || null;

    return {
        courseList: courseListObject,
        canvasSessionKey: canvasSessionKey,
        csrfTokenKey: csrfTokenKey
    };
}

/*************************************************************************
 * 
 *************************************************************************/
function output(courseQuizData) {
    var outputData = JSON.stringify(courseQuizData, null, 4);
    fs.writeFileSync('./THEIMPORTANTTHING.json', outputData);
}

function queueLimiterAdapter (canvasSessionKey, csrfTokenKey, queueLength) {
    return async function runner (course) {
        return Promise.resolve(quizDataGatherer(course.id, canvasSessionKey, csrfTokenKey))
            .then( (quizData) => {
                if (queueLength !== null || queueLength !== undefined)
                    console.log(`${++queueLimiterAdapter.numberCompleted}/${queueLength}, ${course['name']} Completed`);
                quizData.courseData = course;
                return quizData;
            } );
    };
}
queueLimiterAdapter.numberCompleted = 0;

function queueLimiterCallback(err, courseQuizData) {
    try {
        debugger;
        var quizData = courseQuizData.map( (course) => {
            return quizDataReducer(course);
        } );
    } catch (e) {
        console.error('something failed during data transformation')
        console.error(e)
    }
    output(quizData);
}

/*************************************************************************
 * 
 *************************************************************************/
function main() {
    var input = getInputs();
    promiseQueueLimit(input.courseList, queueLimiterAdapter(input.canvasSessionKey, input.csrfTokenKey, input.courseList.length), queueLimit, queueLimiterCallback );

}

main();

