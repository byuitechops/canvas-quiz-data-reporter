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
     *****************************************************************/
    function reduceToSearchCriteria(questionAcc, question) { // For Each Question,
        let criteriaMet = checkers.reduce((checkAcc, checker) => { // Run Each Test,
            let searchMatches = deepSearch(question, checker.validator) // Find ALL positive matches,
            let filterMatches = searchMatches.filter((match) => { // Filter down question list...
                return keeperKeys.some(key => key === match.path.pop()) // ...based on whether there was an issue with... 
            })                                                          // ...a key that match the desired search keys.
            if (filterMatches.length > 0) {                             // If there was one or more issues in a question
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

// quizDataReducerTest();

function quizDataReducerTest() {
    let question = [{
        "course_id": "10001",
        "course_name": "MA",
        "course_sisid": "C.O.1919.Wi.CCT 98.8",
        "course_html_url": "https://byui.instructure.com/courses/10001",
        "quizOrBank_type": "bank",
        "quizOrBank_id": "100001",
        "quizOrBank_title": "Question Bank: Self Assessment",
        "quizOrBank_html_url": "https://byui.instructure.com/courses/10001/question_banks/100001",
        "question_id": 1000001,
        "question_name": "Question",
        "question_type": "short_answer_question",
        "question_text": "<div class=\"byui CCT98\">\n    How Many problems can be found in a course?</p>\n</div>",
        "question_answers": [
            {
                "text": "RESPONSE_-w",
                "html": "response_",
                "weight": 100,
                "comments": "",
                "id": 10001
            }
        ],
        "question_matches": null,
        "question_matching_answer_incorrect_matches": null,
        "question_flagReason": []
    }]

    let checkByType = {
        checkers: [blankTest(), hyphenTest(), textTest('response_'),],
        keeperKeys: ['text'],
    }

    let output = quizDataReducer(question, "short_answer_question", checkByType.checkers, checkByType.keeperKeys);
    console.dir(output, { depth: null })
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
            validator: new RegExp(/-/, 'gi'),
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