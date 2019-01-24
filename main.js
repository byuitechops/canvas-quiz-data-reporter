const d3 = require('d3-dsv');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const quizDataGatherer = require('./quizDataGatherer.js');
const quizDataTransformer = require('./quizDataTransformer.js');
const quizDataFlattener = require('./quizDataFlattener.js');
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
    let fileLocation = process.argv[2] || path.resolve('./Winter2019onlineScaledCoursesGroupReport_1547062079627.csv');
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
function outputJson(courseQuizData, filename) {
    var outputData = JSON.stringify(courseQuizData, null, 4);
    fs.writeFileSync(`./${filename}.json`, outputData);
}

/*************************************************************************
 * Writes CSV
 *************************************************************************/
function outputCsv(courseData, filename) {
    var keysToKeep = [
        "course_id",
        "course_name",
        "course_html_url",
        "quizOrBank_type",
        "quizOrBank_id",
        "quizOrBank_title",
        "quizOrBank_html_url",
        "question_name",
        "question_type",
        "question_text",
    ];
    courseQuizData = Object.assign(courseData);
    var courseDataCsv = courseQuizData.map(csvPrepFields)
    var outputData = d3.csvFormat(courseDataCsv, keysToKeep)
    fs.writeFileSync(`./${filename}.csv`, outputData);
    return;

    function csvPrepFields(question) {
        for (let key in question) {
            if (typeof question[key] === 'object')
                question[key] = JSON.stringify(question[key]);
        }
        question.question_text = convertHtmlToText(question.question_text);
        return question;
    }

    function convertHtmlToText(html) {
        const $ = cheerio.load(html);
        var text = $.text();
        text = text.replace(/\n/g, '\\n')
        return text;
    }
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
function queueLimiterCallback(err, courseQuizzesData) {
    console.log('DATA GATHERING COMPLETE. DATA REDUCTION BEGINNING...')
    let errorReport = generateErrorReport(courseQuizzesData); // Generate error report 
    let reformedQuizData = reformatQuizData(courseQuizzesData); // Shave Quiz and Question data to contain only info deemed worthy to keep
    let reducedQuestionsData = muiltiQuizReducer(reformedQuizData); // 
    // Output main report and error report
    console.log('PREPARING TO WRITE FILES...');
    outputJson(reducedQuestionsData, 'MAIN-REPORT-OUTPUT');
    outputJson(errorReport, 'MAIN-REPORT-ERRRRS');
    outputCsv(reducedQuestionsData, 'MAIN-REPORT-OUTPUT');
    return;

    function generateErrorReport(courseData) {
        try {
            var errorReport = courseData.reduce((acc, courseReport) => {
                if (courseReport.errors.length > 0) {
                    acc.push({
                        courseInfo: courseReport.courseData,
                        courseErrorInfo: courseReport.errors,
                    });
                }
                return acc;
            }, [])
            return errorReport;

        } catch (e) {
            console.log(e)
        }
    }

    /***************************************************************
     * Unifomrize Data, then flatten course data to question data  *
     * meaning each each top level item is a question rather than  *
     * a course                                                    *
     ***************************************************************/
    function reformatQuizData(courseData) {
        try {
            var quizzesData = courseData.map(quizzesData => {
                let transformedData = quizDataTransformer(quizzesData); // Uniformize Data
                return transformedData;
            });
            var questionsData = quizDataFlattener(quizzesData); // Flatten Uniformized Data
            return questionsData;
        } catch (e) {
            console.error('something failed during data transformation');
            console.error(e);
        }
    }

    /***************************************************************
     * Runs reduce on the question collection multiple times to    *
     * generate collections of questions that meet a certain       *
     * criteria, and groups those items by the search criteria.    *
     ***************************************************************/
    function muiltiQuizReducer(questionData) {
        return quizDataReducer(questionData)
    }
}


/*************************************************************************
 * 
 *************************************************************************/
function main() {
    var input = getInputs();
    promiseQueueLimit(input.courseList, queueLimiterAdapter(input.canvasSessionKey, input.csrfTokenKey, input.courseList.length), queueLimit, queueLimiterCallback);
    return;


}

main();