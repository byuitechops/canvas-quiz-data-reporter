const deepSearch = require('./deepSearch');

/*************************************************************************
 *
 *************************************************************************/
function quizDataReducer(questionsData, questionType, checkers, keeperKeys) {
    var matchingQuestions = questionsData.reduce(filterToQuestionType, []);
    var blankMatchingQuestions = matchingQuestions.reduce(reduceToSearchCriteria, []);
    return blankMatchingQuestions;

    /****************************************************************
     * 
     *****************************************************************/
    function filterToQuestionType(questionAcc, question) {
        if (question.question_type === questionType)
            questionAcc.push(question);
        return questionAcc;
    }

    /****************************************************************
     *
     *****************************************************************/
    function reduceToSearchCriteria(questionAcc, question) {

        let criteriaMet = checkers.reduce((checkAcc, checker) => {
            let searchMatches = deepSearch(question, checker.validator);
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

var quizDataReducerTest = () => {
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
        checkers: [blankTest(), hyphenTest(), textTest('response_')],
        keeperKeys: ['text',],
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