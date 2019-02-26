const d3 = require('d3-dsv');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const QBTools = require('canvas-question-banks');
const canvas = require('canvas-api-wrapper');

const quizDataGatherer = require('./quizDataGatherer.js');
const quizDataTransformer = require('./quizDataTransformer.js');
const quizDataFlattener = require('./quizDataFlattener.js');
const quizDataReducer = require('./quizDataReducer.js');
const promiseQueueLimit = require('./promiseQueueLimit.js');

var QuestionBanksTools;

let queueLimit = 5;

/*************************************************************************
 * 
 *************************************************************************/
async function getInputs() {
    // Take whatever is on the command line, else this thing
    let fileLocation = process.argv[2] || path.resolve('./Winter2019onlineScaledCoursesGroupReport_1547062079627.csv');

    // Get Courses to Search
    // let courseListObject = getInputViaCsv(fileLocation);
    // let courseListObject = await getInputViaApi();
    let courseListObject = getInputViaJson(fileLocation);
    let auth = getAuth();
    courseListObject = Array.isArray(courseListObject) ? courseListObject : [].concat(courseListObject);

    return {
        courseList: courseListObject,
        // correct casing is needed for puppeteer-canvas-login used in canvas-question-banks
        authData: {
            userName: auth.userName,
            passWord: auth.passWord
        }
    };

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

    function getInputViaJson(file) {
        if (path.extname(file) !== '.json') {
            throw new Error('File Input not a JSON!');
        } else {
            return require(path.resolve('./', file));
        }
    }

    async function getInputViaApi() {
        canvas.subdomain = 'byui.beta'
        return await canvas.get('https://byui.beta.instructure.com/api/v1/accounts/1/courses?enrollment_term_id=23&per_page=100')
    }


    function getAuth() {
        var auth = {
            userName: process.env.USERNAMENODE,
            passWord: process.env.PASSWORD
        }

        return auth;
    }
}

/*************************************************************************
 * Writes JSON
 *************************************************************************/
function outputJson(courseQuizData, filename) {
    var outputData = JSON.stringify(courseQuizData, null, 4);
    fs.writeFileSync(`${filename}.json`, outputData);
}

/*************************************************************************
 * Writes CSV 
 * // TODO Update course_code to course_course_code, and course_sisid to course_sis_course_id to match canvas api, and all references to it in code
 *************************************************************************/
function outputCsv(courseData, filename) {
    var keysToKeep = [
        "course_id",
        "course_code",
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
    fs.writeFileSync(`${filename}.csv`, outputData);
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
 * Writes CSV 
 *************************************************************************/
function makeOutputFolder(folderName) {
    if (!fs.existsSync(folderName))
        fs.mkdirSync(folderName);
}

/*************************************************************************
 * Returns an async function with the correct variables in scope for the
 * core logic function to rely on. quizDataGatherer is core logic function
 *************************************************************************/
function queueLimiterAdapter(questionBanksTools, queueLength) {
    return async function runner(course) {
        return Promise.resolve(quizDataGatherer(course.id, questionBanksTools))
            .then((quizData) => { // Get a count of completed tasks
                if (typeof queueLength === 'number' || typeof queueLength === 'string')
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
    QuestionBanksTools.logout();
    // Reformat, Reduce, and Prepare Data for Output
    console.log('DATA GATHERING COMPLETE. DATA REDUCTION BEGINNING...');
    let errorReport = generateErrorReport(courseQuizzesData); // Generate error report
    let reformedQuizData = reformatQuizData(courseQuizzesData); // Uniformize and Flatten Question Data
    // var reducedQuestionsData = muiltiQuizReducer(reformedQuizData); // Filter quiz data down to matches
    var reducedQuestionsData = quizDataReducer(reformedQuizData); // Filter quiz data down to matches
    // Output main report and error report
    console.log('PREPARING TO WRITE FILES...');
    let timeStamp = moment().format('YYYYMMDD-kkmm_');
    let saveLocation = (filename) => path.resolve(`./_${timeStamp}${filename}`);
    makeOutputFolder(saveLocation('reports'));
    outputJson(reformedQuizData, saveLocation('report_full-not-reduced-everything'));
    outputJson(reducedQuestionsData, saveLocation('report_main'));
    outputJson(errorReport, saveLocation('report_errors'));
    outputCsv(reducedQuestionsData, saveLocation('report_main'));
    console.log('FILES SUCCESSFULLY WRITTEN...EXITING PROGRAM.');
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
}


/*************************************************************************
 * 
 *************************************************************************/
async function main() {
    var input = await getInputs();
    console.log('STARTING DATA GATHERING...');
    QuestionBanksTools = await QBTools(input.authData);
    promiseQueueLimit(input.courseList, queueLimiterAdapter(QuestionBanksTools, input.courseList.length), queueLimit, queueLimiterCallback);
    return;


}

main().catch(console.error);