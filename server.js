require('dotenv').config()
const {app,express} = require('./app')
const {PORT} = process.env
const cors = require("cors")
const {otherError,notFoundError} = require('./middlewares/errorHandling.middleware')
const authRoute = require('./routes/v1/auth.routes')
const coursesRoute = require('./routes/v1/course.routes')
const categoriesRoute = require('./routes/v1/category.routes')

app.use(cors())
app.use(express.json())

app.use('/api/v1/auth',authRoute)
app.use('/api/v1',coursesRoute)
app.use('/api/v1',categoriesRoute)

/// error handling middleware
app.use(otherError)
app.use(notFoundError)

app.listen(PORT, () => console.log('listening to port',PORT))