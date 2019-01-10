const canvas = require('canvas-api-wrapper');
const QB = require('canvas-question-banks');

/*************************************************************************
 * 
 *************************************************************************/
async function searchQuizBanks (courseId, key1, key2) {
    // console.log(courseId);
    const QuestionBanks =  QB ({
        canvas_session: key1,
        _csrf_token: key2
    });
    let questionBanks = new QuestionBanks (courseId);
    console.log(questionBanks);
    try {
        await questionBanks.getAll();
        // questionBanks.questionBanks[0].getQuestions();
    } catch (e) {
        console.error(e);
    } 
    return questionBanks;
}

/*************************************************************************
 * 
 *************************************************************************/
async function searchCanvasQuizzes (courseId) {
    return courseId;
}

/*************************************************************************
 * 
 *************************************************************************/
function quizDataGatherer(courseId, key1, key2) {
    return Promise.all([
        searchQuizBanks(courseId, key1, key2),
        searchCanvasQuizzes(courseId)
    ]);
}

module.exports = quizDataGatherer;