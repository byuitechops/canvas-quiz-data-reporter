const d3 = require('d3-dsv');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const quizDataGatherer = require('./quizDataGatherer.js');
const quizDataTransformer = require('./quizDataTransformer.js');
const quizDataFlattener = require('./quizDataFlattener.js');
const quizDataReducer = require('./quizDataReducer.js');
const promiseQueueLimit = require('./promiseQueueLimit.js');
const deepSearch = require('./deepSearch.js');

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
        "course_code", // Dont have this field
        "course_name",
        "course_sisid",
        "course_html_url",
        "quizOrBank_type",
        "quizOrBank_id",
        "quizOrBank_title",
        "quizOrBank_html_url",
        "question_name",
        "question_type",
        "question_flagReason",
        "question_text",
    ];
    courseQuizData = new Array(...courseData);
    var courseDataCsv = courseQuizData.map(csvPrepFields);
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
        try {
            const $ = cheerio.load(html);
            var text = $.text();
            text = text.replace(/\n/g, '\\n')
            return text;
        } catch (e) {
            return html;
        }
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
    try {
        var reducedQuestionsData = muiltiQuizReducer(reformedQuizData); // 
    } catch (e) {
        console.error(e)
    }
    // let reducedQuestionsData = reformedQuizData;
    // Output main report and error report
    console.log('PREPARING TO WRITE FILES...');
    outputJson(reformedQuizData, 'MAIN-REPORT-FULL');
    outputJson(reducedQuestionsData, 'MAIN-REPORT-OUTPUT');
    outputJson(errorReport, 'MAIN-REPORT-ERRRRS');
    outputCsv(reducedQuestionsData, 'MAIN-REPORT-OUTPUT');
    return;

    /***************************************************************
     * Pulls important information from object to generate report  *
     * or errors gathered while getting quiz banks and quizzes     *
     ***************************************************************/
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
    function muiltiQuizReducer(questionsData) {
        const checksByType = {
            "matching_question": {
                checkers: [blankTest()],
                keeperKeys: ['text', 'left', 'right',],
            },
            "multiple_choice_question": {
                checkers: [blankTest(), textTest('no answer text provided')],
                keeperKeys: ['text',],
            },
            "numerical_question": {
                checkers: [blankTest(), zeroTest()],
                keeperKeys: ['exact',],
            },
            "short_answer_question": {
                checkers: [blankTest(), hyphenTest(), textTest('response_')],
                keeperKeys: ['text',],
            },
            "fill_in_multiple_blanks_question": {
                checkers: [blankTest(), hyphenTest(), textTest('response_')],
                keeperKeys: ['text',],
            },
        }
        return Object.keys(checksByType).reduce((questionsAcc, questionType) => {
            let targetQuestions = quizDataReducer(questionsData, questionType, checksByType[questionType].checkers, checksByType[questionType].keeperKeys);
            return questionsAcc.concat(targetQuestions);
        }, []);

        // checks for blanks in fields
        function blankTest() {
            return {
                validator: new RegExp(/^[\n\s\t\ufeff]+$|^(?![\s\S])$|^null$|^undefined$/, 'gi'),
                flagReason: 'blank',
            }
        }
        // Check for hyphens in fields
        function hyphenTest() {
            return {
                validator: new RegExp(/-/, 'g'),
                flagReason: 'hyphen',
            }
        }
        // check for matching text in fields
        function textTest(text) {
            return {
                validator: new RegExp(text, 'gi'),
                flagReason: `text matched: ${text}`,
            }
        }
        // check for zero in fields
        function zeroTest() {
            return {
                validator: new RegExp(/^0$/, 'i'),
                flagReason: 'zero',
            }
        };
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