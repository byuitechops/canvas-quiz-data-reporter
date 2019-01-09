const d3 = require('d3-dsv');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

const quizDataGatherer = require('quizDataGatherer.js');
const quizDataReducer = require('quizDataReducer.js');

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
            return courseListObject;
        }
    }
    // Take whatever is on the command line, else this thing
    let fileLocation = process.argv[4] || 'Winter2019onlineScaledCoursesGroupReport_1547062079627';
    // Get Courses to Search
    let courseListObject = getInputViaCsv(fileLocation);
    // Set Keys
    let key1 = process.argv[2];
    let key2 = process.argv[3];

    return {
        courseList: courseListObject,
        key1: key1,
        key2: key2
    };
}

/*************************************************************************
 * 
 *************************************************************************/
function output() {}


/*************************************************************************
 * 
 *************************************************************************/
function main() {
    var input = getInputs();
    var quizData = promiseQueueLimiter (input.courseList, );
}

main();