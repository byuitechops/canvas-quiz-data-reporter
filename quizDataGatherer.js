const canvas = require('canvas-api-wrapper');
const QB = require('canvas-question-banks');

/*************************************************************************
 * 
 *************************************************************************/
async function searchQuizBanks (courseId, canvasSessionKey, csrfTokenKey) {
    try {
        const QuestionBanks =  QB ({
            canvas_session: canvasSessionKey,
            _csrf_token: csrfTokenKey
        });
        var questionBanks = new QuestionBanks (courseId);
    } catch (e) {
        console.error('COOKIES MIGHT HAVE FAILED')
    }
    // Try getting a list of question banks from the given course
    try {
        await questionBanks.getAll();
    } catch (e) {
        e.message2 = `problem getting QUESTION_BANKS for course https://byui.instructure.com/courses/${courseId}/question_banks/${bank._id}`;
        console.error(e.message2);
    }
    // For each question bank in that course
    for (let bank of questionBanks.questionBanks) {
        // Try to get all questions from that bank
        try {
            await Promise.resolve( setTimeout(() => null, 50) );
            await bank.getQuestions();
        } catch (e) {
            e.message2 = `problem getting QUESTION_DATAS for course https://byui.instructure.com/courses/${courseId}/question_banks/${bank._id}`;
            console.error(e);
            // AARON TODO Record Errors, There will be some
        }
    }
    // Return all question banks
    return questionBanks.questionBanks;
}

/*************************************************************************
 * 
 *************************************************************************/
async function searchCanvasQuizzes (courseId) {
    let courseQuizzes = await canvas.get(`/api/v1/courses/${courseId}/quizzes`);
    for (let quiz in courseQuizzes) {
        courseQuizzes[quiz]._questions = await canvas.get(`/api/v1/courses/${courseId}/quizzes/${courseQuizzes[quiz].id}/questions`);
    }
    return courseQuizzes;
}

/*************************************************************************
 * 
 *************************************************************************/
async function quizDataGatherer(courseId, key1, key2) {
    var quizData = await Promise.all([
        searchQuizBanks(courseId, key1, key2),
        searchCanvasQuizzes(courseId)
    ]);
    // Change Promise.all from Array to Object
    quizData = {
        courseId: courseId,
        questionBanks: quizData[0],
        canvasQuizzes: quizData[1]
    };
    return quizData;
}

module.exports = quizDataGatherer;