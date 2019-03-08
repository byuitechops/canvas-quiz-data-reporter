const deepSearch = require('./deepSearch');
const questionIssueCheckers = require('./questionIssueCheckers');


/*************************************************************************
 * Main
 *************************************************************************/
function quizDataReducer(questionsData) {
    return checkByQuestionType(questionsData)
}

/*************************************************************************
 * Cycle through each question type as defined in questionIssueCheckers.js
 *************************************************************************/
function checkByQuestionType(questionsData) {
    return Object.keys(questionIssueCheckers).reduce((questionsAcc, questionType) => { // for each question type to check
        let targetQuestions = questionReducer(questionsData,                                   // check each question 
            questionType,                                    // with this question type
            questionIssueCheckers[questionType].checkers,    // with these checkers
            questionIssueCheckers[questionType].keeperKeys); // for check matches with these keys.
        return questionsAcc.concat(targetQuestions);                                           // return the collection of matches.
    }, []);
}

/*************************************************************************
 * Seaches each question of the given question type, with the given checkers
 * for matches on the given key names.
 *************************************************************************/
function questionReducer(questionsData, questionType, checkers, keeperKeys) {
    keeperKeys = keeperKeys.map((key => Array.isArray(key) ? key : [].concat(key))); // Make sure each key collection in keeper keys is an array.
    var matchingQuestions = questionsData.filter(filterToQuestionType, []); // Filter down question list to specified question type
    var blankMatchingQuestions = matchingQuestions.reduce(reduceToSearchCriteria, []); // filter question types down to types that also have issues.
    return blankMatchingQuestions; // return list of questions that have issues.

    /****************************************************************
     * Reduces list of questions down to the only the question type
     *****************************************************************/
    function filterToQuestionType(question) {
        return question.question_type === questionType;
    }

    /****************************************************************
     * TODO For each keeper key index, make it a list of ORs. so text || html
     * If text has a problem, but html does not, don't record problem
     * If html has a problem, but text does not, don't record problem
     * If text and html have problems, record problem
     *****************************************************************/
    function reduceToSearchCriteria(questionAcc, question) { // For Each Question,
        let criteriaMet = checkers.reduce((checkAcc, checker) => { // Run Each Test,
            let searchMatches = deepSearch(question, checker.validator) // Find ALL positive matches,
            let someIssuesFound = keeperKeys.some(keyCollection => { // Determine if each issue exists by checking each key collection.
                let issuesFound;                                     // If an issue is found, state so in this var.
                if (checker.checkEvery) {                            // If checkEvery is true... 
                    let filteredKeyCollection = keyCollection.filter(key => { // ...filter down the list of keys in the collection...
                        let matchFound = searchMatches.uniqueKeys.some(uniqueKey => {   // ...to include only keys that exist on the searched object...
                            return key === uniqueKey;                         // ...by comparing each unique key to the key in question.
                        });
                        return matchFound;
                    });                                                       // Then...
                    issuesFound = filteredKeyCollection.every(key => {        // ...check if the problem exists on every key in the filtered collection...
                        return searchMatches.some(match => {                  // ...by checking the keys of all found issues...
                            return key === match.path[match.path.length - 1]; // ...to see if the problem exists on that key in the collection.
                        })
                    })
                } else {                                            // else,
                    let allKeys = [].concat(...keyCollection)       // ...flatten the given key collection...
                    issuesFound = allKeys.some((key) => {                  // ...and search each key name...
                        return searchMatches.some(match => key === match.path[match.path.length - 1]); // ...to see if any matching issue is found.
                    })
                }
                return issuesFound;
            })

            if (someIssuesFound) {                                      // If, after reduction, there are one or more issues in a question,
                question.question_flagReason.push(checker.flagReason);  // Add the checker flag reason to the question
                checkAcc = true;                                        // Then set the accumulator to /true/ to indicate that...
            }                                                           // ...the program should record this question in its output.
            return checkAcc
        }, false);

        if (criteriaMet)                // If the question had one or more issues,
            questionAcc.push(question); // Add the question to the output collection.
        return questionAcc;             // Return the accumulator with the new state of the collection.
    }
}

module.exports = quizDataReducer;