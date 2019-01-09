let d3 = require("d3-dsv");
let fs = require("fs");
let enquirer = require('inquirer');

function getInputs() {
    fs.readFile('./Winter2019onlineScaledCoursesGroupReport_1547062079627.csv', 'utf8', function read(err, data) {
        if (err) {
            throw err;
        }
        let csv = d3.csvParse(data);
        console.log(csv);
    });

     /* User Username */
     enquirer.question('key1', 'Key1:', {
        errorMessage: 'Cannot be blank!',
        validate: (input) => {
            return input != undefined;
        },
        when: (answers) => answers.postImport.includes('groups-bridge') || !process.argv.includes('-e')
    });

    /* User Password */
    enquirer.question('key2', 'Key2:', {
        errorMessage: 'Cannot be blank!',
        validate: (input) => {
            return input != undefined;
        },
        when: (answers) => answers.postImport.includes('groups-bridge') || !process.argv.includes('-e')
    });

    /* Check env variable before asking for user credentials */
    // if (!process.env.KEY1)
    //     await enquirer.ask('key1');
    // else
    //     enquirer.answers.key1 = process.env.KEY1;

    // if (!process.env.KEY2)
    //     await enquirer.ask('key2');
    // else
    //     enquirer.answers.key2 = process.env.KEY2;
}

function main() {
    var input = getInputs();
    var quizData = promiseQueueLimiter
}

main();