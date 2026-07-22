function errorHandler(err, req, res, next){

    console.error("ERROR:", err);


    res.status(500).json({

        error:"حدث خطأ في السيرفر"

    });

}


module.exports = errorHandler;