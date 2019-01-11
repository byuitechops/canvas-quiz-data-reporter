const canvas = require('canvas-api-wrapper');
const QB = require('canvas-question-banks');

/*************************************************************************
 * 
 *************************************************************************/
async function searchQuizBanks (courseId, key1, key2) {
    const QuestionBanks =  QB ({
        canvas_session: key1,
        _csrf_token: key2
    });
    let questionBanks = new QuestionBanks (courseId);
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
            // console.error(e);
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
    // SETH TODO Make API Calls to Canvas to get quizzes and associated quiz questions
    let courseQuizzes = await canvas.get(`/api/v1/courses/${courseId}/quizzes`);
    for (let quiz in courseQuizzes) {
        courseQuizzes[quiz].byuiQuestions = await canvas.get(`/api/v1/courses/${courseId}/quizzes/${courseQuizzes[quiz].id}/questions`);
    }

    // Might be a bit faster, but needs a test to verify
    // await Promise.all (courseQuizzes.map( async (quiz) => {
    //     quiz.byuiQuestions = await canvas.get(`/api/v1/courses/${courseId}/quizzes/${quiz.id}/questions`);
    //     return quiz;
    // }));

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
        questionBank: quizData[0],
        canvasQuiz: quizData[1]
    };
    return quizData;
}

module.exports = quizDataGatherer;