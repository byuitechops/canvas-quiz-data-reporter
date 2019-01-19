/*************************************************************************
 *
 *************************************************************************/
function quizDataReducer(questionsData) {
    var output = questionsData.reduce(filterToMatchingQuestions, []);
    // blankQuestions = matchingQuestions.reduce(findBlanksInMatchQuestions, [])
    return output;
}
/****************************************************************
* 
*****************************************************************/
function filterToMatchingQuestions(questionAcc, question) {
    if (question.question_type === 'matching_question')
        questionAcc.push(question);
    return questionAcc;
}
/****************************************************************
*
*****************************************************************/
function findBlanksInMatchQuestions(questionAcc, question) {
    let valuesToCheck = [].concat(
        question.question_text,
        ...question.question_answers.map((answer) => populateBlanks(answer, ['text', 'left', 'right'])),
        ...question.question_matches.map((match) => populateBlanks(match, ['text'])),
    );
    // console.log(valuesToCheck)
    if (blanksAreFound(valuesToCheck))
        questionAcc.push(question);
    return questionAcc;
    /*******************************************************
    *
    ********************************************************/
    function populateBlanks(objectToReference, keyToCheck) {
        return keyToCheck.map(key => {
            return objectToReference[key];
        });
    }
    /*******************************************************
    *
    ********************************************************/
    function blanksAreFound(valuesToCheck) {
        let blanksTest = new RegExp(/^[\n\s\t\ufeff]+$/, 'gi');
        return valuesToCheck.some(value => blanksTest.test(value) || value === null || value === '');
    }
}

module.exports = quizDataReducer;