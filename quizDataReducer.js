
function quizDataReducer (quizData) {
    quizData = quizDataTransformer (quizData);
    return quizData;
}

function quizDataTransformer (quizData) {
    var questionBanks = quizData.questionBanks;
    var canvasQuizzes = quizData.canvasQuizzes;
    var courseData = {
        course_id: (() => quizData.courseData.id || null )(),
        course_name: (() => quizData.courseData.name || null )(),
        course_html_url: (() => quizData.courseData.html_url || quizData.courseData.url || this.course_id ? `https://byui.instructure.com/courses/${this.course_id}` : null )()
    }
    questionBanks = questionBanks.map ( (questionBank) => prepareQuestionBank(questionBank, courseData) );
    courseData.quizAndBankData = [];
    courseData.quizAndBankData = courseData.quizAndBankData.concat( formatQuizAndBankData(questionBanks, 'bank' ) );
    courseData.quizAndBankData = courseData.quizAndBankData.concat( formatQuizAndBankData(canvasQuizzes, 'quiz' ) );
}

function formatQuizAndBankData (qbData, type) {
    return {
        quizBank_type: type,
        quizBank_id: qbData.id,
        quizBank_title: qbData.title,
        quizBank_html_url: qbData.html_url,
        questionData: ( () => qbData._questions.map( (question) => questionFormatter(question) ) )()
    }
}

function questionFormatter (question) {
    return {
        question_id: question.id,
        question_name: question.name,
        question_type: question.type,
        question_text: question.text,
        question_answers: question.answers,
        question_matches: question.matches,
        question_matching_answer_incorrect_matches: question.matching_answer_incorrect_matches,
    }
}

function prepareQuestionBank (questionBank, courseData) {
    questionBank.html_url = `https://byui.instructure.com/courses/${courseData.course_id}/question_banks/${questionBank.id}`;
    return questionBank;
}

// function prepareCanvasQuiz () {}

module.exports = quizDataReducer;