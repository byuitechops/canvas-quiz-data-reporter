function quizDataTransformer(quizzesData) {
    var canvasQuizzes = quizzesData.canvasQuizzes;
    var questionBanks = quizzesData.questionBanks;
    var courseData = quizzesData.courseData;
    questionBanks = questionBanks.map((questionBank) => prepareQuestionBank(questionBank, courseData.id));

    var outputCourseData = {
        course_id: (() => courseData.id || null)(),
        course_name: (() => courseData.name || null)(),
        course_html_url: (() => courseData.html_url || courseData.url || courseData.id ? `https://byui.instructure.com/courses/${courseData.id}` : null)(),
        course_quizzes_banks: [].concat(quizAndBankDataFormatter(questionBanks, 'bank'), quizAndBankDataFormatter(canvasQuizzes, 'quiz')) || null
    }

    return outputCourseData;

    function quizAndBankDataFormatter(qbData, type) {
        return qbData.map((quizOrBank) => {
            return {
                quizOrBank_type: type || null,
                quizOrBank_id: quizOrBank.id || null,
                quizOrBank_title: quizOrBank.title || null,
                quizOrBank_html_url: quizOrBank.html_url || null,
                quizOrBank_questions: (() => quizOrBank._questions.map((question) => questionFormatter(question)))() || null
            }
        });
    }

    function questionFormatter(question) {
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

    function prepareQuestionBank(questionBank, courseId) {
        questionBank.html_url = `https://byui.instructure.com/courses/${courseId}/question_banks/${questionBank.id}` || null;
        return questionBank;
    }
}

module.exports = quizDataTransformer;