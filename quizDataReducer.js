
function quizDataReducer (courseData) {
    // SETH TODO Write this function to the best you can AFTER finishing TODOs in quizDataGatherer.js
    reducedQuestions = courseData.map((course) => {
        let allQuestions = {
            questionBank: [],
            canvasQuiz: []
        };
        //console.log(course.canvasQuiz);
        //allQuestions.questionBank = questionBankReader(course.questionBank);
        allQuestions.canvasQuiz = canvasQuizReader(course.canvasQuiz);
        return allQuestions;
    });
    return reducedQuestions;
}

function questionBankReader(questionBank) {

    return questions;
}

function canvasQuizReader(canvasQuiz) {
    var questions = [];
    //doesn't work, dunno why. M'tired.
    canvasQuiz.foreach((quiz) => {
        questions.push(quiz.byuiQuestions);
    });
    console.log(questions);
    return questions;
}

module.exports = quizDataReducer;