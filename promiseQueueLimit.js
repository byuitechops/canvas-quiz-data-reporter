/*************************************************************************
 * A queue limiter for promises and async functions
 * Takes a collection to itterate over, 
 * A function to run over each itteration,
 * A max number of concurrent itterations,
 * And a Callback to run when completed with the list.
 *************************************************************************/
module.exports = function promiseQueueLimit (iteratee, asyncFunction, queueLimit, callback) {
    function* parallelQueue () {
        parallelQueue.queueLimit = queueLimit;
        parallelQueue.currentQueue = 0;
        var outputData = [];
        for (let itteration in iteratee) {
            while (parallelQueue.currentQueue >= parallelQueue.queueLimit) {
                yield parallelQueue.currentQueue;
            }
            ++parallelQueue.currentQueue;
            asyncFunction( iteratee[itteration] )
                .then( (data) => {
                    --parallelQueue.currentQueue; // Immediate Decrement
                    outputData = outputData.concat(data);
                    pqVar.next();
                } )
                .catch( (error) => {
                    --parallelQueue.currentQueue; // Immediate Decrement
                    outputData = outputData.concat(error);
                    pqVar.next();
                } );
        }
        while (parallelQueue.currentQueue > 0) {
            // if (parallelQueue < 5 || parallelQueue % 10 === 0) console.log(`Please wait, there are ${parallelQueue.currentQueue} more courses still processing...`);
            yield parallelQueue.currentQueue;
        }
        callback(null, outputData);
    }
    var pqVar = parallelQueue();
    pqVar.next();
};