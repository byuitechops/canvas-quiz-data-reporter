const canvas = require('canvas-api-wrapper');
const QBTools = require('canvas-question-banks');

/*************************************************************************
 * 
 *************************************************************************/
async function searchQuizBanks(courseId, QuestionBanksTools, errorsAccumulator) {
    try {
        try {
            // var QuestionBanksTools = await QBTools(authData);
            var questionBanks = new QuestionBanksTools.QuestionBanks(courseId);
        } catch (e) {
            e.message2 = `Failed Auth or Get Course, for course ${courseId}`;
            throw e;
        }
        // Try getting a list of question banks from the given course
        try {
            await questionBanks.getAll();
        } catch (e) {
            e.message2 = `Question Bank Bank Failure: https://byui.instructure.com/courses/${courseId}, StatusCode: ${e.statusCode}`;
            throw e;
        }
        // For each question bank in that course
        for (let bank of questionBanks.questionBanks) {
            // Try to get all questions from that bank
            try {
                await bank.getQuestions();
            } catch (e) {
                e.message2 = `Question Bank Question Failure: https://byui.instructure.com/courses/${courseId}/question_banks/${bank._id} , StatusCode: ${e.statusCode}`;
                throw e;
            }
        }
    } catch (e) {
        console.log(e.message2);
        errorsAccumulator.push(e);
    }

    // await QuestionBanksTools.logout();
    await questionBanks.page.close().catch(() => console.log("IM THE PROBLEM!"));
    // Return all question banks
    if (Array.isArray(questionBanks.questionBanks))
        return questionBanks.questionBanks;
    else {
        errorsAccumulator.push(new Error(`QuestionBanks Object is not an Array! Returning Empty array instead.\nDetails:\n\tCourse URL: https://byui.instructure.com/courses/${courseId}\n\tCourseID: ${courseId}\nOutputObject: ${JSON.stringify(questionBanks.questionBanks, null, 4)}`))
        return [];
    }
}

/*************************************************************************
 * 
 *************************************************************************/
async function searchCanvasQuizzes(courseId) {
    let courseQuizzes = await canvas.get(`/api/v1/courses/${courseId}/quizzes`);
    for (let quiz in courseQuizzes) {
        courseQuizzes[quiz]._questions = await canvas.get(`/api/v1/courses/${courseId}/quizzes/${courseQuizzes[quiz].id}/questions`);
    }
    return courseQuizzes;
}

/*************************************************************************
 * 
 *************************************************************************/
async function quizDataGatherer(courseId, QuestionBanksTools) {
    let errorsAccumulator = [];
    var quizData = await Promise.all([
        searchQuizBanks(courseId, QuestionBanksTools, errorsAccumulator),
        searchCanvasQuizzes(courseId)
    ]);
    // Change Promise.all from Array to Object
    quizData = {
        courseId: courseId,
        questionBanks: quizData[0],
        canvasQuizzes: quizData[1],
        errors: errorsAccumulator,
    };

    return quizData;
}

module.exports = quizDataGatherer;