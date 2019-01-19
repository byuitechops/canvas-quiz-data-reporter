
function quizDataFlattener(courseQuizzesData) {
    var flattenedQuestionData = courseQuizzesData.reduce((questionsAcc, course) => { // for each course
        course.course_quizzes_banks.forEach(quiz => {   // for each quiz in each course
            quiz.quizOrBank_questions.forEach((question) => { // for each question in each quiz
                let dataSetsToSift = [course, quiz, question];
                let questionObject = dataSetsToSift.reduce((dataSetAcc, dataSet) => {
                    let maintainHierarchyKeys = ['question_answers', 'question_matches', 'question_matching_answer_incorrect_matches'];
                    Object.keys(dataSet).forEach(dsKey => {
                        if (typeof dataSet[dsKey] !== 'object' || maintainHierarchyKeys.some((key) => key === dsKey))
                            dataSetAcc[dsKey] = dataSet[dsKey];
                    });
                    return dataSetAcc;
                }, {});
                questionsAcc.push(questionObject);
            });
        });
        return questionsAcc;
    }, []);
    return flattenedQuestionData;
}

module.exports = quizDataFlattener;