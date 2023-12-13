require('dotenv').config()
const {app,express} = require('./app')
const {PORT} = process.env
const corsMiddleware = require("./middlewares/cors.middleware")
const {otherError,notFoundError} = require('./middlewares/errorHandling.middleware')
const docsRoute = require('./routes/v1/docs.routes')
const authRoute = require('./routes/v1/auth.routes')
const coursesRoute = require('./routes/v1/course.routes')
const categoriesRoute = require('./routes/v1/category.routes')
const chaptersRoute = require('./routes/v1/chapters.routes')
const videoRoute = require('./routes/v1/video.routes')
const usersRoute = require('./routes/v1/user.routes')
const transactionsRoute = require('./routes/v1/transaction.routes')
const enrollmentsRoute = require('./routes/v1/enrollment.routes')
const ratingsRoute = require('./routes/v1/rating.routes')
const notificationsRoute = require('./routes/v1/notification.routes')
const bodyParser = require('body-parser')
const cookies = require("cookie-parser");




app.use(cookies());
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(corsMiddleware)
app.get('/',(req,res,next) => {
    try {
        res.json({
            success : true,
            message : "hello",
            data : "welcome to itSpace"
        })
    } catch (err) {
        next(err)
    }
})
app.use('/api/v1',docsRoute)
app.use('/api/v1/auth',authRoute)
app.use('/api/v1',coursesRoute)
app.use('/api/v1',categoriesRoute)
app.use('/api/v1',chaptersRoute)
app.use('/api/v1',videoRoute)
app.use('/api/v1',usersRoute)
app.use('/api/v1',transactionsRoute)
app.use('/api/v1',enrollmentsRoute)
app.use('/api/v1',ratingsRoute)
app.use('/api/v1',notificationsRoute)

/// error handling middleware
app.use(otherError)
app.use(notFoundError)

app.listen(PORT, () => console.log('listening to port',PORT))