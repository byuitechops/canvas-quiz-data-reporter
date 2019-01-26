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

        let criteriaMet = checkers.some(checker => {
            let searchMatches = deepSearch(question, checker.validator);
            let filterMatches = searchMatches.filter((match) => {
                return keeperKeys.some(key => key === match.path.pop())
            })
            if (filterMatches.length > 0) {
                question.question_flagReason.push(checker.flagReason);
                return true;
            }
            return false;
        });

        if (criteriaMet)
            questionAcc.push(question);
        return questionAcc;

        /*******************************************************
        *
        ********************************************************/
        function blanksAreFound(valuesToCheck) {
            let blanksTest = new RegExp(/^[\n\s\t\ufeff]+$/, 'gi');
            return valuesToCheck.some(value => blanksTest.test(value) || value === null || value === '');
        }
    }
}

module.exports = quizDataReducer;