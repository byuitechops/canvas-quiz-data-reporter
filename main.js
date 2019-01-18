const d3 = require('d3-dsv');
const fs = require('fs');
const path = require('path');

const quizDataGatherer = require('./quizDataGatherer.js');
const quizDataTransformer = require('./quizDataTransformer.js');
const quizDataReducer = require('./quizDataReducer.js');
const promiseQueueLimit = require('./promiseQueueLimit.js');

let queueLimit = 500;

/*************************************************************************
 * 
 *************************************************************************/
function getInputs() {
    function getInputViaCsv(file) {
        if (path.extname(file) !== '.csv') {
            throw new Error('File Input not a CSV!');
        } else {
            let courseListString = fs.readFileSync(file, 'utf8');
            let courseListObject = d3.csvParse(courseListString);
            delete courseListObject.columns;
            return courseListObject;
        }
    }
    // Take whatever is on the command line, else this thing
    let fileLocation = process.argv[2] || path.resolve('./test.csv') || path.resolve('./Winter2019onlineScaledCoursesGroupReport_1547062079627.csv');
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
 * Writes JSON
 *************************************************************************/
function output(courseQuizData, filename) {
    var outputData = JSON.stringify(courseQuizData, null, 4);
    fs.writeFileSync(`./${filename}.json`, outputData);
}

/*************************************************************************
 * Returns an async function with the correct variables in scope for the
 * core logic function to rely on. quizDataGatherer is core logic function
 *************************************************************************/
function queueLimiterAdapter(canvasSessionKey, csrfTokenKey, queueLength) {
    return async function runner(course) {
        return Promise.resolve(quizDataGatherer(course.id, canvasSessionKey, csrfTokenKey))
            .then((quizData) => { // Get a count of completed tasks
                if (queueLength !== null || queueLength !== undefined)
                    console.log(`${++queueLimiterAdapter.numberCompleted}/${queueLength}, ${course['name']} Completed, CourseID: ${course.id}`);
                quizData.courseData = course;
                return quizData;
            });
    };
}
queueLimiterAdapter.numberCompleted = 0;

/*************************************************************************
 * The task to run after the async logic of the program has finished.
 * Callback style function required to work with promiseQueueLimiter params.
 *************************************************************************/
function queueLimiterCallback(err, courseQuizData) {
    console.log('DATA GATHERING COMPLETE. DATA REDUCTION BEGINNING...')
    // Sever error report from successes report.
    try {
        var errorReport = courseQuizData.reduce((acc, courseReport) => {
            if (courseReport.errors.length > 0) {
                acc.push({
                    courseInfo: courseReport.courseData,
                    courseErrorInfo: courseReport.errors,
                });
            }
            return acc;
        }, [])
        output(errorReport, 'MAIN-REPORT-ERRRRS');
    } catch (e) {
        console.log(e)
    }
    // Shave Quiz and Question data to contain only info deemed worthy to keep
    try {
        var quizDataPostTransformation = courseQuizData.map(quizzesData => {
            let transformedData = quizDataTransformer(quizzesData);
            return transformedData;
        });
        output(quizDataPostTransformation, 'MAIN-REPORT-PREREDUCTION');
        var quizDataPostReduction = quizDataPostTransformation.reduce((quizzesAcc, quizzesData) => {
            quizzesData = quizDataReducer(quizzesData);
            if (quizzesData.course_quizzes_banks.length > 0)
                quizzesAcc = quizzesAcc.concat(quizzesData);
            return quizzesAcc;
        }, []);
        output(quizDataPostReduction, 'MAIN-REPORT-OUTPUT');
    } catch (e) {
        console.error('something failed during data transformation')
        console.error(e)
    }
    // Output main report and error report
    console.log('PREPARING TO WRITE FILES...');
}

/*************************************************************************
 * 
 *************************************************************************/
function main() {
    var input = getInputs();
    promiseQueueLimit(input.courseList, queueLimiterAdapter(input.canvasSessionKey, input.csrfTokenKey, input.courseList.length), queueLimit, queueLimiterCallback);

}

main();