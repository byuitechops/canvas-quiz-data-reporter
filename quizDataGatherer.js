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
    try {
        await questionBanks.getAll();
    } catch (e) {
        console.error(e);
    }
    for (let bank of questionBanks.questionBanks) {
        try {
            await bank.getQuestions();
        } catch (e) {
            e.message2 = `problem getting list of questions for course https://byui.instructure.com/courses/${courseId}/question_banks/${bank._id}`;
            console.error(e);
            // AARON TODO Record Errors, There will be some
        }
    }
    return questionBanks.questionBanks;
}

/*************************************************************************
 * 
 *************************************************************************/
async function searchCanvasQuizzes (courseId) {
    // SETH TODO Make API Calls to Canvas to get quizzes and associated quiz questions
    return courseId;
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
        quizBank: quizData[0],
        canvasQuiz: quizData[1]
    };
    return quizData;
}

module.exports = quizDataGatherer;