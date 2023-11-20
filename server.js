require('dotenv').config()
const {app} = require('./app')
const {PORT} = process.env
const cors = require("cors")
const authRoute = require('./routes/auth.routes')
const {otherError,notFoundError} = require('./middlewares/errorHandling.middleware')

app.use(cors())
app.use('/auth',authRoute)

/// error handling middleware
app.use(otherError)
app.use(notFoundError)

app.listen(PORT, () => console.log('listening to port',PORT))