function mainQuizDataReducer(courseQuizzesData) {
    // courseQuizzesData = quizDataTransformer(courseQuizzesData);
    courseQuizzesData = quizDataReducer(courseQuizzesData);
    return courseQuizzesData;
}

function quizDataReducer(courseQuizzesData) {
    courseQuizzesData.course_quizzes_banks = courseQuizzesData.course_quizzes_banks
        .reduce((quizAcc, quiz) => {
            let quizOutput = Object.assign({}, quiz);
            quizOutput.quiz_bank_questions = quizOutput.quiz_bank_questions.reduce(filterToMatchingQuestions, []);
            quizOutput.quiz_bank_questions = quizOutput.quiz_bank_questions.reduce(findBlanksInMatchQuestions, []);
            if (quizOutput.quiz_bank_questions.length > 0)
                quizAcc.push(quizOutput);
            return quizAcc;
        }, [])
    return courseQuizzesData;

    function filterToMatchingQuestions(questionAcc, question) {
        if (question.question_type === 'matching_question')
            questionAcc.push(question);
        return questionAcc;
    }

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

        function populateBlanks(objectToReference, keyToCheck) {
            return keyToCheck.map(key => {
                return objectToReference[key];
            });
        }

        function blanksAreFound(valuesToCheck) {
            let blanksTest = new RegExp(/^[\n\s\t\ufeff]+$/, 'gi');
            return valuesToCheck.some(value => blanksTest.test(value) || value === null || value === '');
        }
    }
}

module.exports = mainQuizDataReducer;