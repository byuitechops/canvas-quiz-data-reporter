
function mainQuizDataReducer (courseQuizzesData) {
    courseQuizzesData = quizDataTransformer (courseQuizzesData);
    courseQuizzesData = quizDataReducer(courseQuizzesData);
    return courseQuizzesData;
}

function quizDataTransformer (quizzesData) {
    var canvasQuizzes = quizzesData.canvasQuizzes;
    var questionBanks = quizzesData.questionBanks;
    var courseData = quizzesData.courseData;
    questionBanks = questionBanks.map((questionBank) => prepareQuestionBank(questionBank, courseData.id) );
    
    var outputCourseData = {
        course_id: (() => courseData.id || null )(),
        course_name: (() => courseData.name || null )(),
        course_html_url: (() => courseData.html_url || courseData.url || courseData.id ? `https://byui.instructure.com/courses/${courseData.id}` : null )(),
        course_quizzes_banks: [].concat( quizAndBankDataFormatter(questionBanks, 'bank'), quizAndBankDataFormatter(canvasQuizzes, 'quiz') ) || null
    }
    
    return outputCourseData;

    function quizAndBankDataFormatter (qbData, type) {
            return qbData.map ( ( quizOrBank ) => {
                return {
                    quiz_bank_type: type || null,
                    quiz_bank_id: quizOrBank.id || null,
                    quiz_bank_title: quizOrBank.title || null,
                    quiz_bank_html_url: quizOrBank.html_url || null,
                    quiz_bank_questions: (() => quizOrBank._questions.map( (question) => questionFormatter(question) ) )() || null
                }
            } );
    }
    
    function questionFormatter (question) {
            return {
                question_id: question.id || null,
                question_name: question.question_name || null,
                question_type: question.question_type || null,
                question_text: question.question_text || null,
                question_answers: question.answers || null,
                question_matches: question.matches || null,
                question_matching_answer_incorrect_matches: question.matching_answer_incorrect_matches || null,
            }
    }
    
    function prepareQuestionBank (questionBank, courseId) {
            questionBank.html_url = `https://byui.instructure.com/courses/${courseId}/question_banks/${questionBank.id}` || null;
            return questionBank;
    }
}


function quizDataReducer (courseQuizzesData) {
    courseQuizzesData.course_quizzes_banks = courseQuizzesData.course_quizzes_banks
        .reduce( (quizAcc, quiz) => {
            let quizOutput = Object.assign({}, quiz);
            quizOutput.quiz_bank_questions = quizOutput.quiz_bank_questions.reduce(filterToMatchingQuestions, []);
            quizOutput.quiz_bank_questions = quizOutput.quiz_bank_questions.reduce(findBlanksInMatchQuestions, []);
            if (quizOutput.quiz_bank_questions.length > 0)
                quizAcc.push(quizOutput);
            return quizAcc;
        }, [])
    return courseQuizzesData;

    function filterToMatchingQuestions (questionAcc, question) {
        if (question.question_type === 'matching_question')
            questionAcc.push(question);
        return questionAcc;
    }

    function findBlanksInMatchQuestions(questionAcc, question) {
        let valuesToCheck = [].concat(
            question.question_text,
            ...question.question_answers.map ((answer) => populateBlanks( answer, ['text', 'left', 'right'])),
            ...question.question_matches.map ((match) => populateBlanks( match, ['text'])),
            );
            // console.log(valuesToCheck)
        if ( blanksAreFound (valuesToCheck) )
            questionAcc.push(question);
        return questionAcc;

        function populateBlanks (objectToReference, keyToCheck) {
            return keyToCheck.map (key => {
                return objectToReference[key];
            });
        }

        function blanksAreFound (valuesToCheck) {
            let blanksTest = new RegExp(/^[\n\s\t\ufeff]+$/, 'gi');
            return valuesToCheck.some(value => blanksTest.test(value) || value === null || value === '' || value === undefined);
        }
    }
}

module.exports = mainQuizDataReducer;