const deepSearch = require('./deepSearch');
const questionIssueCheckers = require('./questionIssueCheckers');

function quizDataReducer(questionsData) {
    return checkByQuestionType(questionsData)
}

function checkByQuestionType(questionsData) {
    return Object.keys(questionIssueCheckers).reduce((questionsAcc, questionType) => {
        let targetQuestions = questionReducer(questionsData, questionType, questionIssueCheckers[questionType].checkers, questionIssueCheckers[questionType].keeperKeys);
        return questionsAcc.concat(targetQuestions);
    }, []);
}

/*************************************************************************
 *
 *************************************************************************/
function questionReducer(questionsData, questionType, checkers, keeperKeys) {
    var matchingQuestions = questionsData.filter(filterToQuestionType, []);
    var blankMatchingQuestions = matchingQuestions.reduce(reduceToSearchCriteria, []);
    return blankMatchingQuestions;

    /****************************************************************
     * Reduces list of questions down to the only the question type
     *****************************************************************/
    function filterToQuestionType(question) {
        return question.question_type === questionType;
    }

    /****************************************************************
     *
     *****************************************************************/
    function reduceToSearchCriteria(questionAcc, question) {
        // let flatObject = deepSearch(question, RegExp(/[\s\S]*/)); // abstracts hirarchy of object into values and paths
        // let newKeeperKeys = keeperKeys.map(keys => {
        //     if (!Array.isArray(keys)) {
        //         keys = [keys];
        //     }
        //     return keys.filter(key => {
        //         return flatObject.some(property => last(property.path) === key)
        //     })
        // })
        let criteriaMet = checkers.reduce((checkAcc, checker) => {
            let searchMatches = deepSearch(question, checker.validator)
            // let filterMatches = newKeeperKeys.filter(keyArr => {
            //     // output is a list of keys that had a match
            //     return keyArr.every(key => {
            //         return searchMatches.some(match => {
            //             return match.path[match.path.length - 1] === key;
            //         })
            //     })
            // })
            // console.log(filterMatches)
            let filterMatches = searchMatches.filter((match) => {
                return keeperKeys.some(key => key === match.path.pop())
            })
            if (filterMatches.length > 0) {
                question.question_flagReason.push(checker.flagReason);
                checkAcc = true;
            }
            return checkAcc
        }, false);

        if (criteriaMet)
            questionAcc.push(question);
        return questionAcc;
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

/*
            // let filterMatches = searchMatches.filter((match) => {
            //     return keeperKeys.some(keyToKeep => {
            //         //keyToKeep = ['text','html'] or 'text'
            //         let keyInMatch = match.path.pop(); // any key that has been matched in the object
            //         if (!Array.isArray(keyToKeep))
            //             return keyToKeep === keyValueToMatch;
            //         keyToKeep.every(key => )
            //     })
            // })
            let filterMatches = checker.keeperKeys.filter(keysToKeep => {
                return keysToKeep.every(key => {
                    return searchMatches.some(match => match.path[match.path.length - 1] === key || );
                })

            })
            */