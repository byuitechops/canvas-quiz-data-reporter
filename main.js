const d3 = require('d3-dsv');
const fs = require('fs');
const path = require('path');

const quizDataGatherer = require('./quizDataGatherer.js');
// const quizDataReducer = require('./quizDataReducer.js');
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
    let fileLocation = process.argv[4] || 'Winter2019onlineScaledCoursesGroupReport_1547062079627.csv';
    // Get Courses to Search
    let courseListObject = getInputViaCsv(fileLocation);
    // Set Key
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
function output() {

}


/*************************************************************************
 * 
 *************************************************************************/
function main() {
    var input = getInputs();
    var queueLimiterAdapter = (key1, key2) => {
        return async (course) => {
            return Promise.resolve ( quizDataGatherer(course.id, key1, key2) );
        };
    };
    promiseQueueLimit ( input.courseList, queueLimiterAdapter(input.key1, input.key2), queueLimit, (err, data) => /* console.log(data) */'' );
}

main();

